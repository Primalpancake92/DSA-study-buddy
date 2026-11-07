import { createHash } from 'node:crypto';
import { z } from 'zod';
import { defaultSettings } from '../../shared/settingsDefaults.js';
export { defaultSettings };

export function normalizeConnection(platform, input) {
    const value = input.trim();
    if (!value) return '';
    let name = value;
    if (/^https?:\/\//i.test(value)) {
        const url = new URL(value);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.port ||
            url.search ||
            url.hash
        )
            throw new Error('Invalid profile URL.');
        if (![`${platform}.com`, `www.${platform}.com`].includes(url.hostname))
            throw new Error('Invalid profile host.');
        const match =
            platform === 'leetcode'
                ? url.pathname.match(/^\/u\/([A-Za-z0-9_-]+)\/?$/)
                : url.pathname.match(/^\/(?:profile\/)?([A-Za-z0-9_-]+)\/?$/);
        if (!match) throw new Error('Invalid profile path.');
        name = match[1];
        if (
            platform === 'hackerrank' &&
            /^(profile|domains|contests|challenges|skills|dashboard|auth|login|signup|settings|jobs|careers|leaderboard|certificates|work|interview|products|pricing|about|blog|support)$/i.test(
                name
            )
        )
            throw new Error('Not a public profile.');
    }
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) throw new Error('Invalid username.');
    return platform === 'leetcode'
        ? `https://leetcode.com/u/${name}/`
        : `https://www.hackerrank.com/profile/${name}`;
}
const connection = (platform) =>
    z
        .string()
        .max(300)
        .transform((value, ctx) => {
            try {
                return normalizeConnection(platform, value);
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Use a username or official public profile URL.'
                });
                return z.NEVER;
            }
        });
const categories = {
    learning: z
        .object({
            dailyMinutes: z.number().int().min(15).max(240),
            daysPerWeek: z.number().int().min(1).max(7),
            difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'adaptive']),
            showHints: z.boolean(),
            hideSolutions: z.boolean(),
            stepByStep: z.boolean(),
            revisionExercises: z.boolean(),
            showEstimates: z.boolean()
        })
        .strict(),
    notifications: z
        .object({
            study: z.boolean(),
            reviews: z.boolean(),
            weeklySummary: z.boolean(),
            moduleCompletion: z.boolean()
        })
        .strict(),
    appearance: z.object({ theme: z.enum(['dark', 'light', 'system']) }).strict(),
    accessibility: z
        .object({
            fontSize: z.enum(['small', 'default', 'large', 'extra-large']),
            readingWidth: z.enum(['narrow', 'comfortable', 'wide']),
            lineSpacing: z.enum(['compact', 'comfortable', 'relaxed']),
            reducedMotion: z.boolean(),
            enhancedContrast: z.boolean()
        })
        .strict(),
    connections: z
        .object({ leetcode: connection('leetcode'), hackerrank: connection('hackerrank') })
        .strict()
};
export const settingsSchema = z.object(categories).strict();
export const settingsPatchSchema = z
    .object(
        Object.fromEntries(
            Object.entries(categories).map(([key, schema]) => [key, schema.partial().optional()])
        )
    )
    .strict();
// Fail early if shared defaults drift from the backend contract.
settingsSchema.parse(defaultSettings);

// Project individual stored fields through the schema, excluding unknown or invalid data.
export function mergeSettings(stored = {}, patch = {}) {
    const result = structuredClone(defaultSettings);
    for (const [category, schema] of Object.entries(categories)) {
        for (const [key, field] of Object.entries(schema.shape)) {
            const parsed = field.safeParse(stored?.[category]?.[key]);
            if (parsed.success) result[category][key] = parsed.data;
        }
        Object.assign(result[category], patch[category] || {});
    }
    return settingsSchema.parse(result);
}
export async function getSettings(db, userId) {
    const { rows } = await db.query('SELECT preferences FROM user_settings WHERE user_id = $1', [
        userId
    ]);
    return mergeSettings(rows[0]?.preferences);
}
export async function transaction(pool, action, begin = 'BEGIN') {
    const client = await pool.connect();
    try {
        await client.query(begin);
        const result = await action(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // Preserve the original transaction failure if rollback also fails.
        }
        throw error;
    } finally {
        client.release();
    }
}
export async function updateSettings(pool, userId, patch) {
    const validated = settingsPatchSchema.parse(patch);
    return transaction(pool, async (client) => {
        const owner = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
        if (!owner.rows[0]) throw Object.assign(new Error('Account unavailable.'), { status: 401 });
        const settings = mergeSettings(await getSettings(client, userId), validated);
        await client.query(
            'INSERT INTO user_settings (user_id, preferences) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = now()',
            [userId, JSON.stringify(settings)]
        );
        return settings;
    });
}
export const sessionHandle = (sid) => createHash('sha256').update(sid).digest('hex');
export async function listSessions(db, userId, currentSid) {
    const { rows } = await db.query(
        "SELECT sid, expire FROM sessions WHERE sess->>'userId' = $1 AND expire > now() ORDER BY expire, sid",
        [userId]
    );
    return rows.map(({ sid, expire }) => ({
        id: sessionHandle(sid),
        current: sid === currentSid,
        expiresAt: expire
    }));
}
export async function revokeOtherSessions(db, userId, sid) {
    const result = await db.query("DELETE FROM sessions WHERE sess->>'userId' = $1 AND sid <> $2", [
        userId,
        sid
    ]);
    return result.rowCount;
}
const exportTables = {
    progress: [
        'user_progress',
        'week_number, completion_status, completed_lesson_count, total_lesson_count, updated_at'
    ],
    lessons: ['lesson_progress', 'lesson_id, status, completed_at, updated_at'],
    attempts: ['problem_attempts', 'id, problem_id, status, code, created_at'],
    journals: ['solution_journals', 'id, week_id, entry, mood, created_at'],
    review_queue: ['review_queue', 'id, lesson_id, due_at, interval_days'],
    mocks: ['mock_interviews', 'id, prompt, notes, created_at'],
    practice: [
        'user_problem_progress',
        'problem_id, status, attempts_count, notes, last_attempted_at, solved_at, review_stage, next_review_at, updated_at'
    ],
    sectionNotes: ['section_notes', 'module_id, section_id, content, version, updated_at'],
    tutorConversations: ['tutor_conversations', 'id, module_id, section_id, created_at, updated_at'],
    tutorMessages: ['tutor_messages', 'id, conversation_id, role, content, created_at']
};
export async function exportAccount(pool, userId) {
    return transaction(
        pool,
        async (client) => {
            const { rows } = await client.query(
                'SELECT id, first_name, last_name, username, email, created_at, updated_at, last_login_at, email_verified_at FROM users WHERE id = $1',
                [userId]
            );
            // Explicit projection also protects against accidental expansion by a database adapter.
            const profileKeys = [
                'id',
                'first_name',
                'last_name',
                'username',
                'email',
                'created_at',
                'updated_at',
                'last_login_at',
                'email_verified_at'
            ];
            const data = {
                profile: rows[0]
                    ? Object.fromEntries(profileKeys.map((key) => [key, rows[0][key]]))
                    : null
            };
            for (const [key, [table, columns]] of Object.entries(exportTables)) {
                const result = await client.query(
                    `SELECT ${columns} FROM ${table} WHERE user_id = $1${key === 'sectionNotes' ? ' AND is_deleted = false' : ''}`,
                    [userId]
                );
                data[key] = result.rows.map((row) =>
                    Object.fromEntries(columns.split(', ').map((column) => [column, row[column]]))
                );
            }
            data.preferences = await getSettings(client, userId);
            return data;
        },
        'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'
    );
}
export function csvCell(value) {
    let text = value == null ? '' : String(value);
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}
export function practiceCsv(data) {
    const columns = exportTables.practice[1].split(', ');
    return (
        [columns, ...(data.practice || []).map((row) => columns.map((key) => row[key]))]
            .map((row) => row.map(csvCell).join(','))
            .join('\r\n') + '\r\n'
    );
}
