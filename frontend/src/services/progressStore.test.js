import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './authApi.js';
import { clearProgress, readProgress, loadProgressFromApi, toggleCheckpoint, subscribeToProgress } from './progressStore.js';

vi.mock('./authApi.js', () => ({ apiRequest: vi.fn() }));
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

beforeEach(() => {
    vi.stubGlobal('window', new EventTarget());
    apiRequest.mockReset();
    clearProgress();
});
afterEach(() => vi.unstubAllGlobals());

describe('persisted lesson checkpoints', () => {
    it('refreshes mastery after a save even when an older refresh is still pending', async () => {
        apiRequest.mockResolvedValueOnce({ completedWeeks: [], completedCheckpoints: [] });
        await loadProgressFromApi();
        const stale = deferred();
        apiRequest.mockReturnValueOnce(stale.promise);
        const oldRequest = loadProgressFromApi();
        apiRequest.mockResolvedValueOnce({}).mockResolvedValueOnce({ completedWeeks: [1], completedCheckpoints: ['w1-0'] });
        toggleCheckpoint('w1-0');
        await settle();
        expect(readProgress().completedWeeks).toEqual([1]);
        stale.resolve({ completedWeeks: [], completedCheckpoints: [] });
        await oldRequest;
        expect(readProgress().completedCheckpoints).toEqual(['w1-0']);
    });
    it('blocks writes before saved progress arrives and deduplicates concurrent loads', async () => {
        const pending = deferred();
        apiRequest.mockReturnValue(pending.promise);
        toggleCheckpoint('w1-explain');
        expect(apiRequest).not.toHaveBeenCalled();
        const first = loadProgressFromApi();
        const second = loadProgressFromApi();
        expect(apiRequest).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
        pending.resolve({ completedWeeks: [1], completedCheckpoints: ['w1-0', 'w1-explain'] });
        await Promise.all([first, second]);
        expect(readProgress()).toMatchObject({ ready: true, completedWeeks: [1], completedCheckpoints: ['w1-0', 'w1-explain'] });
    });

    it('PATCHes one stable ID, serializes writes and preserves unrelated mastery and chapter IDs', async () => {
        apiRequest.mockResolvedValueOnce({ completedWeeks: [2], completedCheckpoints: ['w2-0', 'w2-other'] });
        await loadProgressFromApi();
        const save = deferred();
        apiRequest.mockReturnValueOnce(save.promise).mockResolvedValueOnce({ completedWeeks: [2], completedCheckpoints: ['w2-0', 'w2-other', 'w1-explain'] });
        const result = toggleCheckpoint('w1-explain');
        expect(result).toBe(readProgress());
        expect(result).not.toBeInstanceOf(Promise);
        expect(readProgress().saving).toBe(true);
        expect(await loadProgressFromApi()).toBe(result);
        expect(readProgress().completedCheckpoints).toEqual(['w2-0', 'w2-other']);
        toggleCheckpoint('w1-second');
        expect(apiRequest).toHaveBeenCalledTimes(2);
        expect(apiRequest).toHaveBeenLastCalledWith('/api/progress/lessons/w1-explain', { method: 'PATCH', body: JSON.stringify({ completed: true }) });
        save.resolve({});
        await settle();
        expect(readProgress()).toMatchObject({ saving: false, completedWeeks: [2], completedCheckpoints: ['w2-0', 'w2-other', 'w1-explain'] });
        apiRequest.mockResolvedValueOnce({}).mockResolvedValueOnce({ completedWeeks: [2], completedCheckpoints: ['w2-0', 'w2-other'] });
        toggleCheckpoint('w1-explain');
        expect(apiRequest).toHaveBeenLastCalledWith('/api/progress/lessons/w1-explain', { method: 'PATCH', body: JSON.stringify({ completed: false }) });
        await settle();
        expect(readProgress().completedCheckpoints).toEqual(['w2-0', 'w2-other']);
    });

    it('shows load failures without enabling unsynchronized edits, and permits retry', async () => {
        apiRequest.mockRejectedValueOnce(new Error('Offline'));
        await loadProgressFromApi();
        expect(readProgress()).toMatchObject({ ready: false, saving: false });
        expect(readProgress().error).toContain('Offline');
        toggleCheckpoint('w1-explain');
        expect(apiRequest).toHaveBeenCalledTimes(1);
        apiRequest.mockResolvedValueOnce({ completedWeeks: [], completedCheckpoints: ['w1-saved'] });
        await loadProgressFromApi();
        expect(readProgress()).toMatchObject({ ready: true, error: '', completedCheckpoints: ['w1-saved'] });
    });

    it('keeps saved progress unchanged on failed writes and surfaces a retryable error', async () => {
        apiRequest.mockResolvedValueOnce({ completedWeeks: [], completedCheckpoints: ['w1-saved'] });
        await loadProgressFromApi();
        apiRequest.mockRejectedValueOnce(new Error('Save unavailable'));
        toggleCheckpoint('w1-new');
        await settle();
        expect(readProgress()).toMatchObject({ saving: false, completedCheckpoints: ['w1-saved'] });
        expect(readProgress().error).toContain('Save unavailable');
    });

    it('ignores stale load responses after clearing the account cache', async () => {
        const old = deferred();
        apiRequest.mockReturnValueOnce(old.promise);
        const request = loadProgressFromApi();
        clearProgress();
        old.resolve({ completedWeeks: [16], completedCheckpoints: ['w16-private'] });
        await request;
        expect(readProgress()).toMatchObject({ ready: false, completedWeeks: [], completedCheckpoints: [] });
    });

    it('ignores stale write responses after logout and supports listener cleanup', async () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToProgress(listener);
        apiRequest.mockResolvedValueOnce({ completedWeeks: [], completedCheckpoints: [] });
        await loadProgressFromApi();
        const save = deferred();
        apiRequest.mockReturnValueOnce(save.promise);
        toggleCheckpoint('w1-private');
        clearProgress();
        unsubscribe();
        const events = listener.mock.calls.length;
        save.resolve({});
        await settle();
        expect(readProgress()).toMatchObject({ ready: false, saving: false, completedCheckpoints: [] });
        expect(listener).toHaveBeenCalledTimes(events);
        expect(apiRequest).toHaveBeenCalledTimes(2);
    });
});
