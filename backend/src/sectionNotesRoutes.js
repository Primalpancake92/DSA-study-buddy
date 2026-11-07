import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getSectionNote, isSectionNoteTarget, writeSectionNote } from './sectionNotesService.js';

const version = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const sectionNoteSchema = z.object({ content: z.string().max(20000), version }).strict();
export const sectionNoteDeleteSchema = z.object({ version }).strict();

export function createSectionNotesRouter({ pool, requireAuth, csrfProtection }) {
    if (typeof requireAuth !== 'function' || typeof csrfProtection !== 'function')
        throw new TypeError('Section notes require authentication and CSRF protection.');
    const router = Router();
    router.use(requireAuth);
    router.use((_req, res, next) => {
        res.set('Cache-Control', 'private, no-store');
        next();
    });
    const limiter = rateLimit({
        windowMs: 60000,
        limit: 60,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    });
    const handle = (method) => async (req, res, next) => {
        const moduleId = Number(req.params.moduleId);
        const sectionId = req.params.sectionId;
        try {
            if (
                !/^\d+$/.test(req.params.moduleId) ||
                !(await isSectionNoteTarget(moduleId, sectionId))
            )
                return res.status(404).json({ error: 'Section not found.' });
            if (method === 'get')
                return res.json({
                    note: await getSectionNote(pool, req.session.userId, moduleId, sectionId)
                });
            const parsed = (
                method === 'delete' ? sectionNoteDeleteSchema : sectionNoteSchema
            ).safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ error: 'Invalid section note payload.' });
            const note = await writeSectionNote(
                pool,
                req.session.userId,
                moduleId,
                sectionId,
                parsed.data,
                method === 'delete'
            );
            if (!note)
                return res
                    .status(409)
                    .json({
                        code: 'NOTE_CONFLICT',
                        error: 'This note has changed. Reload it before saving.'
                    });
            return res.json({ note });
        } catch (error) {
            next(error);
        }
    };
    router.get('/:moduleId/:sectionId', handle('get'));
    router.put('/:moduleId/:sectionId', limiter, csrfProtection, handle('put'));
    router.delete('/:moduleId/:sectionId', limiter, csrfProtection, handle('delete'));
    return router;
}
