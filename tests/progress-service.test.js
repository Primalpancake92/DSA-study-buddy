import test from 'node:test';
import assert from 'node:assert/strict';
import { getSavedProgress, saveLessonProgress } from '../backend/src/progressService.js';
import { loadLesson, parseLessonMarkdown } from '../backend/src/markdownLesson.js';
import { readFile } from 'node:fs/promises';
import { progressFailure } from '../backend/src/progressErrors.js';

test('migration drift is actionable without exposing SQL or private data', () => {
    const error = {
        code: '23514',
        constraint: 'user_progress_week_number_check',
        message: 'private SQL values'
    };
    assert.equal(progressFailure(error).code, 'PROGRESS_SCHEMA_OUTDATED');
    assert.equal(progressFailure(error).status, 503);
    assert.equal(progressFailure(error).message.includes('private'), false);
    assert.equal(progressFailure({ code: '42P01' }).code, 'PROGRESS_SCHEMA_OUTDATED');
    assert.equal(progressFailure({ code: 'ECONNREFUSED' }).code, 'PROGRESS_UNAVAILABLE');
    assert.equal(progressFailure({}).code, 'PROGRESS_SAVE_FAILED');
});

test('all sections of Arrays use distinct stable ID-17 identities, not display sequence 2', async () => {
    const arrays = await loadLesson(17);
    assert.equal(arrays.sequence, 2);
    assert.equal(new Set(arrays.lessons.map((item) => item.id)).size, arrays.lessons.length);
    for (const item of arrays.lessons) {
        assert.ok(item.id.startsWith('w17-section-'));
        assert.ok(arrays.sections.some((section) => section.id === item.sectionId));
    }
});

test('deployment entry points apply versioned migrations before accepting requests', async () => {
    const backend = JSON.parse(
        await readFile(new URL('../backend/package.json', import.meta.url), 'utf8')
    );
    const root = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(backend.scripts.prestart, 'npm run migrate');
    assert.equal(root.scripts.server, 'npm --prefix backend start');
    const migration = await readFile(
        new URL('../backend/migrations/007_split_foundations.sql', import.meta.url),
        'utf8'
    );
    assert.match(migration, /CHECK \(week_number BETWEEN 1 AND 17\)/);
    assert.match(migration, /ON CONFLICT \(user_id, week_number\) DO NOTHING/);
});

test('stable reading IDs survive a heading rename without reassigning saved work', async () => {
    const markdown = await readFile(
        new URL('../docs/weekly_content/week-02.md', import.meta.url),
        'utf8'
    );
    const old = await loadLesson(2);
    const renamed = parseLessonMarkdown(
        2,
        markdown.replace('## Core Theory\n', '## A clearer explanation\n')
    );
    const id = old.lessons.find((item) => item.sectionId === 'core-theory').id;
    assert.equal(renamed.lessons.find((item) => item.id === id).sectionId, 'a-clearer-explanation');
    assert.deepEqual(
        renamed.lessons.map((item) => item.id),
        old.lessons.map((item) => item.id)
    );
    assert.throws(
        () => parseLessonMarkdown(2, markdown.replace(`<!-- lesson-id:${id} -->`, '')),
        /stable lesson IDs/
    );
});

test('invalid lesson IDs fail before acquiring a database connection', async () => {
    const pool = {
        connect() {
            assert.fail('Must validate before connecting');
        }
    };
    await assert.rejects(saveLessonProgress(pool, 'owner', 'w1-section-deleted', true), {
        code: 'UNKNOWN_LESSON',
        status: 400
    });
});

test('connection acquisition failures propagate to controlled route handling', async () => {
    const failure = Object.assign(new Error('unavailable'), { code: 'ECONNREFUSED' });
    const chapter = await loadLesson(1);
    await assert.rejects(
        saveLessonProgress(
            {
                async connect() {
                    throw failure;
                }
            },
            'owner',
            chapter.lessons[0].id,
            true
        ),
        (error) => error === failure
    );
});

test('progress reads scope every query to the supplied authenticated owner', async () => {
    const snapshot = await getSavedProgress(
        {
            async query(sql, values) {
                assert.deepEqual(values, ['owner']);
                assert.match(sql, /user_id = \$1/);
                assert.equal((sql.match(/user_id = \$1/g) || []).length, 3);
                return {
                    rows: [
                        {
                            completedWeeks: [1],
                            completedCheckpoints: ['done'],
                            startedLessons: ['pending']
                        }
                    ]
                };
            }
        },
        'owner'
    );
    assert.deepEqual(snapshot, {
        completedWeeks: [1],
        completedCheckpoints: ['done'],
        startedLessons: ['pending']
    });
});

test('session disappearance rolls back and releases the checked-out client', async () => {
    const calls = [];
    const client = {
        async query(sql) {
            calls.push(sql);
            return { rowCount: 0, rows: [] };
        },
        release() {
            calls.push('release');
        }
    };
    const chapter = await loadLesson(1);
    await assert.rejects(
        saveLessonProgress({ connect: async () => client }, 'owner', chapter.lessons[0].id, true),
        { code: 'AUTH_REQUIRED', status: 401 }
    );
    assert.deepEqual(calls, [
        'BEGIN',
        'SELECT id FROM users WHERE id = $1 FOR UPDATE',
        'ROLLBACK',
        'release'
    ]);
});
