import { getSettings } from './settingsModel.js';

export async function getLearningReminders(pool, userId) {
  const settings = await getSettings(pool, userId);
  const reminders = [];
  if (settings.notifications.study) reminders.push({ id: 'study', text: `Your study plan: ${settings.learning.dailyMinutes} minutes a day, ${settings.learning.daysPerWeek} days a week. Study time is not automatically measured.`, href: '/app/modules' });
  if (settings.notifications.reviews && settings.learning.revisionExercises) {
    const { rows } = await pool.query('SELECT lesson_id, due_at FROM review_queue WHERE user_id = $1 AND due_at <= now() ORDER BY due_at LIMIT 5', [userId]);
    for (const row of rows) reminders.push({ id: `review:${row.lesson_id}`, text: `A saved ${row.lesson_id.startsWith('practice:') ? 'practice problem' : 'lesson'} is due for review.`, href: '/app/modules' });
  }
  if (settings.notifications.weeklySummary) {
    const { rows } = await pool.query("SELECT count(*)::int AS completed FROM lesson_progress WHERE user_id = $1 AND completed_at >= now() - interval '7 days' AND status = 'completed'", [userId]);
    reminders.push({ id: 'weekly', text: `${rows[0].completed} lesson checkpoints currently marked complete in the last seven days.`, href: '/app/roadmap' });
  }
  if (settings.notifications.moduleCompletion) {
    const { rows } = await pool.query("SELECT week_number FROM user_progress WHERE user_id = $1 AND completion_status = 'completed' AND updated_at >= now() - interval '7 days' ORDER BY week_number", [userId]);
    for (const row of rows) reminders.push({ id: `module:${row.week_number}`, text: `Week ${row.week_number} is marked complete.`, href: `/app/weeks/${row.week_number}` });
  }
  return reminders;
}
