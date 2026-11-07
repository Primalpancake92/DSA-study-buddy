import { Router } from 'express';
import { z } from 'zod';
import { isSectionNoteTarget } from './sectionNotesService.js';
import * as tutorStore from './tutorStore.js';

export const tutorSchema = z
    .object({
        message: z
            .string()
            .min(1)
            .max(4000)
            .refine((value) => value.trim().length > 0),
        code: z.string().max(8000).optional(),
        includeNotes: z.boolean().optional(),
        mode: z.enum(['tutor', 'summary']).optional(),
        requestId: z
            .string()
            .uuid()
            .transform((value) => value.toLowerCase())
    })
    .strict();

const defaultEnabled = async () => (await import('./tutorProvider.js')).tutorEnabled();
const defaultBuildInput = async (options) =>
    (await import('./tutorContext.js')).buildTutorInput(options);
async function* defaultStream(options) {
    const { createTutorProvider } = await import('./tutorProvider.js');
    const provider = createTutorProvider();
    yield* typeof provider === 'function' ? provider(options) : provider.streamTutor(options);
}
const messages = {
    AUTH_REQUIRED: 'Your session has expired. Please sign in again.',
    TUTOR_DUPLICATE: 'This request was already submitted. Reload history before retrying.',
    TUTOR_BUSY: 'Another tutor request is running. Please wait a moment.',
    TUTOR_QUOTA: 'Your daily tutor limit has been reached. Please try tomorrow (UTC).',
    TUTOR_EXPIRED: 'This request expired. Reload history before retrying.',
    TUTOR_DISABLED: 'The AI tutor has not been enabled by the administrator.',
    TUTOR_INPUT_TOO_LONG:
        'This question and context are too long. Shorten your code or clear this conversation.',
    TUTOR_TIMEOUT: 'The tutor timed out. Please try a shorter question.',
    TUTOR_PROVIDER_LIMIT: 'The AI provider is busy. Please try again later.',
    TUTOR_PROVIDER_UNAVAILABLE:
        'The AI tutor is temporarily unavailable. Your lesson and notes are unchanged.'
};
const codes = new Set(Object.keys(messages));

export function createTutorRouter({
    pool,
    requireAuth,
    csrfProtection,
    streamTutor = defaultStream,
    buildInput = defaultBuildInput,
    enabled = defaultEnabled,
    store = tutorStore
}) {
    if (typeof requireAuth !== 'function' || typeof csrfProtection !== 'function')
        throw new TypeError('Tutor requires authentication and CSRF protection.');
    const router = Router();
    router.use(requireAuth);
    router.use((_req, res, next) => {
        res.set('Cache-Control', 'private, no-store');
        next();
    });
    const handle = (method) => async (req, res) => {
        const userId = req.session.userId;
        const moduleId = Number(req.params.moduleId);
        const sectionId = req.params.sectionId;
        let token;
        let streaming = false;
        const controller = new AbortController();
        const abort = () => controller.abort();
        const send = (event) => {
            if (!controller.signal.aborted && !res.destroyed && !res.writableEnded)
                res.write(`data: ${JSON.stringify(event)}\n\n`);
        };
        try {
            if (
                !/^\d+$/.test(req.params.moduleId) ||
                !(await isSectionNoteTarget(moduleId, sectionId))
            )
                return res.status(404).json({ error: 'Section not found.' });
            if (method === 'get')
                return res.json({
                    ...(await store.getTutor(pool, userId, moduleId, sectionId)),
                    enabled: Boolean(await enabled())
                });
            if (method === 'delete')
                return res.json(await store.clearTutor(pool, userId, moduleId, sectionId));
            const parsed = tutorSchema.safeParse(req.body);
            if (!parsed.success) return res.status(400).json({ error: 'Invalid tutor payload.' });
            if (!(await enabled())) throw tutorStore.tutorError(503, 'TUTOR_DISABLED');
            req.on('aborted', abort);
            res.on('close', abort);
            token = await store.reserveTutor(pool, userId, parsed.data.requestId);
            const { messages: history } = await store.getTutor(pool, userId, moduleId, sectionId);
            if (controller.signal.aborted) throw new Error('Aborted');
            const input = await buildInput({
                ...parsed.data,
                userId,
                moduleId,
                sectionId,
                pool,
                history
            });
            if (controller.signal.aborted) throw new Error('Aborted');
            res.set('Content-Type', 'text/event-stream');
            res.set('X-Accel-Buffering', 'no');
            res.flushHeaders?.();
            streaming = true;
            let answer = '';
            for await (const text of streamTutor({ input, signal: controller.signal })) {
                if (controller.signal.aborted) throw new Error('Aborted');
                if (typeof text !== 'string' || answer.length + text.length > 64000)
                    throw new Error('Invalid provider output');
                answer += text;
                send({ type: 'delta', text });
            }
            if (controller.signal.aborted || !answer.trim()) throw new Error('Incomplete response');
            const content =
                parsed.data.message +
                (parsed.data.code ? `\n\nShared code:\n${parsed.data.code}` : '');
            const saved = await store.saveTutorPair(
                pool,
                userId,
                moduleId,
                sectionId,
                token,
                content,
                answer
            );
            send({
                type: 'done',
                messages: saved.messages,
                conversation: saved.conversation,
                limits: saved.limits
            });
        } catch (error) {
            const code = codes.has(error.code) ? error.code : 'TUTOR_UNAVAILABLE';
            const message =
                messages[code] ||
                'Tutor request could not be completed. Please reload history and retry.';
            if (streaming) send({ type: 'error', message, code });
            else if (!controller.signal.aborted)
                res.status(codes.has(error.code) ? error.status : 503).json({
                    error: message,
                    code
                });
        } finally {
            if (token) {
                try {
                    await store.releaseTutor(pool, userId, token);
                } catch {
                    // The database lease expires automatically; never expose provider or SQL errors.
                }
            }
            req.removeListener?.('aborted', abort);
            res.removeListener('close', abort);
            if (streaming && !res.writableEnded && !res.destroyed) res.end();
        }
    };
    router.get('/:moduleId/:sectionId', handle('get'));
    router.post('/:moduleId/:sectionId', csrfProtection, handle('post'));
    router.delete('/:moduleId/:sectionId', csrfProtection, handle('delete'));
    return router;
}
