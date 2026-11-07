import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('both Vercel project roots run the complete build and publish its output', async () => {
    const root = await read('vercel.json');
    const frontend = await read('frontend/vercel.json');
    assert.equal(root.buildCommand, 'npm --prefix frontend run build');
    assert.equal(root.outputDirectory, 'frontend/dist');
    assert.equal(frontend.buildCommand, 'npm run build');
    assert.equal(frontend.outputDirectory, 'dist');
    assert.deepEqual(root.rewrites, frontend.rewrites);
    assert.deepEqual(root.headers, frontend.headers);
    assert.match((await read('frontend/package.json')).scripts.build, /prerender\.mjs/);
});

test('SPA fallback handles application routes but excludes API and asset requests', async () => {
    const config = await read('frontend/vercel.json');
    const fallback = config.rewrites.at(-1);
    const match = new RegExp(`^${fallback.source}$`, 'i');
    for (const path of ['/app', '/app/dashboard', '/app/roadmap', '/app/modules',
        '/app/weeks/1', '/app/weeks/2', '/app/settings/profile', '/dashboard',
        '/roadmap', '/lesson/2', '/notes', '/app/notes', '/login', '/unknown-route']) {
        assert.ok(match.test(path), `missing fallback for ${path}`);
    }
    for (const path of ['/api', '/api/health', '/api/missing', '/assets', '/assets/missing',
        '/assets/index.js', '/assets/index.css', '/robots.txt', '/sitemap.xml', '/favicon.ico']) {
        assert.equal(match.test(path), false, `must not rewrite ${path}`);
    }
    const shell = await readFile(new URL(`../frontend/dist${fallback.destination}`, import.meta.url), 'utf8');
    assert.match(shell, /<div id="root"><\/div>/);
    assert.match(shell, /\/assets\/[^" ]+\.js/);
});
