import { randomUUID } from 'node:crypto';
import { transaction } from './settingsModel.js';

export const tutorDailyLimit = () => {
    const value = Number(process.env.TUTOR_DAILY_REQUEST_LIMIT ?? 30);
    return Number.isSafeInteger(value) && value >= 0 && value <= 200 ? value : 30;
};
export const tutorRetentionDays = () => {
    const value = Number(process.env.TUTOR_RETENTION_DAYS ?? 30);
    return Number.isSafeInteger(value) && value >= 1 && value <= 90 ? value : 30;
};
export function tutorError(status, code) {
    return Object.assign(new Error('Tutor request could not be completed.'), { status, code });
}
async function lockOwner(db, userId) {
    const result = await db.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (!result.rows[0]) throw tutorError(401, 'AUTH_REQUIRED');
}
async function cleanup(db, userId) {
    await db.query(
        `DELETE FROM tutor_conversations WHERE user_id = $1
        AND updated_at < now() - $2::integer * interval '1 day'`,
        [userId, tutorRetentionDays()]
    );
    await db.query(
        `DELETE FROM tutor_conversations WHERE user_id = $1 AND id IN
        (SELECT id FROM tutor_conversations WHERE user_id = $1
        ORDER BY updated_at DESC, id DESC OFFSET 100)`,
        [userId]
    );
    await db.query(
        `DELETE FROM tutor_daily_usage WHERE user_id = $1
        AND day < (now() AT TIME ZONE 'UTC')::date - 30`,
        [userId]
    );
}
export async function readTutor(db, userId, moduleId, sectionId) {
    const { rows } = await db.query(
        `SELECT id, module_id AS "moduleId", section_id AS "sectionId",
        created_at AS "createdAt", updated_at AS "updatedAt" FROM tutor_conversations
        WHERE user_id = $1 AND module_id = $2 AND section_id = $3`,
        [userId, moduleId, sectionId]
    );
    const conversation = rows[0] ?? null;
    const messages = conversation
        ? (
              await db.query(
                  `SELECT id, role, content, created_at AS "createdAt"
        FROM (SELECT id, role, content, created_at FROM tutor_messages
        WHERE user_id = $1 AND conversation_id = $2 ORDER BY created_at DESC, id DESC LIMIT 20) history
        ORDER BY created_at, id`,
                  [userId, conversation.id]
              )
          ).rows
        : [];
    const usage = await db.query(
        `SELECT calls FROM tutor_daily_usage WHERE user_id = $1
        AND day = (now() AT TIME ZONE 'UTC')::date`,
        [userId]
    );
    const daily = tutorDailyLimit();
    return {
        conversation,
        messages,
        limits: { daily, remaining: Math.max(0, daily - (usage.rows[0]?.calls ?? 0)) }
    };
}
export async function getTutor(pool, userId, moduleId, sectionId) {
    return transaction(pool, async (db) => {
        await lockOwner(db, userId);
        await cleanup(db, userId);
        return readTutor(db, userId, moduleId, sectionId);
    });
}
export async function reserveTutor(pool, userId, requestId) {
    const token = randomUUID();
    return transaction(pool, async (db) => {
        await lockOwner(db, userId);
        const duplicate = await db.query(
            'SELECT request_id FROM tutor_requests WHERE user_id = $1 AND request_id = $2',
            [userId, requestId]
        );
        if (duplicate.rows[0]) throw tutorError(409, 'TUTOR_DUPLICATE');
        const lease = await db.query(
            `INSERT INTO tutor_leases (user_id, token, expires_at)
            VALUES ($1, $2, now() + interval '90 seconds') ON CONFLICT (user_id)
            DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
            WHERE tutor_leases.expires_at <= now() RETURNING token`,
            [userId, token]
        );
        if (!lease.rows[0]) throw tutorError(409, 'TUTOR_BUSY');
        const usage = await db.query(
            `INSERT INTO tutor_daily_usage (user_id, day, calls)
            SELECT $1, (now() AT TIME ZONE 'UTC')::date, 1 WHERE $2::integer > 0
            ON CONFLICT (user_id, day) DO UPDATE SET calls = tutor_daily_usage.calls + 1
            WHERE tutor_daily_usage.calls < $2 RETURNING calls`,
            [userId, tutorDailyLimit()]
        );
        if (!usage.rows[0]) throw tutorError(429, 'TUTOR_QUOTA');
        await db.query('INSERT INTO tutor_requests (user_id, request_id) VALUES ($1, $2)', [
            userId,
            requestId
        ]);
        await cleanup(db, userId);
        return token;
    });
}
export async function releaseTutor(pool, userId, token) {
    await pool.query('DELETE FROM tutor_leases WHERE user_id = $1 AND token = $2', [userId, token]);
}
export async function saveTutorPair(pool, userId, moduleId, sectionId, token, content, answer) {
    return transaction(pool, async (db) => {
        await lockOwner(db, userId);
        const lease = await db.query(
            'SELECT token FROM tutor_leases WHERE user_id = $1 AND token = $2 AND expires_at > now() FOR UPDATE',
            [userId, token]
        );
        if (!lease.rows[0]) throw tutorError(409, 'TUTOR_EXPIRED');
        const { rows } = await db.query(
            `INSERT INTO tutor_conversations (user_id, module_id, section_id)
            VALUES ($1, $2, $3) ON CONFLICT (user_id, module_id, section_id)
            DO UPDATE SET updated_at = now() RETURNING id`,
            [userId, moduleId, sectionId]
        );
        await db.query(
            `INSERT INTO tutor_messages (user_id, conversation_id, role, content, created_at)
            VALUES ($1, $2, 'user', $3, clock_timestamp()),
            ($1, $2, 'assistant', $4, clock_timestamp() + interval '1 microsecond')`,
            [userId, rows[0].id, content, answer]
        );
        await db.query(
            `DELETE FROM tutor_messages WHERE user_id = $1 AND conversation_id = $2 AND id IN
            (SELECT id FROM tutor_messages WHERE user_id = $1 AND conversation_id = $2
            ORDER BY created_at DESC, id DESC OFFSET 40)`,
            [userId, rows[0].id]
        );
        await cleanup(db, userId);
        return readTutor(db, userId, moduleId, sectionId);
    });
}
export async function clearTutor(pool, userId, moduleId, sectionId) {
    return transaction(pool, async (db) => {
        await lockOwner(db, userId);
        const lease = await db.query(
            'SELECT token FROM tutor_leases WHERE user_id = $1 AND expires_at > now()',
            [userId]
        );
        if (lease.rows[0]) throw tutorError(409, 'TUTOR_BUSY');
        await cleanup(db, userId);
        await db.query(
            'DELETE FROM tutor_conversations WHERE user_id = $1 AND module_id = $2 AND section_id = $3',
            [userId, moduleId, sectionId]
        );
        return { conversation: null, messages: [] };
    });
}
