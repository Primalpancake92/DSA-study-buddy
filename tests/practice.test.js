import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceCatalog, getPracticeForWeek } from '../shared/practiceCatalog.js';
import { nextPracticeReview, savePracticeProgress } from '../backend/src/practiceService.js';
import { practiceUpdateSchema } from '../backend/src/practiceRoutes.js';
import { filterPractice, recommendPractice } from '../frontend/src/services/practiceModel.js';

test('all 16 modules have both official platforms, stable IDs and educational metadata', () => {
  assert.equal(new Set(practiceCatalog.map((problem) => problem.id)).size, practiceCatalog.length);
  for (let week = 1; week <= 16; week++) {
    const problems = getPracticeForWeek(week);
    assert.ok(problems.filter((p) => p.platform === 'LeetCode').length >= 2, `week ${week} missing LeetCode progression`);
    assert.ok(problems.some((p) => p.platform === 'HackerRank'), `week ${week} missing HackerRank`);
  }
  for (const problem of practiceCatalog) {
    const url = new URL(problem.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, problem.platform === 'LeetCode' ? 'leetcode.com' : 'www.hackerrank.com');
    assert.ok(problem.topics.length && problem.prerequisites.length && problem.objective.length > 30);
  }
});

function memoryPool() {
  let rows = new Map(); let snapshot; const calls = []; let failActivity = false;
  const client = { release() {}, async query(sql, values = []) {
    calls.push({ sql, values });
    if (sql === 'BEGIN') snapshot = new Map(rows);
    if (sql === 'ROLLBACK') rows = snapshot;
    if (sql.startsWith('SELECT *')) return { rows: rows.has(values.join('/')) ? [rows.get(values.join('/'))] : [] };
    if (sql.startsWith('INSERT INTO user_problem_progress')) {
      const [user_id, problem_id, status, attempts_count, notes, last_attempted_at, solved_at, review_stage, next_review_at] = values;
      const row = { user_id, problem_id, status, attempts_count, notes, last_attempted_at, solved_at, review_stage, next_review_at };
      rows.set(`${user_id}/${problem_id}`, row); return { rows: [row] };
    }
    if (sql.startsWith('INSERT INTO user_activity') && failActivity) throw new Error('Simulated failure');
    return { rows: [] };
  } };
  return { connect: async () => client, calls, get rows() { return rows; }, failActivity() { failActivity = true; } };
}

test('practice saves are scoped, parameterized and retry-safe; notes do not postpone reviews', async () => {
  const pool = memoryPool(); const problem = practiceCatalog[0];
  const first = await savePracticeProgress(pool, 'alice', problem, { status: 'solved', notes: "'; DROP TABLE users; --" });
  const saved = await savePracticeProgress(pool, 'alice', problem, { status: 'solved', notes: 'Updated notes' });
  assert.equal(+saved.next_review_at, +first.next_review_at);
  assert.equal(saved.attempts_count, 1);
  await savePracticeProgress(pool, 'bob', problem, { status: 'attempted', notes: 'Bob only' });
  assert.equal(pool.rows.get(`alice/${problem.id}`).notes, 'Updated notes');
  assert.equal(pool.rows.get(`bob/${problem.id}`).notes, 'Bob only');
  assert.ok(pool.calls.every(({ sql }) => !sql.includes('DROP TABLE')));
  assert.ok(pool.calls.filter(({ sql }) => sql.startsWith('SELECT *')).every(({ sql, values }) => sql.includes('user_id = $1') && ['alice', 'bob'].includes(values[0])));
  pool.failActivity();
  await assert.rejects(savePracticeProgress(pool, 'alice', problem, { status: 'review-needed' }), /Simulated/);
  assert.equal(pool.rows.get(`alice/${problem.id}`).status, 'solved');
  assert.equal(practiceUpdateSchema.safeParse({ status: 'solved', userId: 'bob' }).success, false);
});

test('reviews advance through 2, 7 and 21 days only on explicit review completion', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  assert.equal(nextPracticeReview(null, 'solved', now).due.toISOString(), '2026-01-03T00:00:00.000Z');
  assert.equal(nextPracticeReview({ review_stage: 0, status: 'review-needed', solved_at: now }, 'solved', now).interval, 7);
  assert.equal(nextPracticeReview({ review_stage: 1, status: 'review-needed', solved_at: now }, 'solved', now).interval, 21);
  assert.equal(nextPracticeReview({ review_stage: 2, status: 'review-needed', solved_at: now }, 'solved', now).stage, 2);
  assert.equal(nextPracticeReview(null, 'attempted', now).due, null);
});

test('filters intersect and recommendations prioritise reviews without mutating progress', () => {
  const problems = practiceCatalog.slice(0, 3).map((p, i) => ({ ...p, progress: { status: ['not-started', 'attempted', 'review-needed'][i] } }));
  const original = JSON.stringify(problems);
  assert.equal(recommendPractice(problems)[0].progress.status, 'review-needed');
  assert.equal(filterPractice(problems, { status: 'attempted', platform: problems[1].platform, topic: problems[1].topics[0], difficulty: problems[1].difficulty }).length, 1);
  assert.equal(JSON.stringify(problems), original);
});
