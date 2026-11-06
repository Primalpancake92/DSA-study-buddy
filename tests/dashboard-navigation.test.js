import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('authenticated primary navigation is Dashboard, Roadmap, Modules', async () => {
  const source = await readFile(new URL('../frontend/src/components/AppShell.jsx', import.meta.url), 'utf8');
  const navigation = source.match(/<nav className="app-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.match(navigation, /to="\/app\/dashboard"/);
  assert.match(navigation, /to="\/app\/roadmap"/);
  assert.match(navigation, /to="\/app\/modules"/);
  assert.ok(navigation.indexOf('Dashboard') < navigation.indexOf('Roadmap'));
  assert.ok(navigation.indexOf('Roadmap') < navigation.indexOf('Modules'));
  assert.doesNotMatch(navigation, /Settings|Week 01/);
});
