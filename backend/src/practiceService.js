export const reviewIntervals = [2, 7, 21];

export function nextPracticeReview(previous, status, now = new Date()) {
  let stage = previous?.review_stage || 0;
  if (status === 'solved' && previous?.status === 'review-needed' && previous?.solved_at) stage = Math.min(2, stage + 1);
  const interval = reviewIntervals[stage];
  const due = status === 'review-needed' ? now : status === 'solved' ? new Date(now.getTime() + interval * 86400000) : null;
  return { stage, interval, due };
}

export async function savePracticeProgress(pool, userId, problem, input) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the owner first: concurrent first saves have no progress row to lock.
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const previous = (await client.query('SELECT * FROM user_problem_progress WHERE user_id = $1 AND problem_id = $2 FOR UPDATE', [userId, problem.id])).rows[0];
    const now = new Date();
    const schedule = nextPracticeReview(previous, input.status, now);
    const attempts = input.attemptsCount ?? previous?.attempts_count ?? 0;
    const notes = input.notes ?? previous?.notes ?? '';
    const active = input.status !== 'not-started';
    // Do not postpone a scheduled review merely because notes were edited.
    const due = previous?.status === input.status ? previous.next_review_at : schedule.due;
    const result = await client.query(`INSERT INTO user_problem_progress
      (user_id, problem_id, status, attempts_count, notes, last_attempted_at, solved_at, review_stage, next_review_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (user_id, problem_id) DO UPDATE SET status = EXCLUDED.status,
      attempts_count = EXCLUDED.attempts_count, notes = EXCLUDED.notes,
      last_attempted_at = EXCLUDED.last_attempted_at, solved_at = EXCLUDED.solved_at,
      review_stage = EXCLUDED.review_stage, next_review_at = EXCLUDED.next_review_at, updated_at = now()
      RETURNING *`, [userId, problem.id, input.status, active ? Math.max(1, attempts) : attempts, notes,
      active && (input.status !== previous?.status || attempts > (previous?.attempts_count || 0)) ? now : previous?.last_attempted_at || null,
      previous?.solved_at || (input.status === 'solved' ? now : null), schedule.stage, due]);
    const reviewId = `practice:${problem.id}`;
    if (due) await client.query(`INSERT INTO review_queue(user_id, lesson_id, due_at, interval_days) VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET due_at = EXCLUDED.due_at, interval_days = EXCLUDED.interval_days`, [userId, reviewId, due, schedule.interval]);
    else await client.query('DELETE FROM review_queue WHERE user_id = $1 AND lesson_id = $2', [userId, reviewId]);
    if (previous?.status !== input.status) await client.query('INSERT INTO user_activity(user_id, activity_type, title, detail, metadata) VALUES ($1,$2,$3,$4,$5)', [userId, 'practice', `${problem.title}: ${input.status.replaceAll('-', ' ')}`, 'Manually recorded practice status.', { problemId: problem.id }]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
