import { isModuleId } from '../../shared/curriculum.js';
import { loadLesson } from './markdownLesson.js';

export async function isSectionNoteTarget(moduleId, sectionId) {
    if (!isModuleId(moduleId) || typeof sectionId !== 'string' || sectionId.length > 120)
        return false;
    const lesson = await loadLesson(moduleId);
    if (!lesson) return false;
    const ids = new Set();
    for (const section of lesson.sections) {
        const reading = lesson.lessons.find((item) => item.sectionId === section.id);
        ids.add(reading ? reading.id : `w${moduleId}-section-${section.id}`);
    }
    // LessonPage inserts this existing synthetic section beside the mastery checkpoint.
    if (moduleId !== 1 && lesson.sections.some((item) => item.id === 'module-summary-and-mastery'))
        ids.add(`w${moduleId}-section-coding-practice`);
    return ids.has(sectionId);
}

export function sectionNote(row) {
    return {
        content: row?.content ?? '',
        version: row?.version ?? 0,
        updatedAt: row?.updated_at ?? null,
        exists: row ? !row.is_deleted : false
    };
}

export async function getSectionNote(pool, userId, moduleId, sectionId) {
    const { rows } = await pool.query(
        `SELECT content, version, updated_at, is_deleted FROM section_notes
        WHERE user_id = $1 AND module_id = $2 AND section_id = $3`,
        [userId, moduleId, sectionId]
    );
    return sectionNote(rows[0]);
}

export async function writeSectionNote(pool, userId, moduleId, sectionId, input, deleted = false) {
    const values = [userId, moduleId, sectionId, deleted ? '' : input.content, deleted];
    const result =
        input.version === 0
            ? await pool.query(
                  `INSERT INTO section_notes (user_id, module_id, section_id, content, is_deleted)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, module_id, section_id) DO NOTHING
            RETURNING content, version, updated_at, is_deleted`,
                  values
              )
            : await pool.query(
                  `UPDATE section_notes SET content = $4, is_deleted = $5,
            version = version + 1, updated_at = now()
            WHERE user_id = $1 AND module_id = $2 AND section_id = $3 AND version = $6
            RETURNING content, version, updated_at, is_deleted`,
                  [...values, input.version]
              );
    return result.rows[0] ? sectionNote(result.rows[0]) : null;
}
