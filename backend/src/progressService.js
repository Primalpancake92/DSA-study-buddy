import { loadLesson } from './markdownLesson.js';

export async function getSavedProgress(db, userId) {
    // One statement gives all three collections the same PostgreSQL snapshot.
    const { rows } = await db.query(
        `SELECT
            COALESCE((SELECT json_agg(week_number ORDER BY week_number) FROM user_progress WHERE user_id = $1 AND completion_status = 'completed'), '[]'::json) AS "completedWeeks",
            COALESCE((SELECT json_agg(lesson_id ORDER BY updated_at DESC, lesson_id) FROM lesson_progress WHERE user_id = $1 AND status = 'completed'), '[]'::json) AS "completedCheckpoints",
            COALESCE((SELECT json_agg(lesson_id ORDER BY updated_at DESC, lesson_id) FROM lesson_progress WHERE user_id = $1 AND status = 'started'), '[]'::json) AS "startedLessons"`,
        [userId]
    );
    return rows[0];
}

function progressError(status, code, message) {
    return Object.assign(new Error(message), { status, code });
}

export async function saveLessonProgress(
    pool,
    userId,
    lessonId,
    completed,
    startedOnly = false,
    readChapter = loadLesson
) {
    const match = lessonId.match(/^w(\d+)-/);
    const chapter = match ? await readChapter(Number(match[1])) : null;
    const readingIds = chapter?.lessons.map((item) => item.id) || [];
    const conceptIds =
        chapter?.sections.flatMap((section) =>
            [
                ...(section.markdown || '').matchAll(
                    /<!--\s*checkpoint:(w\d+-[a-z][a-z0-9-]*)\s*-->/g
                )
            ].map((item) => item[1])
        ) || [];
    const allowedIds = new Set([
        ...readingIds,
        ...conceptIds,
        ...(chapter?.checkpoint || []).map((_, index) => `w${chapter.id}-${index}`)
    ]);
    if (!chapter || !allowedIds.has(lessonId)) {
        throw progressError(
            400,
            'UNKNOWN_LESSON',
            'This lesson is unavailable. Reload the module and try again.'
        );
    }
    let client;
    let transaction = false;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        transaction = true;
        // Serialize a user's progress writes, including requests from other tabs.
        const user = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
        if (!user.rowCount) {
            throw progressError(
                401,
                'AUTH_REQUIRED',
                'Your session has expired. Please sign in again.'
            );
        }
        const previous = await client.query(
            'SELECT status FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2',
            [userId, lessonId]
        );
        const module = await client.query(
            'SELECT completion_status FROM user_progress WHERE user_id = $1 AND week_number = $2::integer',
            [userId, chapter.id]
        );
        const protectedStart =
            startedOnly &&
            (previous.rows[0]?.status === 'completed' ||
                module.rows[0]?.completion_status === 'completed');
        const nextStatus = protectedStart ? 'completed' : completed ? 'completed' : 'started';
        const changed = !protectedStart && previous.rows[0]?.status !== nextStatus;
        if (changed) {
            await client.query(
                "INSERT INTO lesson_progress (user_id, lesson_id, status, completed_at) VALUES ($1, $2, $3::text, CASE WHEN $3::text = 'completed' THEN now() ELSE NULL END) ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, completed_at = CASE WHEN EXCLUDED.status = 'completed' THEN COALESCE(lesson_progress.completed_at, EXCLUDED.completed_at) ELSE NULL END, updated_at = now()",
                [userId, lessonId, nextStatus]
            );
        }
        const count = await client.query(
            "SELECT count(*) FILTER (WHERE status = 'completed')::integer AS count, count(*)::integer AS tracked FROM lesson_progress WHERE user_id = $1 AND lesson_id = ANY($2::text[])",
            [userId, readingIds]
        );
        const usesReadingProgress = readingIds.includes(lessonId) || count.rows[0].tracked > 0;
        const preserveLegacyCompletion =
            module.rows[0]?.completion_status === 'completed' &&
            (!readingIds.includes(lessonId) || completed);
        if (!protectedStart && usesReadingProgress && !preserveLegacyCompletion) {
            // Explicit integer casts prevent PostgreSQL inferring text parameters
            // in the CASE expression (the original 42883 checkpoint failure).
            await client.query(
                "INSERT INTO user_progress (user_id, week_number, completed_lesson_count, total_lesson_count, completion_status) VALUES ($3, $4::integer, $1::integer, $2::integer, CASE WHEN $1::integer = $2::integer AND $2::integer > 0 THEN 'completed' ELSE 'started' END) ON CONFLICT (user_id, week_number) DO UPDATE SET completed_lesson_count = EXCLUDED.completed_lesson_count, total_lesson_count = EXCLUDED.total_lesson_count, completion_status = EXCLUDED.completion_status, updated_at = now()",
                [count.rows[0].count, readingIds.length, userId, chapter.id]
            );
        } else if (!protectedStart && !usesReadingProgress && /^w\d+-\d+$/.test(lessonId)) {
            const mastery = await client.query(
                "SELECT count(*)::integer AS count FROM lesson_progress WHERE user_id = $1 AND lesson_id ~ $2 AND status = 'completed'",
                [userId, `^w${chapter.id}-[0-9]+$`]
            );
            await client.query(
                "UPDATE user_progress SET completed_lesson_count = $1::integer, completion_status = CASE WHEN $1::integer >= total_lesson_count AND total_lesson_count > 0 THEN 'completed' ELSE 'started' END, updated_at = now() WHERE user_id = $2 AND week_number = $3::integer",
                [mastery.rows[0].count, userId, chapter.id]
            );
        }
        if (changed) {
            await client.query(
                "INSERT INTO user_activity (user_id, activity_type, title, detail, metadata) VALUES ($1, 'learning', $2, $3, $4::jsonb)",
                [
                    userId,
                    nextStatus === 'completed'
                        ? 'Lesson checkpoint completed'
                        : startedOnly
                          ? 'Lesson started'
                          : 'Lesson checkpoint reopened',
                    lessonId,
                    JSON.stringify({ lessonId })
                ]
            );
        }
        const snapshot = await getSavedProgress(client, userId);
        await client.query('COMMIT');
        transaction = false;
        return { ...snapshot, lessonId, completed: nextStatus === 'completed' };
    } catch (error) {
        if (transaction) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Preserve the original failure for safe route diagnostics.
            }
        }
        throw error;
    } finally {
        client?.release();
    }
}
