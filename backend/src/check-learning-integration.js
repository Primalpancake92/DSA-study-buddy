import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createDatabasePool, logDatabaseError } from './database.js';
import { defaultSettings, updateSettings, getSettings, listSessions, revokeOtherSessions, exportAccount } from './settingsModel.js';
import { savePracticeProgress } from './practiceService.js';
import { practiceCatalog } from '../../shared/practiceCatalog.js';
import { hashPassword } from './passwords.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const pool = createDatabasePool();
let client;
try {
  client = await pool.connect();
  await client.query('BEGIN');
  const schema = `dsa_check_${randomBytes(8).toString('hex')}`;
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`SET LOCAL search_path TO ${schema}, public`);
  // Fixture baseline only; the two feature migrations are executed unchanged.
  const baseline = (await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8')).replace(/^CREATE EXTENSION[^;]+;/gm, '').replace(/\bcitext\b/g, 'text');
  await client.query(baseline);
  for (const name of ['003_email_verification.sql', '004_activity_history.sql', '005_practice_progress.sql', '006_account_settings.sql', '005_practice_progress.sql', '006_account_settings.sql']) await client.query(await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
  const owners = [randomUUID(), randomUUID()];
  const hash = await hashPassword('isolated-fixture-password');
  for (let i = 0; i < 2; i++) await client.query('INSERT INTO users(id,first_name,last_name,username,email,password_hash,email_verified_at) VALUES ($1,$2,$3,$4,$5,$6,now())', [owners[i], 'Integration', 'Fixture', `fixture_${i}`, `fixture${i}@example.invalid`, hash]);
  let counter = 0; const saves = [];
  const nestedClient = { release() {}, async query(sql, values) {
    if (sql.startsWith('BEGIN')) { const name = `nested_${++counter}`; saves.push(name); return client.query(`SAVEPOINT ${name}`); }
    if (sql === 'COMMIT') return client.query(`RELEASE SAVEPOINT ${saves.pop()}`);
    if (sql === 'ROLLBACK') { const name = saves.pop(); await client.query(`ROLLBACK TO SAVEPOINT ${name}`); return client.query(`RELEASE SAVEPOINT ${name}`); }
    return client.query(sql, values);
  } };
  const isolatedPool = { connect: async () => nestedClient, query: (...args) => client.query(...args) };
  await updateSettings(isolatedPool, owners[0], { appearance: { theme: 'light' }, learning: { dailyMinutes: 45 }, connections: { leetcode: 'fixture_user' } });
  assert.equal((await getSettings(isolatedPool, owners[0])).learning.dailyMinutes, 45);
  assert.deepEqual(await getSettings(isolatedPool, owners[1]), defaultSettings);
  const problem = practiceCatalog[0];
  await savePracticeProgress(isolatedPool, owners[0], problem, { status: 'solved', notes: 'Fixture notes', attemptsCount: 2 });
  await savePracticeProgress(isolatedPool, owners[1], problem, { status: 'attempted', notes: 'Other fixture' });
  const exported = await exportAccount(isolatedPool, owners[0]);
  assert.equal(exported.practice.length, 1);
  assert.equal(exported.practice[0].notes, 'Fixture notes');
  assert.equal(JSON.stringify(exported).includes('password_hash'), false);
  assert.equal(JSON.stringify(exported).includes('Other fixture'), false);
  for (const [sid, userId] of [['fixture-current', owners[0]], ['fixture-other', owners[0]], ['fixture-b', owners[1]]]) await client.query('INSERT INTO sessions(sid,sess,expire) VALUES($1,$2,now()+interval \'1 hour\')', [sid, JSON.stringify({ userId })]);
  assert.equal((await listSessions(isolatedPool, owners[0], 'fixture-current')).length, 2);
  assert.equal(await revokeOtherSessions(isolatedPool, owners[0], 'fixture-current'), 1);
  assert.equal((await listSessions(isolatedPool, owners[1], 'fixture-b')).length, 1);
  await client.query('DELETE FROM users WHERE id = $1', [owners[0]]);
  assert.equal((await client.query('SELECT * FROM user_settings WHERE user_id=$1', [owners[0]])).rowCount, 0);
  assert.equal((await client.query('SELECT * FROM user_problem_progress WHERE user_id=$1', [owners[1]])).rowCount, 1);
  console.info('PASS: additive migration reruns, PostgreSQL settings/practice persistence, account isolation, safe export, session revocation and fixture deletion cascades. All test changes will be rolled back.');
} catch (error) { logDatabaseError(error, 'isolated-learning-integration'); process.exitCode = 1; }
finally { if (client) { await client.query('ROLLBACK').catch(() => {}); client.release(); } await pool.end(); }
