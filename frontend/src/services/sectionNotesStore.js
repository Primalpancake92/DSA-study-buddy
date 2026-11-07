import { sectionNotesApi } from './sectionNotesApi.js';

export const maxNoteLength = 20000;
const entries = new Map();
const listeners = new Set();
let notice = null;
const draftPrefix = 'dsa-section-draft:';

function message(error) {
    if (error.status === 401) return 'Your session has expired. Sign in again to save your notes.';
    if (error.status === 409)
        return 'This note changed in another tab. Choose which version to keep.';
    return 'Unable to save or load this note. Your draft is still here. Please retry.';
}

// One controller per owner and stable section key survives SPA navigation.
// It serializes writes; server versions also protect against competing tabs.
export function createSectionNote({ moduleId, sectionId, api = sectionNotesApi, draft, persist }) {
    let active = true;
    let timer;
    let request;
    const subscribers = new Set();
    let state = {
        content: draft?.content || '',
        savedContent: '',
        version: draft?.version || 0,
        loaded: false,
        loading: false,
        saving: false,
        deleting: false,
        dirty: Boolean(draft),
        exists: false,
        error: '',
        conflict: false,
        recoveryAvailable: true
    };
    const publish = (patch) => {
        if (!active) return;
        state = { ...state, ...patch };
        if (persist) {
            try {
                persist(state.dirty ? { content: state.content, version: state.version } : null);
            } catch {
                state = { ...state, recoveryAvailable: false };
            }
        }
        for (const callback of subscribers) callback();
    };
    const schedule = () => {
        clearTimeout(timer);
        if (active && state.dirty && state.loaded && !state.conflict && !state.error) {
            timer = setTimeout(() => void save(), 1000);
        }
    };

    async function load() {
        if (state.loading || state.saving || !active) return;
        publish({ loading: true, error: '' });
        try {
            const { note } = await api.get(moduleId, sectionId);
            if (!active) return;
            const recovered = !state.loaded && draft;
            const conflict = Boolean(recovered && draft.version !== note.version);
            const content = recovered ? state.content : note.content;
            publish({
                ...note,
                content,
                // Keep a conflicting recovery draft's original base version.
                // Otherwise a refresh could silently turn it into a valid write.
                version: conflict ? draft.version : note.version,
                savedContent: note.content,
                loaded: true,
                dirty: content !== note.content,
                conflict,
                error: conflict ? message({ status: 409 }) : ''
            });
            draft = null;
            schedule();
        } catch (error) {
            publish({ error: message(error) });
        } finally {
            publish({ loading: false });
        }
    }

    async function save() {
        clearTimeout(timer);
        if (request) return request;
        if (!active || !state.loaded || !state.dirty || state.conflict || state.deleting) return;
        const content = state.content;
        const version = state.version;
        publish({ saving: true, error: '' });
        async function write() {
            await Promise.resolve();
            try {
                const { note } = await api.put(moduleId, sectionId, content, version);
                if (!active) return;
                publish({
                    version: note.version,
                    exists: note.exists,
                    updatedAt: note.updatedAt,
                    savedContent: content,
                    dirty: state.content !== content
                });
            } catch (error) {
                publish({ error: message(error), conflict: error.status === 409 });
            } finally {
                request = undefined;
                publish({ saving: false });
                schedule();
            }
        }
        request = write();
        return request;
    }

    async function remove() {
        if (state.saving || state.loading || state.deleting || !state.loaded) return;
        clearTimeout(timer);
        publish({ deleting: true, error: '' });
        try {
            const { note } = await api.remove(moduleId, sectionId, state.version);
            publish({ ...note, content: '', savedContent: '', dirty: false, conflict: false });
        } catch (error) {
            publish({ error: message(error), conflict: error.status === 409 });
        } finally {
            publish({ deleting: false });
        }
    }

    async function resolveConflict(keepDraft) {
        if (state.saving || state.loading || state.deleting) return;
        publish({ loading: true });
        try {
            const { note } = await api.get(moduleId, sectionId);
            if (!active) return;
            const content = keepDraft ? state.content : note.content;
            publish({
                ...note,
                content,
                savedContent: note.content,
                loaded: true,
                loading: false,
                dirty: content !== note.content,
                conflict: false,
                error: ''
            });
            if (keepDraft) await save();
        } catch (error) {
            publish({ error: message(error) });
        } finally {
            publish({ loading: false });
        }
    }

    return {
        getSnapshot: () => state,
        subscribe: (callback) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },
        load,
        save,
        remove,
        resolveConflict,
        retry: async () => {
            if (!state.loaded) await load();
            else if (!state.conflict) await save();
        },
        edit: (content) => {
            if (!active || state.deleting || state.loading || content.length > maxNoteLength)
                return;
            publish({
                content,
                dirty: content !== state.savedContent,
                error: state.conflict ? state.error : ''
            });
            schedule();
        },
        dispose: () => {
            active = false;
            clearTimeout(timer);
            subscribers.clear();
        }
    };
}

function storage() {
    return window.sessionStorage;
}

function updateNotice() {
    const found = [...entries.values()].find((entry) => {
        const state = entry.controller.getSnapshot();
        return state.dirty && state.error;
    });
    notice = found ? { ...found } : null;
    for (const callback of listeners) callback();
}

export function getSectionNote(userId, moduleId, sectionId, anchor) {
    const key = `${draftPrefix}${userId}:${moduleId}:${sectionId}`;
    if (!entries.has(key)) {
        let draft;
        try {
            draft = JSON.parse(storage().getItem(key));
            if (
                typeof draft?.content !== 'string' ||
                draft.content.length > maxNoteLength ||
                !Number.isInteger(draft.version)
            ) {
                draft = null;
            }
        } catch {
            draft = null;
        }
        const controller = createSectionNote({
            moduleId,
            sectionId,
            draft,
            persist: (value) => {
                if (value) storage().setItem(key, JSON.stringify(value));
                else storage().removeItem(key);
            }
        });
        entries.set(key, { controller, moduleId, anchor });
        controller.subscribe(updateNotice);
    }
    return entries.get(key).controller;
}

export function clearSectionNotes() {
    for (const entry of entries.values()) entry.controller.dispose();
    entries.clear();
    try {
        const session = storage();
        for (const key of Object.keys(session)) {
            if (key.startsWith(draftPrefix)) session.removeItem(key);
        }
    } catch {
        // Storage can be unavailable; no note text is logged.
    }
    updateNotice();
}

export const hasUnsavedSectionNotes = () =>
    [...entries.values()].some(({ controller }) => controller.getSnapshot().dirty);
export const subscribeNotesNotice = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};
export const readNotesNotice = () => notice;

export function retrySectionNotes() {
    for (const { controller } of entries.values()) {
        const state = controller.getSnapshot();
        if (!state.conflict && (state.dirty || state.error)) void controller.retry();
    }
}

export async function flushSectionNotes() {
    for (const { controller } of entries.values()) {
        await controller.save();
        const state = controller.getSnapshot();
        if (state.dirty && !state.error && !state.conflict) await controller.save();
    }
}
