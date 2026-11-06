#!/usr/bin/env node

import assert from 'node:assert/strict';

const configuredUrl = process.env.VERCEL_DEPLOYMENT_URL || process.env.E2E_BASE_URL || process.env.VERCEL_URL;

if (!configuredUrl) {
  console.error('Missing VERCEL_DEPLOYMENT_URL, E2E_BASE_URL, or VERCEL_URL.');
  process.exit(2);
}

const baseUrl = new URL(configuredUrl.includes('://') ? configuredUrl : `https://${configuredUrl}`);
baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, '');

const checks = [];

async function get(path) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    headers: { 'user-agent': 'dsa-grind-vercel-e2e/1.0' },
    redirect: 'follow'
  });
  const body = await response.text();
  return { url, response, body };
}

async function check(name, callback) {
  try {
    await callback();
    checks.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, ok: false });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

function assertHtml(result, path) {
  assert.equal(result.response.status, 200, `${path} returned HTTP ${result.response.status}`);
  assert.match(result.response.headers.get('content-type') || '', /text\/html/i, `${path} is not HTML`);
  assert.match(result.body, /<div id="root">/, `${path} does not contain the SPA root`);
}

await check('production landing page', async () => {
  const result = await get('/');
  assertHtml(result, '/');
  assert.match(result.body, /Master Data Structures/);
  assert.match(result.body, /name="robots" content="index,follow"/);
});

await check('public curriculum route', async () => {
  const result = await get('/curriculum');
  assertHtml(result, '/curriculum');
  assert.match(result.body, /See the roadmap/);
  assert.match(result.body, /Course/);
});

for (const path of ['/login', '/register', '/app/dashboard', '/app/roadmap', '/app/weeks/1', '/unknown-route']) {
  await check(`SPA refresh rewrite ${path}`, async () => {
    const result = await get(path);
    assertHtml(result, path);
    assert.match(result.body, /app-shell|root/, `${path} did not resolve to the app shell`);
  });
}

await check('critical static assets', async () => {
  const home = await get('/');
  const assetPaths = [...home.body.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(assetPaths.length > 0, 'no built assets were referenced by the landing page');

  for (const assetPath of [...new Set(assetPaths)]) {
    const asset = await get(assetPath);
    assert.equal(asset.response.status, 200, `${assetPath} returned HTTP ${asset.response.status}`);
  }
});

for (const path of ['/robots.txt', '/sitemap.xml']) {
  await check(`SEO file ${path}`, async () => {
    const result = await get(path);
    assert.equal(result.response.status, 200, `${path} returned HTTP ${result.response.status}`);
    assert.ok(result.body.trim().length > 0, `${path} is empty`);
  });
}

const failed = checks.filter(({ ok }) => !ok);
console.log(`\n${checks.length - failed.length}/${checks.length} Vercel deployment checks passed for ${baseUrl.origin}`);
process.exitCode = failed.length ? 1 : 0;
