import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { verifyPassword } from './passwords.js';
import { getLearningReminders } from './learningReminders.js';
import { settingsPatchSchema, getSettings, updateSettings, listSessions, revokeOtherSessions, exportAccount, practiceCsv, transaction } from './settingsModel.js';

export function createSettingsRouter({ pool, requireAuth, csrfProtection }) {
  if (typeof requireAuth !== 'function' || typeof csrfProtection !== 'function') throw new TypeError('Authentication and CSRF middleware are required.');
  const router = Router();
  router.use(requireAuth);
  router.use((_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  const mutationLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
  const deletionLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });
  const safe = (handler) => async (req, res) => {
    try { await handler(req, res); }
    catch (error) { console.error('[settings]', JSON.stringify({ code: /^[A-Z0-9_]{1,40}$/.test(error.code || '') ? error.code : 'REQUEST_FAILED' })); res.status(error.status === 401 ? 401 : 500).json({ error: error.status === 401 ? 'Authentication required.' : 'The server could not complete the request.' }); }
  };
  router.get('/', safe(async (req, res) => res.json({ settings: await getSettings(pool, req.session.userId) })));
  router.get('/reminders', safe(async (req, res) => res.json({ reminders: await getLearningReminders(pool, req.session.userId) })));
  router.patch('/', mutationLimit, csrfProtection, safe(async (req, res) => {
    const parsed = settingsPatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid settings.' });
    res.json({ settings: await updateSettings(pool, req.session.userId, parsed.data) });
  }));
  router.get('/sessions', safe(async (req, res) => res.json({ sessions: await listSessions(pool, req.session.userId, req.sessionID) })));
  router.post('/sessions/revoke-others', mutationLimit, csrfProtection, safe(async (req, res) => {
    res.json({ count: await revokeOtherSessions(pool, req.session.userId, req.sessionID) });
  }));
  router.get('/export', safe(async (req, res) => {
    const format = req.query.format ?? 'json';
    if (!['json', 'csv'].includes(format)) return res.status(400).json({ error: 'Choose json or csv.' });
    const data = await exportAccount(pool, req.session.userId);
    if (format === 'csv') return res.json({ csv: practiceCsv(data) });
    res.json(data);
  }));
  router.delete('/account', deletionLimit, csrfProtection, safe(async (req, res) => {
    const parsed = z.object({ password: z.string().min(1).max(128), confirmation: z.literal('DELETE MY ACCOUNT') }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Password and exact deletion confirmation are required.' });
    const deleted = await transaction(pool, async (client) => {
      const { rows } = await client.query('SELECT id, password_hash FROM users WHERE id = $1 FOR UPDATE', [req.session.userId]);
      if (!rows[0] || !await verifyPassword(rows[0].password_hash, parsed.data.password)) return false;
      await client.query("DELETE FROM sessions WHERE sess->>'userId' = $1", [req.session.userId]);
      await client.query('DELETE FROM users WHERE id = $1', [req.session.userId]);
      return true;
    });
    if (!deleted) return res.status(400).json({ error: 'Unable to verify account credentials.' });
    const { httpOnly, secure, sameSite, path, domain } = req.session.cookie;
    await new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
    res.clearCookie('dsa.sid', { httpOnly, secure, sameSite, path, ...(domain ? { domain } : {}) }).json({ ok: true });
  }));
  return router;
}
