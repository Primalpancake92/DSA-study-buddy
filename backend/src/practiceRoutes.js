import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { practiceCatalog, getPracticeForWeek } from '../../shared/practiceCatalog.js';
import { savePracticeProgress } from './practiceService.js';
import { isModuleId } from '../../shared/curriculum.js';

export const practiceUpdateSchema = z
    .object({
        status: z.enum(['not-started', 'attempted', 'solved', 'review-needed']),
        attemptsCount: z.number().int().min(0).max(10000).optional(),
        notes: z.string().max(4000).optional()
    })
    .strict();

export function createPracticeRouter({ pool, requireAuth, csrfProtection }) {
    const router = Router();
    router.use(requireAuth);
    router.get('/', async (req, res, next) => {
        const parsed = z.coerce.number().int().refine(isModuleId).safeParse(req.query.week);
        if (req.query.week !== undefined && !parsed.success)
            return res.status(400).json({ error: 'Choose an available learning module.' });
        try {
            const problems =
                req.query.week === undefined ? practiceCatalog : getPracticeForWeek(parsed.data);
            const { rows } = await pool.query(
                'SELECT * FROM user_problem_progress WHERE user_id = $1 AND problem_id = ANY($2::text[])',
                [req.session.userId, problems.map((problem) => problem.id)]
            );
            const states = new Map(rows.map((row) => [row.problem_id, row]));
            res.set('Cache-Control', 'private, no-store').json({
                problems: problems.map((problem) => ({
                    ...problem,
                    progress: states.get(problem.id) || {
                        status: 'not-started',
                        attempts_count: 0,
                        notes: ''
                    }
                })),
                sync: 'manual'
            });
        } catch (error) {
            next(error);
        }
    });
    router.patch(
        '/:problemId',
        rateLimit({ windowMs: 60000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }),
        csrfProtection,
        async (req, res, next) => {
            const problem = practiceCatalog.find((item) => item.id === req.params.problemId);
            if (!problem) return res.status(404).json({ error: 'Practice problem not found.' });
            const parsed = practiceUpdateSchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({
                    error: 'Check the practice status, attempts and notes.',
                    fields: parsed.error.flatten().fieldErrors
                });
            try {
                const progress = await savePracticeProgress(
                    pool,
                    req.session.userId,
                    problem,
                    parsed.data
                );
                res.set('Cache-Control', 'private, no-store').json({ progress });
            } catch (error) {
                next(error);
            }
        }
    );
    return router;
}
