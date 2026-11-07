import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './authApi.js';
import {
    clearProgress,
    readProgress,
    loadProgressFromApi,
    toggleCheckpoint,
    completeLesson,
    reopenLesson,
    markLessonStarted,
    subscribeToProgress
} from './progressStore.js';

vi.mock('./authApi.js', () => ({ apiRequest: vi.fn() }));
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
};
const settle = async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
};

beforeEach(() => {
    vi.stubGlobal('window', new EventTarget());
    apiRequest.mockReset();
    clearProgress();
});
afterEach(() => vi.unstubAllGlobals());

describe('persisted lesson checkpoints', () => {
    it('reopens a lesson only after saving and preserves other completed lessons', async () => {
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [1],
            completedCheckpoints: ['lesson', 'other'],
            startedLessons: []
        });
        await loadProgressFromApi();
        const pending = deferred();
        apiRequest.mockReturnValueOnce(pending.promise);
        reopenLesson('lesson');
        reopenLesson('lesson');
        expect(apiRequest).toHaveBeenCalledTimes(2);
        expect(apiRequest).toHaveBeenLastCalledWith('/api/progress/lessons/lesson', {
            method: 'PATCH',
            body: JSON.stringify({ completed: false })
        });
        expect(readProgress().completedCheckpoints).toEqual(['lesson', 'other']);
        pending.resolve({
            completedWeeks: [],
            completedCheckpoints: ['other'],
            startedLessons: ['lesson']
        });
        await settle();
        expect(readProgress()).toMatchObject({
            completedWeeks: [],
            completedCheckpoints: ['other'],
            startedLessons: ['lesson'],
            saving: false
        });
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [],
            completedCheckpoints: ['other'],
            startedLessons: ['lesson']
        });
        await loadProgressFromApi();
        expect(readProgress().completedCheckpoints).toEqual(['other']);
    });

    it('keeps completion intact and reports a failed undo', async () => {
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [1],
            completedCheckpoints: ['lesson'],
            startedLessons: []
        });
        await loadProgressFromApi();
        apiRequest.mockRejectedValueOnce(new Error('private database error'));
        reopenLesson('lesson');
        await settle();
        expect(readProgress().completedCheckpoints).toEqual(['lesson']);
        expect(readProgress().completedWeeks).toEqual([1]);
        expect(readProgress().error).toContain('could not be saved');
        expect(readProgress().error).not.toContain('database');
    });

    it('applies the committed server snapshot and never repeats an explicit completion', async () => {
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [],
            completedCheckpoints: ['existing']
        });
        await loadProgressFromApi();
        const save = deferred();
        apiRequest.mockReturnValueOnce(save.promise);
        completeLesson('stable-id');
        completeLesson('stable-id');
        expect(readProgress().completedCheckpoints).toEqual(['existing']);
        expect(readProgress().pendingId).toBe('stable-id');
        expect(apiRequest).toHaveBeenCalledTimes(2);
        save.resolve({
            completedWeeks: [1],
            completedCheckpoints: ['existing', 'stable-id'],
            startedLessons: []
        });
        await settle();
        expect(readProgress()).toMatchObject({
            completedWeeks: [1],
            completedCheckpoints: ['existing', 'stable-id'],
            saving: false,
            pendingId: null
        });
        completeLesson('stable-id');
        expect(apiRequest).toHaveBeenCalledTimes(2);
    });
    it('reload shows loading, deduplicates requests and clears an old save error', async () => {
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: ['existing'] });
        await loadProgressFromApi();
        apiRequest.mockRejectedValueOnce(new Error('private SQL details'));
        completeLesson('new');
        await settle();
        expect(readProgress().error).not.toContain('SQL');
        const pending = deferred();
        apiRequest.mockReturnValueOnce(pending.promise);
        const request = loadProgressFromApi();
        expect(loadProgressFromApi()).toBe(request);
        expect(readProgress().reloading).toBe(true);
        expect(readProgress().completedCheckpoints).toEqual(['existing']);
        pending.resolve({
            completedCheckpoints: ['existing', 'saved-in-another-tab'],
            completedWeeks: [],
            startedLessons: []
        });
        await request;
        expect(readProgress()).toMatchObject({
            reloading: false,
            error: '',
            completedCheckpoints: ['existing', 'saved-in-another-tab']
        });
        expect(apiRequest).toHaveBeenLastCalledWith('/api/progress', { cache: 'no-store' });
    });
    it('reload cannot discard a pending completion request', async () => {
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: [] });
        await loadProgressFromApi();
        const save = deferred();
        apiRequest.mockReturnValueOnce(save.promise);
        completeLesson('new');
        await loadProgressFromApi();
        expect(apiRequest).toHaveBeenCalledTimes(2);
        expect(readProgress().saving).toBe(true);
        save.resolve({ completedCheckpoints: ['new'], completedWeeks: [], startedLessons: [] });
        await settle();
        expect(readProgress().completedCheckpoints).toEqual(['new']);
    });
    it('handles expired sessions on save and reload and blocks further edits', async () => {
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: ['saved'] });
        await loadProgressFromApi();
        apiRequest.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }));
        completeLesson('new');
        await settle();
        expect(readProgress()).toMatchObject({ sessionExpired: true, ready: false });
        expect(readProgress().error).toBe('Your session has expired. Please sign in again.');
        const calls = apiRequest.mock.calls.length;
        completeLesson('new');
        expect(apiRequest).toHaveBeenCalledTimes(calls);
        apiRequest.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }));
        await loadProgressFromApi();
        expect(readProgress().reloading).toBe(false);
        expect(readProgress().sessionExpired).toBe(true);
    });
    it('restores persisted completion after logout/login without leaking the previous account', async () => {
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: ['account-a'] });
        await loadProgressFromApi();
        clearProgress();
        expect(readProgress().completedCheckpoints).toEqual([]);
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: ['account-b'] });
        await loadProgressFromApi();
        expect(readProgress().completedCheckpoints).toEqual(['account-b']);
        clearProgress();
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: ['account-a'] });
        await loadProgressFromApi();
        expect(readProgress().completedCheckpoints).toEqual(['account-a']);
    });
    it('persists started sections without completing them and restores them on refresh', async () => {
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: [], startedLessons: [] });
        await loadProgressFromApi();
        apiRequest.mockResolvedValueOnce({}).mockResolvedValueOnce({
            startedLessons: ['w1-section-core-theory'],
            completedCheckpoints: []
        });
        await markLessonStarted('w1-section-core-theory');
        await settle();
        expect(apiRequest).toHaveBeenCalledWith('/api/progress/lessons/w1-section-core-theory', {
            method: 'PATCH',
            body: JSON.stringify({ completed: false, startedOnly: true })
        });
        expect(readProgress().startedLessons).toEqual(['w1-section-core-theory']);
        expect(readProgress().completedCheckpoints).toEqual([]);
        const calls = apiRequest.mock.calls.length;
        await markLessonStarted('w1-section-core-theory');
        expect(apiRequest).toHaveBeenCalledTimes(calls);
        clearProgress();
        apiRequest.mockResolvedValueOnce({
            startedLessons: ['w1-section-core-theory'],
            completedCheckpoints: []
        });
        await loadProgressFromApi();
        expect(readProgress().startedLessons).toEqual(['w1-section-core-theory']);
    });
    it('does not overwrite completed lessons with started progress', async () => {
        apiRequest.mockResolvedValueOnce({ completedCheckpoints: ['done'], startedLessons: [] });
        await loadProgressFromApi();
        const calls = apiRequest.mock.calls.length;
        await markLessonStarted('done');
        expect(apiRequest).toHaveBeenCalledTimes(calls);
    });
    it('refreshes mastery after a save even when an older refresh is still pending', async () => {
        apiRequest.mockResolvedValueOnce({ completedWeeks: [], completedCheckpoints: [] });
        await loadProgressFromApi();
        const stale = deferred();
        apiRequest.mockReturnValueOnce(stale.promise);
        const oldRequest = loadProgressFromApi();
        apiRequest
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ completedWeeks: [1], completedCheckpoints: ['w1-0'] });
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
        expect(readProgress()).toMatchObject({
            ready: true,
            completedWeeks: [1],
            completedCheckpoints: ['w1-0', 'w1-explain']
        });
    });

    it('PATCHes one stable ID, serializes writes and preserves unrelated mastery and chapter IDs', async () => {
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [2],
            completedCheckpoints: ['w2-0', 'w2-other']
        });
        await loadProgressFromApi();
        const save = deferred();
        apiRequest.mockReturnValueOnce(save.promise).mockResolvedValueOnce({
            completedWeeks: [2],
            completedCheckpoints: ['w2-0', 'w2-other', 'w1-explain']
        });
        const result = toggleCheckpoint('w1-explain');
        expect(result).toBe(readProgress());
        expect(result).not.toBeInstanceOf(Promise);
        expect(readProgress().saving).toBe(true);
        expect(await loadProgressFromApi()).toBe(result);
        expect(readProgress().completedCheckpoints).toEqual(['w2-0', 'w2-other']);
        toggleCheckpoint('w1-second');
        expect(apiRequest).toHaveBeenCalledTimes(2);
        expect(apiRequest).toHaveBeenLastCalledWith('/api/progress/lessons/w1-explain', {
            method: 'PATCH',
            body: JSON.stringify({ completed: true })
        });
        save.resolve({});
        await settle();
        expect(readProgress()).toMatchObject({
            saving: false,
            completedWeeks: [2],
            completedCheckpoints: ['w2-0', 'w2-other', 'w1-explain']
        });
        apiRequest.mockResolvedValueOnce({}).mockResolvedValueOnce({
            completedWeeks: [2],
            completedCheckpoints: ['w2-0', 'w2-other']
        });
        toggleCheckpoint('w1-explain');
        expect(apiRequest).toHaveBeenLastCalledWith('/api/progress/lessons/w1-explain', {
            method: 'PATCH',
            body: JSON.stringify({ completed: false })
        });
        await settle();
        expect(readProgress().completedCheckpoints).toEqual(['w2-0', 'w2-other']);
    });

    it('shows load failures without enabling unsynchronized edits, and permits retry', async () => {
        apiRequest.mockRejectedValueOnce(new Error('Offline'));
        await loadProgressFromApi();
        expect(readProgress()).toMatchObject({ ready: false, saving: false });
        expect(readProgress().error).toContain('Check your connection');
        toggleCheckpoint('w1-explain');
        expect(apiRequest).toHaveBeenCalledTimes(1);
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [],
            completedCheckpoints: ['w1-saved']
        });
        await loadProgressFromApi();
        expect(readProgress()).toMatchObject({
            ready: true,
            error: '',
            completedCheckpoints: ['w1-saved']
        });
    });

    it('keeps saved progress unchanged on failed writes and surfaces a retryable error', async () => {
        apiRequest.mockResolvedValueOnce({
            completedWeeks: [],
            completedCheckpoints: ['w1-saved']
        });
        await loadProgressFromApi();
        apiRequest.mockRejectedValueOnce(new Error('Save unavailable'));
        toggleCheckpoint('w1-new');
        await settle();
        expect(readProgress()).toMatchObject({ saving: false, completedCheckpoints: ['w1-saved'] });
        expect(readProgress().error).toBe('Your progress could not be saved. Please try again.');
    });

    it('ignores stale load responses after clearing the account cache', async () => {
        const old = deferred();
        apiRequest.mockReturnValueOnce(old.promise);
        const request = loadProgressFromApi();
        clearProgress();
        old.resolve({ completedWeeks: [16], completedCheckpoints: ['w16-private'] });
        await request;
        expect(readProgress()).toMatchObject({
            ready: false,
            completedWeeks: [],
            completedCheckpoints: []
        });
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
        expect(readProgress()).toMatchObject({
            ready: false,
            saving: false,
            completedCheckpoints: []
        });
        expect(listener).toHaveBeenCalledTimes(events);
        expect(apiRequest).toHaveBeenCalledTimes(2);
    });
});
