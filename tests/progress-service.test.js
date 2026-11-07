import test from 'node:test';
import assert from 'node:assert/strict';
import { getSavedProgress, saveLessonProgress } from '../backend/src/progressService.js';
import { loadLesson, parseLessonMarkdown } from '../backend/src/markdownLesson.js';
import { readFile } from 'node:fs/promises';

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
