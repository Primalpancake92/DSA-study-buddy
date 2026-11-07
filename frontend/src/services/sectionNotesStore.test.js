import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearSectionNotes,
    createSectionNote,
    getSectionNote,
    hasUnsavedSectionNotes,
    maxNoteLength
} from './sectionNotesStore.js';

const empty = { content: '', version: 0, exists: false };
const saved = (content, version) => ({ note: { content, version, exists: true } });
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
};
let controllers;
function setup(options = {}) {
    const api = {
        get: vi.fn().mockResolvedValue({ note: empty }),
        put: vi
            .fn()
            .mockImplementation(async (_module, _section, content, version) =>
                saved(content, version + 1)
            ),
        remove: vi.fn().mockImplementation(async (_module, _section, version) => ({
            note: { content: '', exists: false, version: version + 1 }
        }))
    };
    const persist = vi.fn();
    const controller = createSectionNote({
        moduleId: 1,
        sectionId: 'stable',
        api,
        persist,
        ...options
    });
    controllers.push(controller);
    return { controller, api, persist };
}

beforeEach(() => {
    vi.useFakeTimers();
    controllers = [];
});
afterEach(() => {
    for (const controller of controllers) controller.dispose();
    clearSectionNotes();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('section notes autosave', () => {
    it('debounces edits for one second and saves only the latest text', async () => {
        const { controller, api } = setup();
        await controller.load();
        controller.edit('first');
        await vi.advanceTimersByTimeAsync(700);
        controller.edit('latest');
        await vi.advanceTimersByTimeAsync(999);
        expect(api.put).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(api.put).toHaveBeenCalledTimes(1);
        expect(api.put).toHaveBeenCalledWith(1, 'stable', 'latest', 0);
        expect(controller.getSnapshot()).toMatchObject({
            content: 'latest',
            dirty: false,
            version: 1
        });
    });

    it('serializes requests and never replaces newer typing with an old response', async () => {
        const { controller, api } = setup();
        await controller.load();
        const pending = deferred();
        api.put.mockReturnValueOnce(pending.promise);
        controller.edit('old');
        const request = controller.save();
        await Promise.resolve();
        controller.edit('new');
        await vi.advanceTimersByTimeAsync(1000);
        expect(api.put).toHaveBeenCalledTimes(1);
        pending.resolve(saved('old', 1));
        await request;
        expect(controller.getSnapshot()).toMatchObject({
            content: 'new',
            savedContent: 'old',
            dirty: true
        });
        await vi.advanceTimersByTimeAsync(1000);
        expect(api.put).toHaveBeenLastCalledWith(1, 'stable', 'new', 1);
        expect(controller.getSnapshot()).toMatchObject({
            content: 'new',
            version: 2,
            dirty: false
        });
    });

    it('keeps failed drafts and offers a retry without changing progress', async () => {
        const { controller, api, persist } = setup();
        await controller.load();
        api.put.mockRejectedValueOnce(new Error('private network details'));
        controller.edit('Keep this explanation');
        await controller.save();
        expect(controller.getSnapshot()).toMatchObject({
            dirty: true,
            saving: false,
            content: 'Keep this explanation'
        });
        expect(controller.getSnapshot().error).not.toContain('private');
        expect(persist).toHaveBeenLastCalledWith({ content: 'Keep this explanation', version: 0 });
        await controller.retry();
        expect(controller.getSnapshot()).toMatchObject({ dirty: false, error: '' });
        expect(persist).toHaveBeenLastCalledWith(null);
    });

    it('preserves drafts after a failed initial load and recovers on retry', async () => {
        const { controller, api } = setup({ draft: { content: 'recovery text', version: 3 } });
        api.get.mockRejectedValueOnce(new Error('offline'));
        await controller.load();
        expect(controller.getSnapshot()).toMatchObject({
            content: 'recovery text',
            version: 3,
            loaded: false
        });
        api.get.mockResolvedValueOnce(saved('old text', 3));
        await controller.retry();
        await vi.advanceTimersByTimeAsync(1000);
        expect(api.put).toHaveBeenLastCalledWith(1, 'stable', 'recovery text', 3);
    });

    it('requires explicit resolution when a recovered draft has a stale version', async () => {
        const { controller, api, persist } = setup({ draft: { content: 'my draft', version: 1 } });
        api.get.mockResolvedValue(saved('another tab', 2));
        await controller.load();
        await vi.advanceTimersByTimeAsync(2000);
        expect(controller.getSnapshot()).toMatchObject({
            content: 'my draft',
            conflict: true,
            dirty: true
        });
        expect(api.put).not.toHaveBeenCalled();
        expect(persist).toHaveBeenLastCalledWith({ content: 'my draft', version: 1 });
        await controller.retry();
        expect(api.put).not.toHaveBeenCalled();
        await controller.resolveConflict(true);
        expect(api.put).toHaveBeenLastCalledWith(1, 'stable', 'my draft', 2);
        expect(controller.getSnapshot()).toMatchObject({ conflict: false, dirty: false });
    });

    it('keeps conflicting edits until the learner explicitly loads the server version', async () => {
        const { controller, api } = setup();
        await controller.load();
        api.put.mockRejectedValueOnce({ status: 409 });
        controller.edit('my edit');
        await controller.save();
        expect(controller.getSnapshot()).toMatchObject({ conflict: true, content: 'my edit' });
        api.get.mockResolvedValueOnce(saved('remote', 5));
        await controller.resolveConflict(false);
        expect(controller.getSnapshot()).toMatchObject({
            content: 'remote',
            version: 5,
            conflict: false,
            dirty: false
        });
    });

    it('deletes with the current version and cannot resurrect an old pending draft', async () => {
        const { controller, api } = setup();
        api.get.mockResolvedValueOnce(saved('saved', 4));
        await controller.load();
        controller.edit('unsaved');
        await controller.remove();
        await vi.advanceTimersByTimeAsync(2000);
        expect(api.remove).toHaveBeenCalledWith(1, 'stable', 4);
        expect(api.put).not.toHaveBeenCalled();
        expect(controller.getSnapshot()).toMatchObject({
            content: '',
            version: 5,
            exists: false,
            dirty: false
        });
        controller.edit('new note');
        await controller.save();
        expect(api.put).toHaveBeenLastCalledWith(1, 'stable', 'new note', 5);
    });

    it('retains input if deletion fails', async () => {
        const { controller, api } = setup();
        api.get.mockResolvedValueOnce(saved('important', 1));
        await controller.load();
        api.remove.mockRejectedValueOnce(new Error('offline'));
        await controller.remove();
        expect(controller.getSnapshot()).toMatchObject({
            content: 'important',
            exists: true,
            deleting: false
        });
        expect(controller.getSnapshot().error).toBeTruthy();
    });

    it('does not let a late response revive state after logout disposal', async () => {
        const { controller, api } = setup();
        await controller.load();
        const pending = deferred();
        api.put.mockReturnValueOnce(pending.promise);
        controller.edit('private');
        const save = controller.save();
        await Promise.resolve();
        controller.dispose();
        const state = controller.getSnapshot();
        pending.resolve(saved('private', 1));
        await save;
        expect(controller.getSnapshot()).toBe(state);
        await vi.advanceTimersByTimeAsync(2000);
        expect(api.put).toHaveBeenCalledTimes(1);
    });

    it('keeps notes independent by owner, module and stable section key', () => {
        const first = getSectionNote('alice', 1, 'one', 'anchor');
        const second = getSectionNote('alice', 1, 'two', 'anchor');
        const otherUser = getSectionNote('bob', 1, 'one', 'anchor');
        const otherModule = getSectionNote('alice', 2, 'one', 'anchor');
        first.edit('only in first');
        expect(second.getSnapshot().content).toBe('');
        expect(otherUser.getSnapshot().content).toBe('');
        expect(otherModule.getSnapshot().content).toBe('');
        expect(getSectionNote('alice', 1, 'one', 'anchor')).toBe(first);
        expect(hasUnsavedSectionNotes()).toBe(true);
        clearSectionNotes();
        expect(hasUnsavedSectionNotes()).toBe(false);
    });

    it('rejects oversized edits without erasing the current text', async () => {
        const { controller } = setup();
        await controller.load();
        controller.edit('keep');
        controller.edit('x'.repeat(maxNoteLength + 1));
        expect(controller.getSnapshot().content).toBe('keep');
    });

    it('restores owner-scoped recovery drafts and clears them on logout', () => {
        const storage = {};
        Object.defineProperties(storage, {
            getItem: { value: (key) => storage[key] || null },
            setItem: {
                value: (key, value) => {
                    storage[key] = value;
                }
            },
            removeItem: {
                value: (key) => {
                    delete storage[key];
                }
            }
        });
        storage['dsa-section-draft:alice:1:one'] = JSON.stringify({
            content: 'recover me',
            version: 3
        });
        storage['unrelated-preference'] = 'keep';
        vi.stubGlobal('window', { sessionStorage: storage });
        expect(getSectionNote('alice', 1, 'one', 'anchor').getSnapshot()).toMatchObject({
            content: 'recover me',
            version: 3,
            dirty: true
        });
        expect(getSectionNote('bob', 1, 'one', 'anchor').getSnapshot().content).toBe('');
        clearSectionNotes();
        expect(storage['dsa-section-draft:alice:1:one']).toBeUndefined();
        expect(storage['unrelated-preference']).toBe('keep');
    });

    it('continues saving when recovery storage is unavailable', async () => {
        const { controller } = setup({
            persist: () => {
                throw new Error('Storage blocked');
            }
        });
        await controller.load();
        controller.edit('still save');
        expect(controller.getSnapshot().recoveryAvailable).toBe(false);
        await controller.save();
        expect(controller.getSnapshot().dirty).toBe(false);
    });
});
