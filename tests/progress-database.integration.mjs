// Explicit opt-in: node --test tests/progress-database.integration.mjs
// Creates temporary accounts inside a transaction that is ALWAYS rolled back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from '../backend/node_modules/dotenv/lib/main.js';
import { createDatabasePool } from '../backend/src/database.js';
import { getSavedProgress, saveLessonProgress } from '../backend/src/progressService.js';
import { loadLesson } from '../backend/src/markdownLesson.js';
import {
    lessonModuleProgress,
    recommendNextLesson
} from '../frontend/src/services/learningRecommendations.js';

test(
    'live PostgreSQL Arrays saves, reload, duplicates, isolation and module completion',
    { timeout: 180000 },
    async () => {
        process.chdir(fileURLToPath(new URL('../backend/', import.meta.url)));
        dotenv.config({ path: '.env' });
        const pool = createDatabasePool();
        let db;
        try {
            db = await pool.connect();
            await db.query('BEGIN');
            await db.query("SET LOCAL statement_timeout = '15s'");
            const owners = [randomUUID(), randomUUID()];
            for (const owner of owners) {
                await db.query(
                    `INSERT INTO users (id, first_name, last_name, username, email, password_hash)
                VALUES ($1, 'Progress', 'Integration', $2, $3, 'not-a-login-credential')`,
                    [owner, `test-${owner}`, `test-${owner}@example.invalid`]
                );
            }
            // Run the real service using savepoints instead of committing the outer
            // disposable test transaction. No existing account is touched.
            const adapter = {
                release() {},
                query(sql, values) {
                    if (sql === 'BEGIN') return db.query('SAVEPOINT progress_write');
                    if (sql === 'COMMIT') return db.query('RELEASE SAVEPOINT progress_write');
                    if (sql === 'ROLLBACK') return db.query('ROLLBACK TO SAVEPOINT progress_write');
                    return db.query(sql, values);
                }
            };
            const servicePool = { connect: async () => adapter };
            const arrays = await loadLesson(17);
            const complexity = await loadLesson(1);
            const next = await loadLesson(2);
            const initial = await getSavedProgress(db, owners[0]);
            assert.equal(lessonModuleProgress(arrays, initial).percentage, 0);
            let saved = await saveLessonProgress(
                servicePool,
                owners[0],
                arrays.lessons[0].id,
                true
            );
            assert.equal(lessonModuleProgress(arrays, saved).completed, 1);
            const reloaded = await getSavedProgress(db, owners[0]);
            assert.deepEqual(reloaded.completedCheckpoints, saved.completedCheckpoints);
            const activityBefore = await db.query(
                'SELECT count(*)::integer AS count FROM user_activity WHERE user_id = $1',
                [owners[0]]
            );
            saved = await saveLessonProgress(servicePool, owners[0], arrays.lessons[0].id, true);
            assert.equal(lessonModuleProgress(arrays, saved).completed, 1);
            const activityAfter = await db.query(
                'SELECT count(*)::integer AS count FROM user_activity WHERE user_id = $1',
                [owners[0]]
            );
            assert.equal(activityAfter.rows[0].count, activityBefore.rows[0].count);
            assert.deepEqual((await getSavedProgress(db, owners[1])).completedCheckpoints, []);
            for (const item of arrays.lessons.slice(1)) {
                saved = await saveLessonProgress(servicePool, owners[0], item.id, true);
            }
            assert.equal(lessonModuleProgress(arrays, saved).percentage, 100);
            assert.ok(saved.completedWeeks.includes(17));
            for (const chapter of [complexity, next]) {
                const result = await saveLessonProgress(
                    servicePool,
                    owners[1],
                    chapter.lessons[0].id,
                    true
                );
                assert.ok(result.completedCheckpoints.includes(chapter.lessons[0].id));
            }
            const recommendation = recommendNextLesson([arrays, next], { ...saved, ready: true });
            assert.equal(recommendation.lesson.id, next.lessons[0].id);
            saved = await saveLessonProgress(servicePool, owners[0], arrays.lessons[0].id, false);
            assert.equal(lessonModuleProgress(arrays, saved).completed, arrays.lessons.length - 1);
            assert.equal(saved.completedWeeks.includes(17), false);
            await assert.rejects(
                saveLessonProgress(servicePool, owners[0], 'w17-section-missing', true),
                { code: 'UNKNOWN_LESSON' }
            );
        } finally {
            if (db) {
                try {
                    await db.query('ROLLBACK');
                } finally {
                    db.release();
                }
            }
            await pool.end();
        }
    }
);
