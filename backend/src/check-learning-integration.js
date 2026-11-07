import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createDatabasePool, logDatabaseError } from './database.js';
import {
    defaultSettings,
    updateSettings,
    getSettings,
    listSessions,
    revokeOtherSessions,
    exportAccount
} from './settingsModel.js';
import { savePracticeProgress } from './practiceService.js';
import { practiceCatalog } from '../../shared/practiceCatalog.js';
import { hashPassword } from './passwords.js';
import { getSavedProgress, saveLessonProgress } from './progressService.js';
import { loadLesson } from './markdownLesson.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const pool = createDatabasePool();
let client;
try {
    client = await pool.connect();
    await client.query('BEGIN');
    const schema = `dsa_check_${randomBytes(8).toString('hex')}`;
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET LOCAL search_path TO ${schema}, public`);
    // Fixture baseline only; the two feature migrations are executed unchanged.
    const baseline = (
        await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8')
    )
        .replace(/^CREATE EXTENSION[^;]+;/gm, '')
        .replace(/\bcitext\b/g, 'text');
    await client.query(baseline);
    for (const name of [
        '003_email_verification.sql',
        '004_activity_history.sql',
        '005_practice_progress.sql',
        '006_account_settings.sql',
        '005_practice_progress.sql',
        '006_account_settings.sql'
    ])
        await client.query(
            await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8')
        );
    const owners = [randomUUID(), randomUUID()];
    const hash = await hashPassword('isolated-fixture-password');
    for (let i = 0; i < 2; i++)
        await client.query(
            'INSERT INTO users(id,first_name,last_name,username,email,password_hash,email_verified_at) VALUES ($1,$2,$3,$4,$5,$6,now())',
            [
                owners[i],
                'Integration',
                'Fixture',
                `fixture_${i}`,
                `fixture${i}@example.invalid`,
                hash
            ]
        );
    // Run the curriculum migration twice in this rollback-only schema. No
    // production account or progress rows are accessed by these fixture queries.
    await client.query(
        "INSERT INTO user_progress(user_id, week_number, completion_status, completed_lesson_count, total_lesson_count) VALUES ($1, 1, 'completed', 3, 3), ($1, 2, 'started', 1, 3)",
        [owners[0]]
    );
    await client.query(
        "INSERT INTO lesson_progress(user_id, lesson_id, status, completed_at) VALUES ($1, 'w1-array-method-contracts', 'completed', now()), ($1, 'w1-section-core-theory', 'completed', now())",
        [owners[0]]
    );
    const beforeSplit = (
        await client.query('SELECT * FROM user_progress WHERE user_id = $1 ORDER BY week_number', [
            owners[0]
        ])
    ).rows;
    const splitMigration = await readFile(
        new URL('../migrations/007_split_foundations.sql', import.meta.url),
        'utf8'
    );
    await client.query(splitMigration);
    await client.query(splitMigration);
    assert.deepEqual(
        (
            await client.query(
                'SELECT * FROM user_progress WHERE user_id = $1 AND week_number <> 17 ORDER BY week_number',
                [owners[0]]
            )
        ).rows,
        beforeSplit
    );
    assert.equal(
        (
            await client.query(
                'SELECT count(*)::int AS count FROM user_progress WHERE week_number = 17'
            )
        ).rows[0].count,
        2
    );
    assert.equal(
        (
            await client.query(
                "SELECT status FROM lesson_progress WHERE user_id = $1 AND lesson_id = 'w17-array-method-contracts'",
                [owners[0]]
            )
        ).rows[0].status,
        'completed'
    );
    assert.equal(
        (
            await client.query(
                "SELECT count(*)::int AS count FROM lesson_progress WHERE lesson_id = 'w17-section-core-theory'"
            )
        ).rows[0].count,
        0
    );
    assert.equal(
        (
            await client.query(
                'SELECT count(*)::int AS count FROM lesson_progress WHERE user_id = $1',
                [owners[1]]
            )
        ).rows[0].count,
        0
    );
    await client.query(
        "UPDATE lesson_progress SET status = 'started', completed_at = NULL WHERE user_id = $1 AND lesson_id = 'w17-array-method-contracts'",
        [owners[0]]
    );
    await client.query(splitMigration);
    assert.equal(
        (
            await client.query(
                "SELECT status FROM lesson_progress WHERE user_id = $1 AND lesson_id = 'w17-array-method-contracts'",
                [owners[0]]
            )
        ).rows[0].status,
        'started',
        'Rerunning migration must not overwrite newer progress'
    );
    let counter = 0;
    const saves = [];
    const nestedClient = {
        release() {},
        async query(sql, values) {
            if (sql.startsWith('BEGIN')) {
                const name = `nested_${++counter}`;
                saves.push(name);
                return client.query(`SAVEPOINT ${name}`);
            }
            if (sql === 'COMMIT') return client.query(`RELEASE SAVEPOINT ${saves.pop()}`);
            if (sql === 'ROLLBACK') {
                const name = saves.pop();
                await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
                return client.query(`RELEASE SAVEPOINT ${name}`);
            }
            return client.query(sql, values);
        }
    };
    const isolatedPool = {
        connect: async () => nestedClient,
        query: (...args) => client.query(...args)
    };
    const chapter = await loadLesson(1);
    const [first, second, third] = chapter.lessons;
    // Prove the reported failure using the original production SQL, then roll
    // back that statement before exercising the actual fixed service.
    await client.query('SAVEPOINT original_checkpoint_query');
    await assert.rejects(
        client.query(
            "UPDATE user_progress SET completed_lesson_count = $1, total_lesson_count = $2, completion_status = CASE WHEN $1 = $2 AND $2 > 0 THEN 'completed' ELSE 'started' END WHERE user_id = $3 AND week_number = $4",
            [1, chapter.lessons.length, owners[1], 1]
        ),
        { code: '42883' }
    );
    await client.query('ROLLBACK TO SAVEPOINT original_checkpoint_query');
    await client.query('RELEASE SAVEPOINT original_checkpoint_query');
    const initialOther = await getSavedProgress(isolatedPool, owners[0]);
    await saveLessonProgress(isolatedPool, owners[1], first.id, true);
    const firstTimestamp = (
        await client.query(
            "UPDATE lesson_progress SET completed_at = '2020-01-01T00:00:00Z'::timestamptz WHERE user_id=$1 AND lesson_id=$2 RETURNING completed_at",
            [owners[1], first.id]
        )
    ).rows[0].completed_at;
    await saveLessonProgress(isolatedPool, owners[1], second.id, true);
    const duplicate = await saveLessonProgress(isolatedPool, owners[1], first.id, true);
    assert.ok(duplicate.completedCheckpoints.includes(first.id));
    assert.ok(duplicate.completedCheckpoints.includes(second.id));
    assert.deepEqual(
        (
            await client.query(
                'SELECT completed_at FROM lesson_progress WHERE user_id=$1 AND lesson_id=$2',
                [owners[1], first.id]
            )
        ).rows[0].completed_at,
        firstTimestamp
    );
    assert.equal(
        (
            await client.query(
                'SELECT count(*)::integer AS count FROM user_activity WHERE user_id=$1',
                [owners[1]]
            )
        ).rows[0].count,
        2,
        'Duplicates do not create duplicate activity'
    );
    assert.equal(
        (await saveLessonProgress(isolatedPool, owners[1], first.id, false, true)).completed,
        true,
        'A stale start cannot reopen completed work'
    );
    const failingPool = {
        connect: async () => ({
            release() {},
            query(sql, values) {
                if (sql.startsWith('INSERT INTO user_activity')) {
                    throw Object.assign(new Error('private-fixture-details'), { code: 'XX000' });
                }
                return nestedClient.query(sql, values);
            }
        })
    };
    await assert.rejects(saveLessonProgress(failingPool, owners[1], third.id, true));
    assert.ok(
        !(await getSavedProgress(isolatedPool, owners[1])).completedCheckpoints.includes(third.id),
        'Activity failure rolls back lesson and module changes'
    );
    for (const lesson of chapter.lessons.slice(2)) {
        await saveLessonProgress(isolatedPool, owners[1], lesson.id, true);
    }
    assert.ok((await getSavedProgress(isolatedPool, owners[1])).completedWeeks.includes(1));
    await saveLessonProgress(isolatedPool, owners[1], 'w1-0', false);
    assert.ok(
        (await getSavedProgress(isolatedPool, owners[1])).completedWeeks.includes(1),
        'A mastery toggle cannot clear completed reading progress'
    );
    const reopened = await saveLessonProgress(isolatedPool, owners[1], first.id, false);
    assert.ok(!reopened.completedWeeks.includes(1));
    assert.ok(reopened.startedLessons.includes(first.id));
    assert.equal(reopened.completedCheckpoints.length, chapter.lessons.length - 1);
    assert.deepEqual(
        await getSavedProgress(isolatedPool, owners[0]),
        initialOther,
        'No other account progress changed'
    );
    await assert.rejects(saveLessonProgress(isolatedPool, owners[1], 'w1-section-deleted', true), {
        code: 'UNKNOWN_LESSON'
    });
    await updateSettings(isolatedPool, owners[0], {
        appearance: { theme: 'light' },
        learning: { dailyMinutes: 45 },
        connections: { leetcode: 'fixture_user' }
    });
    assert.equal((await getSettings(isolatedPool, owners[0])).learning.dailyMinutes, 45);
    assert.deepEqual(await getSettings(isolatedPool, owners[1]), defaultSettings);
    const problem = practiceCatalog[0];
    await savePracticeProgress(isolatedPool, owners[0], problem, {
        status: 'solved',
        notes: 'Fixture notes',
        attemptsCount: 2
    });
    await savePracticeProgress(isolatedPool, owners[1], problem, {
        status: 'attempted',
        notes: 'Other fixture'
    });
    const exported = await exportAccount(isolatedPool, owners[0]);
    assert.equal(exported.practice.length, 1);
    assert.equal(exported.practice[0].notes, 'Fixture notes');
    assert.equal(JSON.stringify(exported).includes('password_hash'), false);
    assert.equal(JSON.stringify(exported).includes('Other fixture'), false);
    for (const [sid, userId] of [
        ['fixture-current', owners[0]],
        ['fixture-other', owners[0]],
        ['fixture-b', owners[1]]
    ])
        await client.query(
            "INSERT INTO sessions(sid,sess,expire) VALUES($1,$2,now()+interval '1 hour')",
            [sid, JSON.stringify({ userId })]
        );
    assert.equal((await listSessions(isolatedPool, owners[0], 'fixture-current')).length, 2);
    assert.equal(await revokeOtherSessions(isolatedPool, owners[0], 'fixture-current'), 1);
    assert.equal((await listSessions(isolatedPool, owners[1], 'fixture-b')).length, 1);
    await client.query('DELETE FROM users WHERE id = $1', [owners[0]]);
    assert.equal(
        (await client.query('SELECT * FROM user_settings WHERE user_id=$1', [owners[0]])).rowCount,
        0
    );
    assert.equal(
        (await client.query('SELECT * FROM user_problem_progress WHERE user_id=$1', [owners[1]]))
            .rowCount,
        1
    );
    console.info(
        'PASS: original checkpoint SQL reproduced 42883; fixed checkpoint transactions, duplicate saves, stale starts, rollback on failure, module completion/reopening, account isolation, migration reruns, settings/practice persistence, safe export and sessions. All fixture changes will be rolled back.'
    );
} catch (error) {
    logDatabaseError(error, 'isolated-learning-integration');
    process.exitCode = 1;
} finally {
    if (client) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // Cleanup must not hide the integration check's original failure.
        }
        client.release();
    }
    await pool.end();
}
