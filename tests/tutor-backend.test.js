import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createTutorRouter } from '../backend/src/tutorRoutes.js';
import { loadLesson } from '../backend/src/markdownLesson.js';
import {
    reserveTutor,
    releaseTutor,
    saveTutorPair,
    tutorDailyLimit
} from '../backend/src/tutorStore.js';

const section = (await loadLesson(2)).lessons[0].id;
const payload = { message: 'Explain loops', requestId: 'e93ca370-4d69-4078-9185-725a3e45efa1' };
function setup({ fail = false, disabled = false, gate } = {}) {
    const calls = [];
    const seen = new Set();
    let active = false;
    let saved;
    const store = {
        async getTutor(...args) {
            calls.push(['get', ...args]);
            return { conversation: null, messages: [], limits: { daily: 30, remaining: 30 } };
        },
        async reserveTutor(_pool, userId, id) {
            if (seen.has(`${userId}:${id}`))
                throw Object.assign(new Error('secret'), { code: 'TUTOR_DUPLICATE', status: 409 });
            if (active)
                throw Object.assign(new Error('secret'), { code: 'TUTOR_BUSY', status: 409 });
            seen.add(`${userId}:${id}`);
            active = true;
            return 'token';
        },
        async releaseTutor(...args) {
            active = false;
            calls.push(['release', ...args]);
        },
        async saveTutorPair(...args) {
            saved = args;
            return {
                conversation: { id: 'c' },
                messages: [{ role: 'assistant', content: args[6] }]
            };
        },
        async clearTutor() {
            if (active)
                throw Object.assign(new Error('secret'), { code: 'TUTOR_BUSY', status: 409 });
            return { conversation: null, messages: [] };
        }
    };
    const router = createTutorRouter({
        pool: {},
        store,
        requireAuth: (req, res, next) =>
            req.session.userId ? next() : res.status(401).json({ error: 'Sign in' }),
        csrfProtection: (req, res, next) =>
            req.headers.token === 'valid' ? next() : res.status(403).json({ error: 'CSRF' }),
        enabled: () => !disabled,
        buildInput: async (input) => {
            calls.push(['input', input]);
            return ['PRIVATE NOTES AND CONTEXT'];
        },
        streamTutor: async function* ({ signal }) {
            calls.push(['signal', signal]);
            yield 'Hello';
            if (gate) await gate;
            if (fail) throw new Error('provider key and private context');
            yield ' world';
        }
    });
    return {
        router,
        calls,
        get saved() {
            return saved;
        }
    };
}
function request(
    router,
    method = 'POST',
    body = payload,
    { userId = 'alice', token = 'valid', target = section, disconnect = false } = {}
) {
    return new Promise((resolve, reject) => {
        const req = Object.assign(new EventEmitter(), {
            method,
            url: `/2/${target}`,
            body,
            session: { userId },
            headers: { token }
        });
        const res = new EventEmitter();
        res.statusCode = 200;
        res.headers = {};
        res.events = [];
        res.set = (key, value) => {
            res.headers[key] = value;
            return res;
        };
        res.status = (value) => {
            res.statusCode = value;
            return res;
        };
        res.json = (value) => {
            res.body = value;
            resolve(res);
            return res;
        };
        res.write = (value) => {
            res.events.push(JSON.parse(value.slice(6)));
            if (disconnect) res.emit('close');
        };
        res.end = () => {
            res.writableEnded = true;
            resolve(res);
        };
        router.handle(req, res, reject);
    });
}

test('authentication and CSRF precede store/provider work', async () => {
    const { router, calls } = setup();
    for (const method of ['GET', 'POST', 'DELETE']) {
        assert.equal((await request(router, method, payload, { userId: null })).statusCode, 401);
        if (method !== 'GET')
            assert.equal(
                (await request(router, method, payload, { token: 'bad' })).statusCode,
                403
            );
    }
    assert.equal(calls.length, 0);
});
test('strict input, stable section and disabled provider prevent requests', async () => {
    const { router, calls } = setup();
    for (const body of [
        {},
        { ...payload, message: ' ' },
        { ...payload, message: 'x'.repeat(4001) },
        { ...payload, code: 'x'.repeat(8001) },
        { ...payload, includeNotes: 'true' },
        { ...payload, mode: 'unknown' },
        { ...payload, requestId: 'bad' },
        { ...payload, userId: 'bob' }
    ])
        assert.equal((await request(router, 'POST', body)).statusCode, 400);
    assert.equal((await request(router, 'POST', payload, { target: 'invented' })).statusCode, 404);
    assert.equal(calls.length, 0);
    assert.equal((await request(setup({ disabled: true }).router)).statusCode, 503);
});
test('SSE completion persists only message and explicitly shared code, with owner-scoped context', async () => {
    const state = setup();
    const res = await request(state.router, 'POST', {
        ...payload,
        code: 'for (;;) {}',
        includeNotes: true
    });
    assert.deepEqual(
        res.events.map((event) => event.type),
        ['delta', 'delta', 'done']
    );
    assert.equal(state.saved[1], 'alice');
    assert.equal(state.saved[5], 'Explain loops\n\nShared code:\nfor (;;) {}');
    assert.equal(state.saved[6], 'Hello world');
    assert.equal(JSON.stringify(state.saved).includes('PRIVATE'), false);
    assert.equal(state.calls.find(([type]) => type === 'input')[1].userId, 'alice');
    assert.equal(state.calls.at(-1)[0], 'release');
    assert.equal((await request(state.router)).statusCode, 409);
    assert.equal((await request(state.router, 'GET', null, { userId: 'bob' })).body.enabled, true);
    assert.equal(state.calls.at(-1)[2], 'bob');
});
test('failed streams are generic, never save partial answers, release lease, and cannot retry paid request', async () => {
    const state = setup({ fail: true });
    const res = await request(state.router);
    assert.deepEqual(
        res.events.map((event) => event.type),
        ['delta', 'error']
    );
    assert.equal(JSON.stringify(res.events).includes('private'), false);
    assert.equal(state.saved, undefined);
    assert.equal(state.calls.at(-1)[0], 'release');
    assert.equal((await request(state.router)).statusCode, 409);
});
test('disconnect aborts provider and discards partial output', async () => {
    const state = setup();
    await request(state.router, 'POST', payload, { disconnect: true });
    assert.equal(state.calls.find(([type]) => type === 'signal')[1].aborted, true);
    assert.equal(state.saved, undefined);
    assert.equal(state.calls.at(-1)[0], 'release');
});
test('deletion during an active stream returns conflict', async () => {
    let finish;
    const gate = new Promise((resolve) => {
        finish = resolve;
    });
    const state = setup({ gate });
    const stream = request(state.router);
    while (!state.calls.some(([type]) => type === 'signal')) await new Promise(setImmediate);
    assert.equal((await request(state.router, 'DELETE')).statusCode, 409);
    finish();
    await stream;
});

function mockPool(handler) {
    const calls = [];
    const db = {
        async query(sql, params) {
            calls.push({ sql, params });
            return handler(sql, params) ?? { rows: [] };
        },
        release() {
            calls.push({ sql: 'RELEASE' });
        }
    };
    return {
        calls,
        query: db.query,
        async connect() {
            return db;
        }
    };
}
test('database quota denial rolls reservation back before request ledger insertion', async () => {
    const pool = mockPool((sql) => {
        if (sql.startsWith('SELECT id FROM users')) return { rows: [{ id: 'alice' }] };
        if (sql.startsWith('INSERT INTO tutor_leases')) return { rows: [{ token: 'lease' }] };
    });
    await assert.rejects(reserveTutor(pool, 'alice', payload.requestId), {
        code: 'TUTOR_QUOTA',
        status: 429
    });
    assert.ok(pool.calls.some(({ sql }) => sql === 'ROLLBACK'));
    assert.ok(!pool.calls.some(({ sql }) => sql.startsWith('INSERT INTO tutor_requests')));
    assert.equal(
        pool.calls.find(({ sql }) => sql.startsWith('INSERT INTO tutor_daily_usage')).params[1],
        tutorDailyLimit()
    );
});
test('expired/replaced lease cannot save and release is scoped to token and owner', async () => {
    const pool = mockPool((sql) =>
        sql.startsWith('SELECT id FROM users') ? { rows: [{ id: 'alice' }] } : undefined
    );
    await assert.rejects(
        saveTutorPair(pool, 'alice', 2, section, 'old-token', 'message', 'answer'),
        { code: 'TUTOR_EXPIRED' }
    );
    assert.ok(!pool.calls.some(({ sql }) => sql.startsWith('INSERT')));
    await releaseTutor(pool, 'alice', 'old-token');
    assert.deepEqual(pool.calls.at(-1), {
        sql: 'DELETE FROM tutor_leases WHERE user_id = $1 AND token = $2',
        params: ['alice', 'old-token']
    });
});
