import { describe, expect, it, vi } from 'vitest';
import { createTutorChat } from './tutorChat.js';
import { readTutorEvents } from './tutorApi.js';
import { appendTutorNote } from './tutorNotes.js';

const snapshot = { messages: [], enabled: true, limits: { daily: 30, remaining: 30 } };
const request = { message: 'Why?', requestId: 'example-request' };
function mockApi() {
    return {
        get: vi.fn().mockResolvedValue(snapshot),
        clear: vi.fn().mockResolvedValue({ messages: [], conversation: null }),
        send: vi.fn(async (_module, _section, _body, _signal, event) => {
            event({ type: 'delta', text: 'A hint' });
            event({
                type: 'done',
                messages: [{ id: 'saved', role: 'assistant', content: 'A hint' }]
            });
        })
    };
}

describe('tutor chat state and transport', () => {
    it('loads saved history, defaults to no notes, and commits completed exchanges', async () => {
        const api = mockApi();
        const chat = createTutorChat(1, 'section-a', api);
        await chat.load();
        expect(await chat.send(request)).toBe(true);
        expect(api.send.mock.calls[0][2].includeNotes).toBe(false);
        expect(chat.getSnapshot().messages[0].content).toBe('A hint');
        expect(chat.getSnapshot().partial).toBe('');
        await chat.clear();
        expect(chat.getSnapshot().messages).toEqual([]);
    });
    it('retains a failed partial response but never adds it to saved history', async () => {
        const api = mockApi();
        api.send.mockImplementation(async (_m, _s, _body, _signal, event) => {
            event({ type: 'delta', text: 'unfinished' });
            throw new Error('Provider unavailable');
        });
        const chat = createTutorChat(1, 'a', api);
        await chat.load();
        expect(await chat.send(request)).toBe(false);
        expect(chat.getSnapshot().messages).toEqual([]);
        expect(chat.getSnapshot().partial).toBe('unfinished');
        expect(chat.getSnapshot().error).toBe('Provider unavailable');
    });
    it('prevents duplicate sends and aborts old context without leaking its response', async () => {
        const api = mockApi();
        let finish;
        let signal;
        api.send.mockImplementation(async (_m, _s, _b, received, event) => {
            signal = received;
            await new Promise((resolve) => {
                finish = resolve;
            });
            event({ type: 'done', messages: [{ content: 'old section' }] });
        });
        const old = createTutorChat(1, 'a', api);
        await old.load();
        const pending = old.send(request);
        expect(await old.send(request)).toBe(false);
        old.dispose();
        finish();
        await pending;
        expect(signal.aborted).toBe(true);
        expect(old.getSnapshot().messages).toEqual([]);
        expect(createTutorChat(1, 'b', api).getSnapshot().messages).toEqual([]);
    });
    it('parses fragmented SSE, including CRLF boundaries, and rejects truncated responses', async () => {
        const encoder = new TextEncoder();
        const body =
            'data: {"type":"delta","text":"hello"}\r\n\r\ndata: {"type":"done","messages":[]}\r\n\r\n';
        const response = new Response(
            new ReadableStream({
                start(controller) {
                    for (const char of body) controller.enqueue(encoder.encode(char));
                    controller.close();
                }
            })
        );
        const events = [];
        await readTutorEvents(response, (event) => events.push(event));
        expect(events.map((event) => event.type)).toEqual(['delta', 'done']);
        const savedHistory = Array.from({ length: 20 }, (_, index) => ({
            id: String(index),
            role: 'assistant',
            content: 'x'.repeat(16000)
        }));
        await expect(
            readTutorEvents(
                new Response(
                    `data: ${JSON.stringify({
                        type: 'done',
                        messages: savedHistory
                    })}\n\n`
                ),
                () => {}
            )
        ).resolves.toBeUndefined();
        await expect(
            readTutorEvents(new Response('data: {"type":"delta","text":"partial"}\n\n'), () => {})
        ).rejects.toThrow('interrupted');
        await expect(
            readTutorEvents(
                new Response('data: {"type":"error","message":"Try later"}\n\n'),
                () => {}
            )
        ).rejects.toThrow('Try later');
    });
});

describe('explicit note append', () => {
    it('preserves existing notes and unsaved edits instead of replacing them', async () => {
        let state = { loaded: true, content: 'My draft', dirty: true };
        const note = {
            getSnapshot: () => state,
            edit: (content) => {
                state = { ...state, content };
            },
            save: async () => {
                state.dirty = false;
            }
        };
        expect(await appendTutorNote(note, 'AI definition')).toContain('Appended');
        expect(state.content).toMatch(/^My draft\n\nAI-generated/);
        expect(state.content).toContain('AI definition');
    });
    it('refuses conflicted or oversized notes', async () => {
        const edit = vi.fn();
        await expect(
            appendTutorNote({ getSnapshot: () => ({ loaded: true, conflict: true }), edit }, 'text')
        ).rejects.toThrow('resolve');
        await expect(
            appendTutorNote(
                { getSnapshot: () => ({ loaded: true, content: 'x'.repeat(20000) }), edit },
                'text'
            )
        ).rejects.toThrow('limit');
        expect(edit).not.toHaveBeenCalled();
    });
});
