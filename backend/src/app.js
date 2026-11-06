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
import { z } from 'zod';
import { createDatabasePool, logDatabaseError } from './database.js';
import { createVerificationToken, sendVerificationEmail, validateEmailAddress, validateEmailConfiguration } from './emailService.js';
import { curriculumPreview } from '../../shared/curriculumPreview.js';
import { getLesson, weekCatalog } from '../../shared/curriculum.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
validateEmailConfiguration();
const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not configured. Run the API only after configuring PostgreSQL.');
if (!sessionSecret || sessionSecret.length < 32) console.warn('SESSION_SECRET should be a random value of at least 32 characters.');

const pool = createDatabasePool();
const PgSession = connectPgSimple(session);
const allowedOrigins = new Set([process.env.FRONTEND_ORIGIN, ...(process.env.VERCEL_PREVIEW_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean), 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'].filter(Boolean));

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
const verificationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });
const csrfToken = (req) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
};
const csrfProtection = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.session.csrfToken || req.get('X-CSRF-Token') !== req.session.csrfToken) return res.status(403).json({ error: 'Invalid request token.' });
  next();
};
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const result = await pool.query('SELECT account_active, email_verified_at FROM users WHERE id = $1', [req.session.userId]);
    if (!result.rows[0]?.account_active) return res.status(401).json({ error: 'Authentication required.' });
    if (!result.rows[0].email_verified_at) return errorResponse(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before accessing this feature.');
    next();
  } catch (error) { next(error); }
};
const requireSession = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: 'Authentication required.' });
const userShape = z.object({ id: z.string(), firstName: z.string(), lastName: z.string(), username: z.string(), email: z.string() });
const registerSchema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/), email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(12).max(128), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
const loginSchema = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });
const progressSchema = z.object({ completedWeeks: z.array(z.number().int().min(1).max(16)), completedCheckpoints: z.array(z.string().min(1).max(120)) });

function publicUser(row) { return { id: row.id, firstName: row.first_name, lastName: row.last_name, username: row.username, email: row.email, createdAt: row.created_at, emailVerified: Boolean(row.email_verified_at) }; }
function regenerate(req) { return new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve())); }
function saveSession(req) { return new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve())); }
function hashToken(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function errorResponse(res, status, code, message, fields) { return res.status(status).json({ error: { code, message }, ...(fields ? { fields } : {}) }); }
function recordActivity(client, userId, activityType, title, detail = null, metadata = {}) { return client.query('INSERT INTO user_activity (user_id, activity_type, title, detail, metadata) VALUES ($1, $2, $3, $4, $5)', [userId, activityType, title, detail, metadata]); }

app.get('/', (_req, res) => res.json({ service: 'dsa-grind-api', status: 'running', health: '/api/health' }));
app.get('/api/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ ok: true, service: 'dsa-grind-api', database: 'connected' }); } catch (error) { logDatabaseError(error, 'health-check'); res.status(503).json({ ok: false, service: 'dsa-grind-api', database: 'unavailable' }); } });
app.get('/api/auth/csrf', (req, res) => res.json({ csrfToken: csrfToken(req) }));

app.post('/api/auth/register', authLimiter, csrfProtection, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, 400, 'INVALID_REGISTRATION', 'Check the highlighted fields.', parsed.error.flatten().fieldErrors);
  let emailValidation;
  try { emailValidation = await validateEmailAddress(parsed.data.email); } catch (error) { if (error.code === 'EMAIL_DNS_TEMPORARY') return errorResponse(res, 503, error.code, error.message); return next(error); }
  if (!emailValidation.ok) return errorResponse(res, 400, emailValidation.code, emailValidation.message, { email: [emailValidation.message] });
  const { firstName, lastName, username, password } = parsed.data;
  const email = emailValidation.email;
  let client;
  let committed = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await client.query('INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, username, email', [firstName, lastName, username, email, passwordHash]);
    await client.query('INSERT INTO user_progress (user_id, week_number, total_lesson_count) SELECT $1, weeks.week_number, 3 FROM generate_series(1, 16) AS weeks(week_number)', [result.rows[0].id]);
    const { rawToken, tokenHash } = createVerificationToken();
    const ttlMinutes = Math.max(30, Math.min(120, Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60)));
    await client.query('INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 * interval \'1 minute\'))', [result.rows[0].id, tokenHash, ttlMinutes]);
    await client.query('UPDATE users SET email_verification_sent_at = now() WHERE id = $1', [result.rows[0].id]);
    await recordActivity(client, result.rows[0].id, 'account', 'Account created', 'Registration completed; email verification is pending.');
    await client.query('COMMIT');
    committed = true;
    await sendVerificationEmail({ email, firstName, rawToken });
    res.status(202).json({ code: 'EMAIL_VERIFICATION_REQUIRED', message: 'Check your inbox to verify your email before signing in.', email });
  } catch (error) {
    if (client && !committed) await client.query('ROLLBACK');
    if (error.code === '23505') return errorResponse(res, 409, 'ACCOUNT_ALREADY_EXISTS', 'An account with those details already exists.');
    if (error.code === 'EMAIL_DELIVERY_FAILED' || error.message === 'Email provider is not configured.') return errorResponse(res, 503, 'EMAIL_DELIVERY_FAILED', 'We could not send the verification email. Please try again shortly.');
    next(error);
  } finally { client?.release(); }
});

app.post('/api/auth/login', authLimiter, csrfProtection, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, 400, 'INVALID_CREDENTIALS', 'Enter a valid email and password.');
  try {
    const result = await pool.query('SELECT id, first_name, last_name, username, email, password_hash, account_active, email_verified_at, created_at FROM users WHERE email = $1', [parsed.data.email]);
    const user = result.rows[0];
    const valid = user?.account_active ? await argon2.verify(user.password_hash, parsed.data.password) : false;
    if (!valid) return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    if (!user.email_verified_at) return errorResponse(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before signing in.');
    await regenerate(req);
    req.session.userId = user.id;
    csrfToken(req);
    await saveSession(req);
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]); await recordActivity(client, user.id, 'auth', 'Signed in', 'Successful account sign-in.'); await client.query('COMMIT'); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', requireSession, csrfProtection, async (req, res, next) => {
  req.session.destroy((error) => error ? next(error) : res.clearCookie('dsa.sid').json({ ok: true }));
});

app.get('/api/auth/me', async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const result = await pool.query('SELECT id, first_name, last_name, username, email, account_active, created_at, email_verified_at FROM users WHERE id = $1', [req.session.userId]);
    if (!result.rows[0]?.account_active) return res.status(401).json({ error: 'Authentication required.' });
    res.json({ user: publicUser(result.rows[0]), csrfToken: csrfToken(req) });
  } catch (error) { next(error); }
});

app.get('/api/users/me', requireAuth, async (req, res, next) => {
  try { const result = await pool.query('SELECT id, first_name, last_name, username, email, created_at, email_verified_at FROM users WHERE id = $1 AND account_active = true', [req.session.userId]); if (!result.rows[0]) return res.status(404).json({ error: 'Profile not found.' }); res.json({ user: publicUser(result.rows[0]) }); } catch (error) { next(error); }
});

app.patch('/api/users/me', requireAuth, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Check your profile fields.', fields: parsed.error.flatten().fieldErrors });
  try { const client = await pool.connect(); try { await client.query('BEGIN'); const result = await client.query('UPDATE users SET first_name = $1, last_name = $2, username = $3, updated_at = now() WHERE id = $4 AND account_active = true RETURNING id, first_name, last_name, username, email, created_at, email_verified_at', [parsed.data.firstName, parsed.data.lastName, parsed.data.username, req.session.userId]); await recordActivity(client, req.session.userId, 'profile', 'Profile updated'); await client.query('COMMIT'); res.json({ user: publicUser(result.rows[0]) }); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'That username is already in use.' }); next(error); }
});

app.post('/api/users/me/password', requireAuth, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(128), confirmPassword: z.string() }).refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' }).safeParse(req.body);
  if (!parsed.success) return errorResponse(res, 400, 'INVALID_PASSWORD_CHANGE', 'Check the password fields.', parsed.error.flatten().fieldErrors);
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1 AND account_active = true', [req.session.userId]);
    if (!result.rows[0] || !(await argon2.verify(result.rows[0].password_hash, parsed.data.currentPassword))) return errorResponse(res, 400, 'CURRENT_PASSWORD_INVALID', 'Your current password is incorrect.');
    const passwordHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id });
    await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, req.session.userId]);
    await recordActivity(pool, req.session.userId, 'security', 'Password changed');
    res.json({ message: 'Password updated.' });
  } catch (error) { next(error); }
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

app.post('/api/auth/verify-email', authLimiter, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ token: z.string().min(32).max(128) }).safeParse(req.body);
  if (!parsed.success) return errorResponse(res, 400, 'INVALID_VERIFICATION_TOKEN', 'This verification link is invalid or expired.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT token.id, token.user_id, users.email_verified_at FROM email_verification_tokens AS token JOIN users ON users.id = token.user_id WHERE token.token_hash = $1 AND token.expires_at > now() AND token.consumed_at IS NULL FOR UPDATE', [hashToken(parsed.data.token)]);
    if (!result.rows[0]) { await client.query('ROLLBACK'); return errorResponse(res, 400, 'INVALID_VERIFICATION_TOKEN', 'This verification link is invalid or expired.'); }
    if (result.rows[0].email_verified_at) { await client.query('ROLLBACK'); return errorResponse(res, 409, 'EMAIL_ALREADY_VERIFIED', 'This email address has already been verified.'); }
    await client.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [result.rows[0].user_id]);
    await client.query('UPDATE email_verification_tokens SET consumed_at = now() WHERE user_id = $1 AND consumed_at IS NULL', [result.rows[0].user_id]);
    await client.query('COMMIT');
    res.json({ code: 'EMAIL_VERIFIED', message: 'Your email has been verified. You can now sign in.' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

app.post('/api/auth/resend-verification', verificationLimiter, csrfProtection, async (req, res, next) => {
  const emailParsed = z.string().trim().email().safeParse(req.body?.email);
  const generic = { code: 'VERIFICATION_EMAIL_REQUESTED', message: 'If that account is awaiting verification, a new email will be sent.' };
  if (!emailParsed.success) return res.status(202).json(generic);
  try {
    const result = await pool.query('SELECT id, first_name, email, email_verified_at, email_verification_sent_at FROM users WHERE email = $1 AND account_active = true', [emailParsed.data.toLowerCase()]);
    const user = result.rows[0];
    if (!user || user.email_verified_at) return res.status(202).json(generic);
    if (user.email_verification_sent_at && Date.now() - new Date(user.email_verification_sent_at).getTime() < 60000) return res.status(202).json(generic);
    const { rawToken, tokenHash } = createVerificationToken();
    const ttlMinutes = Math.max(30, Math.min(120, Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60)));
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE email_verification_tokens SET consumed_at = now() WHERE user_id = $1 AND consumed_at IS NULL', [user.id]);
      await client.query('INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 * interval \'1 minute\'))', [user.id, tokenHash, ttlMinutes]);
      await client.query('UPDATE users SET email_verification_sent_at = now() WHERE id = $1', [user.id]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); client.release(); if (error.code === 'EMAIL_DELIVERY_FAILED' || error.message === 'Email provider is not configured.') return errorResponse(res, 503, 'EMAIL_DELIVERY_FAILED', 'We could not send the verification email. Please try again shortly.'); throw error; }
    client.release();
    try { await sendVerificationEmail({ email: user.email, firstName: user.first_name, rawToken }); }
    catch (error) { if (error.code === 'EMAIL_DELIVERY_FAILED') return errorResponse(res, 503, error.code, error.message); throw error; }
    res.status(202).json(generic);
  } catch (error) { next(error); }
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
    await pool.query('INSERT INTO user_activity (user_id, activity_type, title, detail, metadata) VALUES ($1, \'learning\', $2, $3, $4)', [req.session.userId, completed.data ? 'Lesson checkpoint completed' : 'Lesson checkpoint reopened', lessonId.data, { lessonId: lessonId.data }]);
    res.json({ lessonId: lessonId.data, completed: completed.data });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

app.get('/api/journal', requireAuth, async (req, res, next) => {
  try { const result = await pool.query('SELECT id, week_id AS "weekId", entry, mood, created_at AS "createdAt" FROM solution_journals WHERE user_id = $1 ORDER BY created_at DESC', [req.session.userId]); res.json(result.rows); } catch (error) { next(error); }
});

app.get('/api/activity', requireAuth, async (req, res, next) => {
  try { const result = await pool.query('SELECT id, activity_type AS "activityType", title, detail, occurred_at AS "occurredAt" FROM user_activity WHERE user_id = $1 ORDER BY occurred_at DESC LIMIT 100', [req.session.userId]); res.json({ activities: result.rows }); } catch (error) { next(error); }
});

app.post('/api/journal', requireAuth, csrfProtection, async (req, res, next) => {
  const parsed = z.object({ weekId: z.number().int().min(1).max(16), entry: z.string().trim().min(1).max(10000), mood: z.string().max(40).nullable().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A week and non-empty journal entry are required.' });
  try { const result = await pool.query('INSERT INTO solution_journals (user_id, week_id, entry, mood) VALUES ($1, $2, $3, $4) RETURNING id, week_id AS "weekId", entry, mood, created_at AS "createdAt"', [req.session.userId, parsed.data.weekId, parsed.data.entry, parsed.data.mood || null]); res.status(201).json(result.rows[0]); } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'The server could not complete the request.' }); });

app.listen(port, '0.0.0.0', () => console.log(`DSA Grind API listening on port ${port}`));
