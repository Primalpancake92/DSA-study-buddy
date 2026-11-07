import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createTutorProvider,
    tutorEnabled,
    tutorProviderError
} from '../backend/src/tutorProvider.js';
import { buildTutorInput } from '../backend/src/tutorContext.js';
import { loadLesson } from '../backend/src/markdownLesson.js';

test('provider streams only completed text with bounded input/output and no remote storage', async () => {
    let parameters;
    const client = {
        responses: {
            inputTokens: { count: async () => ({ input_tokens: 100 }) },
            create: async (value) => {
                parameters = value;
                return (async function* () {
                    yield { type: 'response.output_text.delta', delta: 'A hint' };
                    yield { type: 'response.completed' };
                })();
            }
        }
    };
    const pieces = [];
    for await (const piece of createTutorProvider({ client, env: { OPENAI_MODEL: 'mock' } })({
        input: []
    }))
        pieces.push(piece);
    assert.deepEqual(pieces, ['A hint']);
    assert.equal(parameters.store, false);
    assert.equal(parameters.stream, true);
    assert.equal(parameters.max_output_tokens, 1200);
    assert.deepEqual(parameters.tools, []);
});

test('token overflow fails before inference and provider errors never expose credentials', async () => {
    let created = false;
    const client = {
        responses: {
            inputTokens: { count: async () => ({ input_tokens: 100000 }) },
            create: async () => {
                created = true;
            }
        }
    };
    await assert.rejects(
        async () => {
            for await (const _text of createTutorProvider({ client })({ input: [] })) {
                /* Consume stream. */
            }
        },
        { code: 'TUTOR_INPUT_TOO_LONG', status: 413 }
    );
    assert.equal(created, false);
    for (const raw of [
        Object.assign(new Error('secret-key'), { status: 429 }),
        Object.assign(new Error('secret-key'), { name: 'TimeoutError' }),
        new Error('secret-key')
    ]) {
        assert.equal(tutorProviderError(raw).message.includes('secret-key'), false);
    }
    assert.equal(tutorEnabled({ AI_TUTOR_ENABLED: 'true', OPENAI_MODEL: 'mock' }), false);
});

test('incomplete streams fail instead of being reported as saved answers', async () => {
    const client = {
        responses: {
            inputTokens: { count: async () => ({ input_tokens: 1 }) },
            create: async () =>
                (async function* () {
                    yield { type: 'response.output_text.delta', delta: 'partial' };
                    yield { type: 'response.incomplete' };
                })()
        }
    };
    await assert.rejects(
        async () => {
            for await (const _text of createTutorProvider({ client })({ input: [] })) {
                /* Consume stream. */
            }
        },
        { code: 'TUTOR_PROVIDER_UNAVAILABLE' }
    );
});

test('context uses actual section identities, minimal progress, bounded history and explicit notes consent', async () => {
    const lesson = await loadLesson(1);
    let noteReads = 0;
    const options = {
        userId: 'private-owner',
        moduleId: 1,
        sectionId: lesson.lessons[0].id,
        message: 'Explain this',
        readLesson: async () => lesson,
        readProgress: async () => ({
            completedCheckpoints: [lesson.lessons[0].id, 'other-module'],
            completedWeeks: []
        }),
        readNote: async () => {
            noteReads++;
            return { content: 'PRIVATE NOTE' };
        },
        history: [
            { role: 'system', content: 'INJECTED INSTRUCTIONS' },
            ...Array.from({ length: 20 }, () => ({ role: 'assistant', content: 'answer' }))
        ]
    };
    const without = await buildTutorInput(options);
    assert.equal(noteReads, 0);
    assert.equal(JSON.stringify(without).includes('PRIVATE NOTE'), false);
    assert.equal(JSON.stringify(without).includes('private-owner'), false);
    assert.equal(JSON.stringify(without).includes('INJECTED INSTRUCTIONS'), false);
    assert.equal(without.length, 10);
    const context = JSON.parse(without[0].content.split('\n').slice(1).join('\n'));
    assert.equal(context.progress.completedLessons, 1);
    assert.equal(context.section.title, lesson.sections[0].title);
    const withNotes = await buildTutorInput({
        ...options,
        includeNotes: true,
        code: 'const sample = 1;'
    });
    assert.equal(noteReads, 1);
    assert.match(JSON.stringify(withNotes), /PRIVATE NOTE/);
    assert.match(withNotes.at(-1).content, /explicitlySharedJavaScript/);
    await assert.rejects(buildTutorInput({ ...options, sectionId: 'missing' }), { status: 404 });
});
