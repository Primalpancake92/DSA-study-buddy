import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApiResponse } from '../frontend/src/services/parseApiResponse.js';
import { readFile } from 'node:fs/promises';

test('login rotates CSRF and logout confirms success with credentials; failures remain failures', async () => {
    const source = (
        await readFile(new URL('../frontend/src/services/authApi.js', import.meta.url), 'utf8')
    )
        .replace(
            "'./parseApiResponse.js'",
            JSON.stringify(
                new URL('../frontend/src/services/parseApiResponse.js', import.meta.url).href
            )
        )
        .replaceAll('import.meta.env.VITE_API_BASE_URL', "'https://api.example.com'")
        .replaceAll('import.meta.env.DEV', 'false');
    const { authApi, apiRequest } = await import(
        `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
    );
    const originalFetch = globalThis.fetch;
    let failLogout = false;
    globalThis.fetch = async (url, options) => {
        assert.equal(options.credentials, 'include');
        let payload = {};
        let status = 200;
        if (url.endsWith('/csrf')) payload = { csrfToken: 'fresh' };
        if (url.endsWith('/login')) {
            assert.equal(options.headers['X-CSRF-Token'], 'fresh');
            payload = { user: { id: 'user' }, csrfToken: 'rotated' };
        }
        if (url.endsWith('/progress')) assert.equal(options.headers['X-CSRF-Token'], 'rotated');
        if (url.endsWith('/progress/lessons/w1-section-stable')) {
            assert.equal(url, 'https://api.example.com/api/progress/lessons/w1-section-stable');
            assert.equal(options.method, 'PATCH');
            assert.equal(options.headers['Content-Type'], 'application/json');
            assert.equal(options.headers['X-CSRF-Token'], 'rotated');
            assert.deepEqual(JSON.parse(options.body), { completed: true });
            payload = {
                completedWeeks: [],
                completedCheckpoints: ['w1-section-stable'],
                startedLessons: []
            };
        }
        if (url.endsWith('/logout')) {
            assert.equal(options.headers['X-CSRF-Token'], 'fresh');
            payload = failLogout ? { error: 'Session store unavailable' } : { ok: true };
            status = failLogout ? 503 : 200;
        }
        return new Response(JSON.stringify(payload), {
            status,
            headers: { 'content-type': 'application/json' }
        });
    };
    try {
        await authApi.login({});
        await apiRequest('/api/progress', { method: 'PUT' });
        await apiRequest('/api/progress/lessons/w1-section-stable', {
            method: 'PATCH',
            body: JSON.stringify({ completed: true })
        });
        failLogout = true;
        await assert.rejects(authApi.logout(), /Session store unavailable/);
        failLogout = false;
        assert.deepEqual(await authApi.logout(), { ok: true });
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('API client rejects Vercel HTML instead of parsing it as JSON', async () => {
    const response = new Response('<script type="module"></script>', {
        status: 200,
        headers: { 'content-type': 'text/html' }
    });
    await assert.rejects(() => parseApiResponse(response), /Expected JSON from the API/);
});

test('API client preserves JSON API errors', async () => {
    const response = new Response(JSON.stringify({ error: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
    });
    await assert.rejects(
        () => parseApiResponse(response),
        (error) => error.status === 401 && /Invalid email or password/.test(error.message)
    );
});

test('malformed JSON returns a classified response error without leaking its body', async () => {
    await assert.rejects(
        parseApiResponse(
            new Response('{sensitive-invalid-json', {
                headers: { 'content-type': 'application/json' }
            })
        ),
        (error) => error.code === 'INVALID_RESPONSE' && !error.message.includes('sensitive')
    );
});
