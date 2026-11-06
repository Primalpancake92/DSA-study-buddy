import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import pg from 'pg';
import { z } from 'zod';
import { curriculumPreview } from '../../shared/curriculumPreview.js';
import { getLesson, weekCatalog } from '../../shared/curriculum.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not configured. Run the API only after configuring PostgreSQL.');
if (!sessionSecret || sessionSecret.length < 32) console.warn('SESSION_SECRET should be a random value of at least 32 characters.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX || 10), idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } : undefined });
const PgSession = connectPgSimple(session);
const allowedOrigins = new Set([process.env.FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'].filter(Boolean));

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, callback) => { const localOrigin = origin && /^https?:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin); callback(null, !origin || allowedOrigins.has(origin) || (!isProduction && localOrigin)); }, credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use(session({
  name: 'dsa.sid',
  secret: sessionSecret || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: new PgSession({ pool, tableName: 'sessions', createTableIfMissing: true, pruneSessionInterval: 900 }),
  cookie: { httpOnly: true, secure: isProduction || process.env.COOKIE_SECURE === 'true', sameSite: isProduction ? (process.env.COOKIE_SAME_SITE || 'none') : 'lax', maxAge: 1000 * 60 * 60 * 24 * 30 }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const csrfToken = (req) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
};
const csrfProtection = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.session.csrfToken || req.get('X-CSRF-Token') !== req.session.csrfToken) return res.status(403).json({ error: 'Invalid request token.' });
  next();
};
const requireAuth = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: 'Authentication required.' });
const userShape = z.object({ id: z.string(), firstName: z.string(), lastName: z.string(), username: z.string(), email: z.string() });
const registerSchema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/), email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(12).max(128), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
const loginSchema = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });
const progressSchema = z.object({ completedWeeks: z.array(z.number().int().min(1).max(16)), completedCheckpoints: z.array(z.string().min(1).max(120)) });

function publicUser(row) { return { id: row.id, firstName: row.first_name, lastName: row.last_name, username: row.username, email: row.email }; }
function regenerate(req) { return new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve())); }
function saveSession(req) { return new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve())); }
function hashToken(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

app.get('/api/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ ok: true, service: 'dsa-grind-api', database: 'connected' }); } catch { res.status(503).json({ ok: false, service: 'dsa-grind-api', database: 'unavailable' }); } });
app.get('/api/auth/csrf', (req, res) => res.json({ csrfToken: csrfToken(req) }));

app.post('/api/auth/register', authLimiter, csrfProtection, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Check the highlighted fields.', fields: parsed.error.flatten().fieldErrors });
  const { firstName, lastName, username, email, password } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await client.query('INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, username, email', [firstName, lastName, username, email, passwordHash]);
    await client.query('INSERT INTO user_progress (user_id, week_number, total_lesson_count) SELECT $1, weeks.week_number, 3 FROM generate_series(1, 16) AS weeks(week_number)', [result.rows[0].id]);
    await client.query('COMMIT');
    await regenerate(req);
    req.session.userId = result.rows[0].id;
    csrfToken(req);
    await saveSession(req);
    res.status(201).json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'An account with those details already exists.' });
    next(error);
  } finally { client.release(); }
});

app.post('/api/auth/login', authLimiter, csrfProtection, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });
  try {
    const result = await pool.query('SELECT id, first_name, last_name, username, email, password_hash, account_active FROM users WHERE email = $1', [parsed.data.email]);
    const user = result.rows[0];
    const valid = user?.account_active ? await argon2.verify(user.password_hash, parsed.data.password) : false;
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
    await regenerate(req);
    req.session.userId = user.id;
    csrfToken(req);
    await saveSession(req);
    await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', requireAuth, csrfProtection, async (req, res, next) => {
  req.session.destroy((error) => error ? next(error) : res.clearCookie('dsa.sid').json({ ok: true }));
});

app.get('/api/auth/me', async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const result = await pool.query('SELECT id, first_name, last_name, username, email, account_active FROM users WHERE id = $1', [req.session.userId]);
    if (!result.rows[0]?.account_active) return res.status(401).json({ error: 'Authentication required.' });
    res.json({ user: publicUser(result.rows[0]), csrfToken: csrfToken(req) });
  } catch (error) { next(error); }
});

app.get('/api/users/me', requireAuth, async (req, res, next) => {
  try { const result = await pool.query('SELECT id, first_name, last_name, username, email FROM users WHERE id = $1 AND account_active = true', [req.session.userId]); if (!result.rows[0]) return res.status(404).json({ error: 'Profile not found.' }); res.json({ user: publicUser(result.rows[0]) }); } catch (error) { next(error); }
});

app.patch('/api/users/me', requireAuth, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Check your profile fields.', fields: parsed.error.flatten().fieldErrors });
  try { const result = await pool.query('UPDATE users SET first_name = $1, last_name = $2, username = $3, updated_at = now() WHERE id = $4 AND account_active = true RETURNING id, first_name, last_name, username, email', [parsed.data.firstName, parsed.data.lastName, parsed.data.username, req.session.userId]); res.json({ user: publicUser(result.rows[0]) }); } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'That username is already in use.' }); next(error); }
});

app.get('/api/curriculum/preview', (_req, res) => res.json({ weeks: 16, tracks: curriculumPreview }));
app.get('/api/curriculum', requireAuth, (_req, res) => res.json({ weeks: weekCatalog }));
app.get('/api/curriculum/:weekNumber', requireAuth, (req, res) => {
  const weekNumber = Number(req.params.weekNumber);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 16) return res.status(404).json({ error: 'Module not found.' });
  const lesson = getLesson(weekNumber);
  return lesson ? res.json(lesson) : res.status(404).json({ error: 'Module not found.' });
});
app.get('/api/roadmap', requireAuth, (_req, res) => res.json({ weeks: weekCatalog }));
app.get('/api/weeks/:weekNumber', requireAuth, (req, res) => {
  const weekNumber = Number(req.params.weekNumber);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 16) return res.status(404).json({ error: 'Module not found.' });
  const lesson = getLesson(weekNumber);
  return lesson ? res.json(lesson) : res.status(404).json({ error: 'Module not found.' });
});

app.post('/api/auth/forgot-password', authLimiter, csrfProtection, async (req, res, next) => {
  const email = z.string().email().safeParse(req.body?.email?.toLowerCase());
  const generic = { message: 'If an account matches that email, password reset instructions have been sent.' };
  if (!email.success) return res.json(generic);
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.data]);
    if (result.rows[0]) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < now()', [result.rows[0].id]);
      await pool.query('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval \'30 minutes\')', [hashToken(rawToken), result.rows[0].id]);
      if (process.env.PASSWORD_RESET_WEBHOOK_URL) await fetch(process.env.PASSWORD_RESET_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.data, token: rawToken, resetUrl: `${process.env.PASSWORD_RESET_BASE_URL || ''}?token=${rawToken}` }) });
      if (!isProduction && process.env.RETURN_DEV_RESET_TOKEN === 'true') return res.json({ ...generic, developmentToken: rawToken });
    }
    res.json(generic);
  } catch (error) { next(error); }
});

app.post('/api/auth/reset-password', authLimiter, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ token: z.string().min(32), password: z.string().min(12).max(128), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Check the password fields.' });
  try {
    const tokenResult = await pool.query('SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > now() AND used_at IS NULL', [hashToken(parsed.data.token)]);
    if (!tokenResult.rows[0]) return res.status(400).json({ error: 'This reset link is invalid or expired.' });
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, tokenResult.rows[0].user_id]);
    await pool.query('UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1', [hashToken(parsed.data.token)]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get('/api/progress', requireAuth, async (req, res, next) => {
  try {
    const [weeks, lessons] = await Promise.all([pool.query('SELECT week_number FROM user_progress WHERE user_id = $1 AND completion_status = \'completed\' ORDER BY week_number', [req.session.userId]), pool.query('SELECT lesson_id FROM lesson_progress WHERE user_id = $1 AND status = \'completed\' ORDER BY lesson_id', [req.session.userId])]);
    res.json({ completedWeeks: weeks.rows.map((row) => row.week_number), completedCheckpoints: lessons.rows.map((row) => row.lesson_id) });
  } catch (error) { next(error); }
});

app.put('/api/progress', requireAuth, csrfProtection, async (req, res, next) => {
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid progress payload.' });
  try {
    const weeks = [...new Set(parsed.data.completedWeeks)]; const checkpoints = [...new Set(parsed.data.completedCheckpoints)]; const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM lesson_progress WHERE user_id = $1', [req.session.userId]);
      for (const lessonId of checkpoints) await client.query('INSERT INTO lesson_progress (user_id, lesson_id, status, completed_at) VALUES ($1, $2, \'completed\', now())', [req.session.userId, lessonId]);
      await client.query('UPDATE user_progress SET completion_status = \'started\', completed_lesson_count = 0, updated_at = now() WHERE user_id = $1', [req.session.userId]);
      for (const week of weeks) await client.query('UPDATE user_progress SET completion_status = \'completed\', completed_lesson_count = total_lesson_count, updated_at = now() WHERE user_id = $1 AND week_number = $2', [req.session.userId, week]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    res.json({ completedWeeks: weeks, completedCheckpoints: checkpoints });
  } catch (error) { next(error); }
});

app.patch('/api/progress/lessons/:lessonId', requireAuth, csrfProtection, async (req, res, next) => {
  const lessonId = z.string().min(1).max(120).safeParse(req.params.lessonId);
  const completed = z.boolean().default(true).safeParse(req.body?.completed ?? true);
  if (!lessonId.success || !completed.success) return res.status(400).json({ error: 'Invalid lesson progress payload.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO lesson_progress (user_id, lesson_id, status, completed_at) VALUES ($1, $2, $3, CASE WHEN $3 = \'completed\' THEN now() ELSE NULL END) ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at, updated_at = now()', [req.session.userId, lessonId.data, completed.data ? 'completed' : 'started']);
    const weekMatch = lessonId.data.match(/^w(\d+)-/);
    if (weekMatch) {
      const week = Number(weekMatch[1]);
      const count = await client.query('SELECT count(*)::int AS count FROM lesson_progress WHERE user_id = $1 AND lesson_id LIKE $2 AND status = \'completed\'', [req.session.userId, `w${week}-%`]);
      await client.query('UPDATE user_progress SET completed_lesson_count = $1, completion_status = CASE WHEN $1 >= total_lesson_count AND total_lesson_count > 0 THEN \'completed\' ELSE \'started\' END, updated_at = now() WHERE user_id = $2 AND week_number = $3', [count.rows[0].count, req.session.userId, week]);
    }
    await client.query('COMMIT');
    res.json({ lessonId: lessonId.data, completed: completed.data });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

app.get('/api/journal', requireAuth, async (req, res, next) => {
  try { const result = await pool.query('SELECT id, week_id AS "weekId", entry, mood, created_at AS "createdAt" FROM solution_journals WHERE user_id = $1 ORDER BY created_at DESC', [req.session.userId]); res.json(result.rows); } catch (error) { next(error); }
});

app.post('/api/journal', requireAuth, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ weekId: z.number().int().min(1).max(16), entry: z.string().trim().min(1).max(10000), mood: z.string().max(40).nullable().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A week and non-empty journal entry are required.' });
  try { const result = await pool.query('INSERT INTO solution_journals (user_id, week_id, entry, mood) VALUES ($1, $2, $3, $4) RETURNING id, week_id AS "weekId", entry, mood, created_at AS "createdAt"', [req.session.userId, parsed.data.weekId, parsed.data.entry, parsed.data.mood || null]); res.status(201).json(result.rows[0]); } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'The server could not complete the request.' }); });

app.listen(port, '0.0.0.0', () => console.log(`DSA Grind API listening on port ${port}`));
