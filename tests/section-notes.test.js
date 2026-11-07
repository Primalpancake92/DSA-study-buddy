import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createSectionNotesRouter } from '../backend/src/sectionNotesRoutes.js';
import { isSectionNoteTarget } from '../backend/src/sectionNotesService.js';
import { loadLesson } from '../backend/src/markdownLesson.js';
import { weekCatalog } from '../shared/curriculum.js';
import { exportAccount } from '../backend/src/settingsModel.js';

function memoryPool() {
    const rows = new Map();
    const calls = [];
    return {
        rows,
        calls,
        fail: false,
        async query(sql, params) {
            calls.push({ sql, params });
            if (this.fail) throw new Error('private note and SQL secret');
            const key = JSON.stringify(params.slice(0, 3));
            const previous = rows.get(key);
            if (sql.startsWith('SELECT')) return { rows: previous ? [previous] : [] };
            if (
                (sql.startsWith('INSERT') && previous) ||
                (sql.startsWith('UPDATE') && (!previous || previous.version !== params[5]))
            )
                return { rows: [] };
            const row = {
                content: params[3],
                is_deleted: params[4],
                version: (previous?.version || 0) + 1,
                updated_at: '2026-11-08T00:00:00Z',
                user_id: 'must not escape'
            };
            rows.set(key, row);
            return { rows: [row] };
        }
    };
}
const auth = (req, res, next) =>
    req.session?.userId ? next() : res.status(401).json({ error: 'Sign in.' });
const csrf = (req, res, next) =>
    req.headers['x-csrf-token'] === 'valid'
        ? next()
        : res.status(403).json({ error: 'Invalid CSRF token.' });
function request(
    router,
    method,
    sectionId,
    body,
    { userId = 'alice', token = 'valid', moduleId = 2 } = {}
) {
    return new Promise((resolve, reject) => {
        const req = {
            method,
            url: `/${moduleId}/${sectionId}`,
            body,
            session: userId ? { userId } : {},
            headers: { 'x-csrf-token': token },
            ip: '127.0.0.1',
            app: { get: () => false }
        };
        const res = new EventEmitter();
        res.statusCode = 200;
        res.headers = {};
        res.setHeader = (key, value) => {
            res.headers[key.toLowerCase()] = value;
        };
        res.set = (key, value) => {
            res.setHeader(key, value);
            return res;
        };
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (value) => {
            res.body = value;
            resolve(res);
            return res;
        };
        router.handle(req, res, (error) => {
            if (!error) return reject(new Error('Unexpected router fallthrough'));
            // Same safe response contract as the application's final error handler.
            res.status(500).json({ error: 'The server could not complete the request.' });
        });
    });
}
const target = (await loadLesson(2)).lessons[0].id;
const setup = () => {
    const pool = memoryPool();
    return {
        pool,
        router: createSectionNotesRouter({ pool, requireAuth: auth, csrfProtection: csrf })
    };
};

test('all module sections use stable reading IDs or explicitly valid synthetic IDs', async () => {
    for (const { id } of weekCatalog) {
        const lesson = await loadLesson(id);
        for (const section of lesson.sections) {
            const reading = lesson.lessons.find((item) => item.sectionId === section.id);
            assert.equal(
                await isSectionNoteTarget(id, reading?.id || `w${id}-section-${section.id}`),
                true
            );
        }
        assert.equal(await isSectionNoteTarget(id, `w${id}-section-coding-practice`), id !== 1);
    }
    for (const [moduleId, sectionId] of [
        [999, target],
        [1, target],
        [2, 'core-theory'],
        [2, 'w2-section-invented']
    ])
        assert.equal(await isSectionNoteTarget(moduleId, sectionId), false);
});

test('router authenticates every operation and protects both mutations with CSRF', async () => {
    const { pool, router } = setup();
    for (const method of ['GET', 'PUT', 'DELETE']) {
        assert.equal((await request(router, method, target, {}, { userId: null })).statusCode, 401);
        if (method !== 'GET')
            assert.equal(
                (await request(router, method, target, {}, { token: 'bad' })).statusCode,
                403
            );
    }
    assert.equal(pool.calls.length, 0);
    assert.throws(() => createSectionNotesRouter({ pool, requireAuth: auth }));
});

test('router validates strict payloads and section identity before any database access', async () => {
    const { pool, router } = setup();
    for (const body of [
        null,
        {},
        { content: 1, version: 0 },
        { content: 'x'.repeat(20001), version: 0 },
        { content: '', version: -1 },
        { content: '', version: 0.5 },
        { content: '', version: '0' },
        { content: '', version: 0, userId: 'bob' }
    ])
        assert.equal((await request(router, 'PUT', target, body)).statusCode, 400);
    assert.equal(
        (await request(router, 'DELETE', target, { version: 0, content: '' })).statusCode,
        400
    );
    assert.equal((await request(router, 'GET', 'w2-section-invented')).statusCode, 404);
    assert.equal((await request(router, 'GET', target, null, { moduleId: 999 })).statusCode, 404);
    assert.equal(pool.calls.length, 0);
});

test('atomic saves isolate owners, sections and modules; deletion preserves version against stale resurrection', async () => {
    const { pool, router } = setup();
    const absent = await request(router, 'GET', target);
    assert.deepEqual(absent.body, {
        note: { content: '', version: 0, updatedAt: null, exists: false }
    });
    assert.equal(absent.headers['cache-control'], 'private, no-store');
    const content = "<script>plain text</script>'; DROP TABLE users; --";
    const first = await Promise.all(
        [0, 1].map(() => request(router, 'PUT', target, { content, version: 0 }))
    );
    assert.deepEqual(first.map((res) => res.statusCode).sort(), [200, 409]);
    assert.equal(first.find((res) => res.statusCode === 409).body.code, 'NOTE_CONFLICT');
    assert.equal(
        (await request(router, 'GET', target, null, { userId: 'bob' })).body.note.exists,
        false
    );
    const nextModuleTarget = (await loadLesson(3)).lessons[0].id;
    assert.equal(
        (await request(router, 'GET', nextModuleTarget, null, { moduleId: 3 })).body.note.exists,
        false
    );
    assert.equal(
        (
            await request(
                router,
                'PUT',
                target,
                { content: 'Bob only', version: 0 },
                { userId: 'bob' }
            )
        ).statusCode,
        200
    );
    assert.equal((await request(router, 'GET', target)).body.note.content, content);
    const other = (await loadLesson(2)).lessons[1].id;
    assert.equal((await request(router, 'GET', other)).body.note.exists, false);
    assert.equal(
        (await request(router, 'PUT', target, { content: '', version: 1 })).body.note.exists,
        true
    );
    const deleted = await request(router, 'DELETE', target, { version: 2 });
    assert.deepEqual(deleted.body.note, {
        content: '',
        version: 3,
        updatedAt: '2026-11-08T00:00:00Z',
        exists: false
    });
    assert.deepEqual((await request(router, 'GET', target)).body, deleted.body);
    for (const version of [0, 1, 2])
        assert.equal(
            (await request(router, 'PUT', target, { content: 'stale', version })).statusCode,
            409
        );
    const winners = await Promise.all(
        ['a', 'b'].map((content) => request(router, 'PUT', target, { content, version: 3 }))
    );
    assert.deepEqual(winners.map((res) => res.statusCode).sort(), [200, 409]);
    assert.equal(
        (await request(router, 'PUT', other, { content: 'x'.repeat(20000), version: 0 }))
            .statusCode,
        200
    );
    assert.ok(
        pool.calls.every(
            ({ sql }) =>
                !sql.includes(content) &&
                !/user_progress|lesson_progress|review_queue|user_activity/.test(sql)
        )
    );
    assert.ok(
        pool.calls.every(
            ({ sql, params }) =>
                sql.includes('section_notes') && ['alice', 'bob'].includes(params[0])
        )
    );
    assert.ok(pool.calls.some(({ sql }) => /ON CONFLICT .* DO NOTHING/s.test(sql)));
    assert.ok(pool.calls.some(({ sql }) => /version = \$6/.test(sql)));
    assert.equal(JSON.stringify(winners).includes('must not escape'), false);
});

test('a save racing a delete has one winner and stale losers cannot overwrite it', async () => {
    const { router } = setup();
    await request(router, 'PUT', target, { content: 'original', version: 0 });
    const results = await Promise.all([
        request(router, 'DELETE', target, { version: 1 }),
        request(router, 'PUT', target, { content: 'edited', version: 1 })
    ]);
    assert.deepEqual(results.map((res) => res.statusCode).sort(), [200, 409]);
    assert.deepEqual(
        (await request(router, 'GET', target)).body,
        results.find((res) => res.statusCode === 200).body
    );
});

test('delete of absent note creates tombstone; database failures forward to safe error handler', async () => {
    const { pool, router } = setup();
    assert.equal((await request(router, 'DELETE', target, { version: 0 })).body.note.version, 1);
    assert.equal(
        (await request(router, 'PUT', target, { content: 'old', version: 0 })).statusCode,
        409
    );
    pool.fail = true;
    for (const method of ['GET', 'PUT', 'DELETE']) {
        const res = await request(
            router,
            method,
            target,
            method === 'PUT' ? { content: 'private', version: 1 } : { version: 1 }
        );
        assert.equal(res.statusCode, 500);
        assert.equal(JSON.stringify(res.body).includes('secret'), false);
    }
});

test('migration is idempotent, owner cascading and constrained; export projects only live owned safe fields', async () => {
    const sql = await readFile(
        new URL('../backend/migrations/008_section_notes.sql', import.meta.url),
        'utf8'
    );
    assert.match(sql, /CREATE TABLE IF NOT EXISTS section_notes/);
    assert.match(sql, /REFERENCES users\(id\) ON DELETE CASCADE/);
    assert.match(sql, /PRIMARY KEY \(user_id, module_id, section_id\)/);
    assert.match(sql, /DEFAULT 1 CHECK \(version >= 1\)/);
    const calls = [];
    const client = {
        async query(sql, params) {
            calls.push({ sql, params });
            return {
                rows: sql.includes('FROM section_notes')
                    ? [
                          {
                              module_id: 2,
                              section_id: target,
                              content: 'personal',
                              version: 4,
                              updated_at: 'today',
                              user_id: 'secret',
                              is_deleted: false
                          }
                      ]
                    : []
            };
        },
        release() {}
    };
    const data = await exportAccount({ connect: async () => client }, 'alice');
    assert.deepEqual(data.sectionNotes, [
        { module_id: 2, section_id: target, content: 'personal', version: 4, updated_at: 'today' }
    ]);
    const query = calls.find(({ sql }) => sql.includes('FROM section_notes'));
    assert.match(query.sql, /WHERE user_id = \$1 AND is_deleted = false/);
    assert.deepEqual(query.params, ['alice']);
    assert.equal(JSON.stringify(data).includes('secret'), false);
});
