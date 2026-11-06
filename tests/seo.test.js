import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { publicPages, pageMetadata, pageSchema, serializeSchema, metadataHtml } from '../frontend/src/seo/publicPages.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('SEO production build serves only existing public previews and a separate empty private shell', async () => {
  for (const [path, expected] of [['index.html', 'Master Data Structures'], ['curriculum/index.html', 'See the roadmap.']]) {
    const html = await read(`frontend/dist/${path}`);
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /name="viewport"/);
    assert.ok(html.includes(expected));
    assert.match(html, /Public navigation/);
    assert.match(html, /href="\/register"/);
    assert.match(html, /name="robots" content="index,follow"/);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.equal((html.match(/<title/g) || []).length, 1);
    const schema = JSON.parse(html.match(/type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.ok(schema['@context']);
    assert.doesNotMatch(html, /DATABASE_URL|SESSION_SECRET|completedCheckpoints|weekCatalog/);
  }
  const shell = await read('frontend/dist/app-shell.html');
  assert.match(shell, /name="robots" content="noindex,nofollow"/);
  assert.match(shell, /<div id="root"><\/div>/);
  assert.doesNotMatch(shell, /rel="canonical"|application\/ld\+json|Master Data Structures/);
  const sitemap = await read('frontend/dist/sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g) || []).length, 2);
  assert.doesNotMatch(sitemap, /\/app|\/login|\/lesson|\/register/);
  const robots = await read('frontend/dist/robots.txt');
  assert.match(robots, /Sitemap: https?:\/\/.+\/sitemap.xml/);
  // Crawlers must be able to fetch private shells to observe noindex.
  assert.doesNotMatch(robots, /Disallow: \/app/);
  const config = JSON.parse(await read('frontend/vercel.json'));
  assert.deepEqual(config.rewrites.map(({ source, destination }) => [source, destination]), [['/', '/index.html'], ['/curriculum', '/curriculum/index.html'], ['/(.*)', '/app-shell.html']]);
});

test('client metadata allowlist defaults every other route to noindex without public canonical/schema', () => {
  assert.deepEqual(Object.keys(publicPages), ['/', '/curriculum']);
  for (const path of ['/app', '/app/weeks/1', '/login', '/register', '/verify-email', '/reset-password', '/dashboard', '/lesson/1', '/unknown', '/constructor']) {
    assert.equal(pageMetadata(path).robots, 'noindex,nofollow');
    assert.equal(pageMetadata(path).canonical, undefined);
    assert.equal(pageSchema(path), null);
    assert.doesNotMatch(metadataHtml(path), /canonical|og:|application\/ld/);
  }
});

test('metadata escapes verification values and JSON-LD script delimiters', () => {
  const dangerous = '</script><script>&\u2028\u2029';
  const encoded = serializeSchema({ text: dangerous });
  assert.doesNotMatch(encoded, /[<>&\u2028\u2029]/);
  assert.equal(JSON.parse(encoded).text, dangerous);
  assert.ok(metadataHtml('/', { 'google-site-verification': '"><script>' }).includes('&quot;&gt;&lt;script&gt;'));
  assert.match(metadataHtml('/', { 'google-site-verification': 'google-token', 'msvalidate.01': 'bing-token' }), /msvalidate.01" content="bing-token"/);
});
