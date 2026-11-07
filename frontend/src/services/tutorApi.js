import { apiRequest, apiStreamRequest } from './authApi.js';

const path = (moduleId, sectionId) => `/api/tutor/${moduleId}/${encodeURIComponent(sectionId)}`;

export async function readTutorEvents(response, onEvent) {
    if (!response.body) throw new Error('Streaming is not available. Please try again.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;
    const consume = (frame) => {
        const data = frame
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n');
        if (!data) return;
        const event = JSON.parse(data);
        if (!['delta', 'done', 'error'].includes(event.type)) return;
        if (event.type === 'delta' && typeof event.text !== 'string')
            throw new Error('Invalid tutor stream.');
        if (event.type === 'error')
            throw new Error(event.message || 'The tutor response was interrupted.');
        onEvent(event);
        if (event.type === 'done') completed = true;
    };
    try {
        while (true) {
            const { done, value } = await reader.read();
            buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, '\n');
            // The final event includes bounded saved history, not just a delta.
            if (buffer.length > 2000000) throw new Error('The tutor response exceeded its limit.');
            let boundary;
            while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                consume(buffer.slice(0, boundary));
                buffer = buffer.slice(boundary + 2);
            }
            if (done) break;
        }
        if (buffer.trim()) consume(buffer);
        if (!completed)
            throw new Error('Response interrupted. Reload history to check what was saved.');
    } finally {
        try {
            await reader.cancel();
        } catch {
            /* The network may already be closed. */
        }
        reader.releaseLock();
    }
}

export const tutorApi = {
    get: (moduleId, sectionId) => apiRequest(path(moduleId, sectionId), { cache: 'no-store' }),
    clear: (moduleId, sectionId) => apiRequest(path(moduleId, sectionId), { method: 'DELETE' }),
    send: async (moduleId, sectionId, body, signal, onEvent) => {
        const response = await apiStreamRequest(path(moduleId, sectionId), body, signal);
        await readTutorEvents(response, onEvent);
    }
};
