import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { verifyPassword } from './passwords.js';
import { getLearningReminders } from './learningReminders.js';
import {
    settingsPatchSchema,
    getSettings,
    updateSettings,
    listSessions,
    revokeOtherSessions,
    exportAccount,
    practiceCsv,
    transaction
} from './settingsModel.js';

const deletionSchema = z
    .object({
        password: z.string().min(1).max(128),
        confirmation: z.literal('DELETE MY ACCOUNT')
    })
    .strict();

function createSafeHandler(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            const code = /^[A-Z0-9_]{1,40}$/.test(error.code || '') ? error.code : 'REQUEST_FAILED';

            console.error('[settings]', JSON.stringify({ code }));
            const authenticationRequired = error.status === 401;
            res.status(authenticationRequired ? 401 : 500).json({
                error: authenticationRequired
                    ? 'Authentication required.'
                    : 'The server could not complete the request.'
            });
        }
    };
}

function destroySession(request) {
    return new Promise((resolve, reject) => {
        request.session.destroy((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

async function deleteAccount(pool, userId, password) {
    return transaction(pool, async (client) => {
        const { rows } = await client.query(
            'SELECT id, password_hash FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );

        if (!rows[0] || !(await verifyPassword(rows[0].password_hash, password))) {
            return false;
        }

        await client.query("DELETE FROM sessions WHERE sess->>'userId' = $1", [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        return true;
    });
}

export function createSettingsRouter({ pool, requireAuth, csrfProtection }) {
    if (typeof requireAuth !== 'function' || typeof csrfProtection !== 'function') {
        throw new TypeError('Authentication and CSRF middleware are required.');
    }

    const router = Router();
    router.use(requireAuth);
    router.use((_req, res, next) => {
        res.set('Cache-Control', 'private, no-store');
        next();
    });

    const mutationLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    });
    const deletionLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    });
    const safe = createSafeHandler;

    router.get(
        '/',
        safe(async (req, res) => {
            const settings = await getSettings(pool, req.session.userId);
            res.json({ settings });
        })
    );

    router.get(
        '/reminders',
        safe(async (req, res) => {
            const reminders = await getLearningReminders(pool, req.session.userId);
            res.json({ reminders });
        })
    );

    router.patch(
        '/',
        mutationLimit,
        csrfProtection,
        safe(async (req, res) => {
            const parsed = settingsPatchSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: 'Invalid settings.' });
                return;
            }

            const settings = await updateSettings(pool, req.session.userId, parsed.data);
            res.json({ settings });
        })
    );

    router.get(
        '/sessions',
        safe(async (req, res) => {
            const sessions = await listSessions(pool, req.session.userId, req.sessionID);
            res.json({ sessions });
        })
    );

    router.post(
        '/sessions/revoke-others',
        mutationLimit,
        csrfProtection,
        safe(async (req, res) => {
            const count = await revokeOtherSessions(pool, req.session.userId, req.sessionID);
            res.json({ count });
        })
    );

    router.get(
        '/export',
        safe(async (req, res) => {
            const format = req.query.format ?? 'json';
            if (!['json', 'csv'].includes(format)) {
                res.status(400).json({ error: 'Choose json or csv.' });
                return;
            }

            const data = await exportAccount(pool, req.session.userId);
            if (format === 'csv') {
                res.json({ csv: practiceCsv(data) });
                return;
            }

            res.json(data);
        })
    );

    router.delete(
        '/account',
        deletionLimit,
        csrfProtection,
        safe(async (req, res) => {
            const parsed = deletionSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    error: 'Password and exact deletion confirmation are required.'
                });
                return;
            }

            const deleted = await deleteAccount(pool, req.session.userId, parsed.data.password);
            if (!deleted) {
                res.status(400).json({ error: 'Unable to verify account credentials.' });
                return;
            }

            const { httpOnly, secure, sameSite, path, domain } = req.session.cookie;

            await destroySession(req);
            res.clearCookie('dsa.sid', {
                httpOnly,
                secure,
                sameSite,
                path,
                ...(domain ? { domain } : {})
            }).json({ ok: true });
        })
    );

    return router;
}
