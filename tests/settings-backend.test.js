import test from 'node:test';
import assert from 'node:assert/strict';
import { settingsSchema, settingsPatchSchema, defaultSettings, normalizeConnection, mergeSettings, updateSettings, listSessions, revokeOtherSessions, exportAccount, practiceCsv, csvCell } from '../backend/src/settingsModel.js';
import { createSettingsRouter } from '../backend/src/settingsRoutes.js';
import { hashPassword } from '../backend/src/passwords.js';

function mockPool(handler) {
  const calls = [];
  const client = { query: async (sql, params) => { calls.push({ sql, params }); return handler(sql, params); }, release() { calls.push({ sql: 'RELEASE' }); } };
  return { calls, query: client.query, connect: async () => client };
}
const empty = () => ({ rows: [], rowCount: 0 });
const owner = "owner' OR true --";
test('defaults validate and strict partial settings reject unknowns and invalid types', () => {
  assert.deepEqual(settingsSchema.parse(defaultSettings), defaultSettings);
  for (const payload of [{ unknown: {} }, { learning: { password: 'x' } }, { learning: { dailyMinutes: 14 } }, { learning: { dailyMinutes: 241 } }, { learning: { daysPerWeek: 8 } }, { learning: { showHints: 'true' } }, { accessibility: { fontSize: 'huge' } }, { appearance: null }, []]) assert.equal(settingsPatchSchema.safeParse(payload).success, false);
  assert.equal(settingsPatchSchema.safeParse({ learning: { dailyMinutes: 15, daysPerWeek: 7 }, appearance: { theme: 'light' } }).success, true);
  const settings = mergeSettings({ learning: { showHints: false, secret: 'hidden' } }, { appearance: { theme: 'dark' } });
  assert.equal(settings.learning.showHints, false);
  assert.equal(settings.learning.dailyMinutes, 30);
  assert.equal(settings.learning.secret, undefined);
  settings.learning.dailyMinutes = 60;
  assert.equal(defaultSettings.learning.dailyMinutes, 30);
});
test('connections normalize locally and reject impostor URLs or non-profile paths', () => {
  assert.equal(normalizeConnection('leetcode', ' Alice_1 '), 'https://leetcode.com/u/Alice_1/');
  assert.equal(normalizeConnection('leetcode', 'https://leetcode.com/u/Alice/'), 'https://leetcode.com/u/Alice/');
  assert.equal(normalizeConnection('hackerrank', 'https://www.hackerrank.com/Alice'), 'https://www.hackerrank.com/profile/Alice');
  assert.equal(normalizeConnection('hackerrank', 'https://hackerrank.com/profile/Alice'), 'https://www.hackerrank.com/profile/Alice');
  assert.equal(normalizeConnection('leetcode', ''), '');
  for (const value of ['https://leetcode.com.evil/u/name/', 'https://evil@leetcode.com/u/name/', 'https://leetcode.com/problems/name', 'https://leetcode.com/u/name/?token=x', 'javascript:alert(1)']) assert.throws(() => normalizeConnection('leetcode', value));
  assert.throws(() => normalizeConnection('hackerrank', 'https://hackerrank.com/dashboard'));
});
test('PATCH locks owner before read, preserves categories and binds all user data', async () => {
  const db = mockPool((sql) => sql.includes('SELECT id') ? { rows: [{ id: owner }] } : sql.includes('SELECT preferences') ? { rows: [{ preferences: { learning: { showHints: false }, notifications: { study: false } } }] } : empty());
  const result = await updateSettings(db, owner, { learning: { dailyMinutes: 45 } });
  assert.equal(result.learning.showHints, false);
  assert.equal(result.notifications.study, false);
  assert.equal(result.learning.dailyMinutes, 45);
  assert.match(db.calls[1].sql, /FOR UPDATE/);
  for (const call of db.calls.filter((call) => call.params)) { assert.equal(call.params[0], owner); assert.equal(call.sql.includes(owner), false); }
  assert.equal(db.calls.at(-2).sql, 'COMMIT');
});
test('failed patch rolls back and releases; missing owner cannot write', async () => {
  const db = mockPool(empty);
  await assert.rejects(updateSettings(db, owner, {}));
  assert.deepEqual(db.calls.map((call) => call.sql).slice(-2), ['ROLLBACK', 'RELEASE']);
  assert.equal(db.calls.some((call) => call.sql.startsWith('INSERT')), false);
});
test('session handles hide raw session IDs and revocation is scoped to owner except current', async () => {
  const db = mockPool((sql) => sql.startsWith('SELECT') ? { rows: [{ sid: 'private-sid', expire: 'tomorrow' }, { sid: 'other', expire: 'later' }] } : { rowCount: 2 });
  const result = await listSessions(db, owner, 'private-sid');
  assert.equal(result[0].id.length, 64);
  assert.equal(result[0].current, true);
  assert.equal(result[1].current, false);
  assert.equal(JSON.stringify(result).includes('private-sid'), false);
  assert.deepEqual(result, await listSessions(db, owner, 'private-sid'));
  assert.equal(await revokeOtherSessions(db, owner, 'private-sid'), 2);
  assert.match(db.calls.at(-1).sql, /sess->>'userId' = \$1 AND sid <> \$2/);
  assert.deepEqual(db.calls.at(-1).params, [owner, 'private-sid']);
});
test('export uses explicit columns, owner parameters and snapshot; excludes credentials', async () => {
  const db = mockPool((sql) => sql.includes('FROM users ') ? { rows: [{ id: owner, username: 'safe', password_hash: 'secret', token: 'secret' }] } : sql.includes('FROM user_problem_progress') ? { rows: [{ problem_id: '=CMD()', status: 'solved', notes: 'a,"b"\nc', token: 'secret' }] } : empty());
  const data = await exportAccount(db, owner);
  assert.equal(JSON.stringify(data).includes('secret'), false);
  assert.equal(db.calls[0].sql, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  for (const call of db.calls.filter((call) => call.sql.startsWith('SELECT'))) { assert.deepEqual(call.params, [owner]); assert.equal(call.sql.includes('*'), false); }
  for (const key of ['progress', 'lessons', 'attempts', 'journals', 'review_queue', 'mocks', 'practice', 'preferences']) assert.ok(key in data);
  assert.match(practiceCsv(data), /'\=CMD\(\)/);
  assert.match(practiceCsv(data), /a,""b""\nc/);
  for (const value of ['=1', '+1', '-1', '@x', '  =1', '\tvalue', '\rvalue']) assert.ok(csvCell(value).startsWith('"\''));
});
function routeHandler(router, method, path) { return router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle; }
function response() { return { statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; }, clearCookie(name, options) { this.cookie = { name, options }; return this; } }; }
const middleware = (_req, _res, next) => next();
test('deletion commits before destroying session, waits for callback, clears matching cookie', async () => {
  const passwordHash = await hashPassword('password-for-deletion');
  const db = mockPool((sql) => sql.startsWith('SELECT') ? { rows: [{ id: owner, password_hash: passwordHash }] } : empty());
  const router = createSettingsRouter({ pool: db, requireAuth: middleware, csrfProtection: middleware });
  let complete;
  const cookie = { httpOnly: true, secure: true, sameSite: 'none', path: '/', domain: 'example.test' };
  const req = { body: { password: 'password-for-deletion', confirmation: 'DELETE MY ACCOUNT' }, session: { userId: owner, cookie, destroy(callback) { assert.equal(db.calls.at(-2).sql, 'COMMIT'); complete = callback; } } };
  const res = response();
  const pending = routeHandler(router, 'delete', '/account')(req, res);
  // Password verification is asynchronous. Wait until the fake destroy callback is registered.
  while (!complete) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(res.body, undefined);
  complete();
  await pending;
  assert.deepEqual(res.body, { ok: true });
  assert.deepEqual(res.cookie, { name: 'dsa.sid', options: cookie });
  const deletes = db.calls.filter((call) => call.sql.startsWith('DELETE'));
  assert.match(deletes[0].sql, /sessions/);
  assert.match(deletes[1].sql, /users/);
  for (const call of deletes) assert.deepEqual(call.params, [owner]);
});
test('invalid password or confirmation never deletes, database errors stay generic', async () => {
  const db = mockPool(empty);
  const router = createSettingsRouter({ pool: db, requireAuth: middleware, csrfProtection: middleware });
  const handler = routeHandler(router, 'delete', '/account');
  const req = { body: { password: 'wrong', confirmation: 'DELETE MY ACCOUNT' }, session: { userId: owner } };
  const res = response(); await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(db.calls.some((call) => call.sql.startsWith('DELETE')), false);
  req.body.confirmation = 'delete'; await handler(req, response());
  const broken = createSettingsRouter({ pool: { query() { throw new Error('password_hash secret SQL'); } }, requireAuth: middleware, csrfProtection: middleware });
  const failure = response(); await routeHandler(broken, 'get', '/')(req, failure);
  assert.equal(failure.statusCode, 500); assert.equal(JSON.stringify(failure.body).includes('secret'), false);
});
test('all mutations retain CSRF middleware and authentication is installed first', () => {
  const auth = () => {};
  const csrf = () => {};
  const router = createSettingsRouter({ pool: {}, requireAuth: auth, csrfProtection: csrf });
  assert.equal(router.stack[0].handle, auth);
  for (const layer of router.stack.filter((layer) => layer.route && !layer.route.methods.get)) assert.ok(layer.route.stack.some((item) => item.handle === csrf));
  assert.throws(() => createSettingsRouter({ pool: {}, requireAuth: auth }));
});
test('write failure rolls back without committing or leaking error details', async () => {
  const db = mockPool((sql) => {
    if (sql.includes('SELECT id')) return { rows: [{ id: owner }] };
    if (sql.startsWith('INSERT')) throw new Error('private SQL details');
    return empty();
  });
  await assert.rejects(updateSettings(db, owner, { notifications: { study: false } }));
  assert.equal(db.calls.some((call) => call.sql === 'COMMIT'), false);
  assert.deepEqual(db.calls.slice(-2).map((call) => call.sql), ['ROLLBACK', 'RELEASE']);
});
