import OpenAI from 'openai';
import { tutorInstructions } from './tutorContext.js';

const limit = (value, fallback, minimum, maximum) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
};
export function tutorEnabled(env = process.env) {
    return env.AI_TUTOR_ENABLED === 'true' && Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL);
}
export function tutorConfiguration(env = process.env) {
    return {
        model: env.OPENAI_MODEL,
        maxInput: limit(env.TUTOR_MAX_INPUT_TOKENS, 8000, 1000, 16000),
        maxOutput: limit(env.TUTOR_MAX_OUTPUT_TOKENS, 1200, 128, 2000),
        timeout: 60000
    };
}
export function tutorProviderError(error) {
    if (error?.code === 'TUTOR_INPUT_TOO_LONG') return error;
    if (
        error?.name === 'AbortError' ||
        error?.name === 'TimeoutError' ||
        /timeout/i.test(error?.name || '')
    ) {
        return Object.assign(
            new Error(
                'The tutor request timed out or was cancelled. Please try a shorter question.'
            ),
            {
                status: 504,
                code: 'TUTOR_TIMEOUT'
            }
        );
    }
    if (error?.status === 429) {
        return Object.assign(new Error('The AI provider is busy. Please try again later.'), {
            status: 503,
            code: 'TUTOR_PROVIDER_LIMIT'
        });
    }
    return Object.assign(
        new Error('The AI tutor is temporarily unavailable. Your lesson and notes are unchanged.'),
        {
            status: 503,
            code: 'TUTOR_PROVIDER_UNAVAILABLE'
        }
    );
}

export function createTutorProvider({ client, env = process.env } = {}) {
    const config = tutorConfiguration(env);
    return async function* streamTutor({ input, signal }) {
        if (!client && !tutorEnabled(env)) throw tutorProviderError();
        const sdk =
            client ||
            new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: config.timeout, maxRetries: 0 });
        const abort = AbortSignal.any([
            signal || new AbortController().signal,
            AbortSignal.timeout(config.timeout)
        ]);
        try {
            const parameters = { model: config.model, instructions: tutorInstructions, input };
            // The provider's actual tokenizer enforces the input cap. Failure to
            // count fails closed; no paid inference is attempted in that case.
            const count = await sdk.responses.inputTokens.count(parameters, { signal: abort });
            if (!Number.isInteger(count.input_tokens) || count.input_tokens > config.maxInput) {
                throw Object.assign(
                    new Error(
                        'This question and its context are too long. Clear the conversation or shorten your code.'
                    ),
                    {
                        status: 413,
                        code: 'TUTOR_INPUT_TOO_LONG'
                    }
                );
            }
            const stream = await sdk.responses.create(
                {
                    ...parameters,
                    max_output_tokens: config.maxOutput,
                    store: false,
                    stream: true,
                    tools: []
                },
                { signal: abort }
            );
            let completed = false;
            let length = 0;
            for await (const event of stream) {
                if (
                    event.type === 'response.output_text.delta' &&
                    typeof event.delta === 'string'
                ) {
                    length += event.delta.length;
                    if (length > 16000) throw new Error('Output limit');
                    yield event.delta;
                } else if (event.type === 'response.completed') completed = true;
                else if (['error', 'response.failed', 'response.incomplete'].includes(event.type)) {
                    throw new Error('Incomplete provider response');
                }
            }
            if (!completed || !length) throw new Error('Missing complete response');
        } catch (error) {
            throw tutorProviderError(error);
        }
    };
}
