import { apiRequest } from './authApi.js';

const progressEvent = 'dsa-grind-progress-change';
const emptyProgress = () => ({
    completedWeeks: [],
    completedCheckpoints: [],
    startedLessons: [],
    ready: false,
    saving: false,
    reloading: false,
    sessionExpired: false,
    pendingId: null,
    error: ''
});
let progressCache = emptyProgress();
let cacheGeneration = 0;
let loading;

export function progressErrorMessage(error, operation = 'save') {
    if (error.status === 401 || error.code === 'AUTH_REQUIRED') {
        return 'Your session has expired. Please sign in again.';
    }
    if (
        error.code === 'NETWORK_ERROR' ||
        error instanceof TypeError ||
        /offline|unreachable|failed to fetch/i.test(error.message || '')
    ) {
        return 'Unable to connect to the server. Check your connection and retry.';
    }
    if (error.status === 403) {
        return error.code === 'EMAIL_NOT_VERIFIED'
            ? 'Please verify your email address before saving progress.'
            : 'Your security token is no longer valid. Refresh the page and try again.';
    }
    if (error.code === 'UNKNOWN_LESSON') {
        return 'This lesson has changed or is unavailable. Reload the module and try again.';
    }
    return operation === 'load'
        ? 'Your saved progress could not be loaded. Please try again.'
        : 'Your progress could not be saved. Please try again.';
}

function savedSnapshot(remote) {
    return {
        completedWeeks: [...new Set(remote.completedWeeks || [])],
        completedCheckpoints: [...new Set(remote.completedCheckpoints || [])],
        startedLessons: [...new Set(remote.startedLessons || [])]
    };
}

const sessionFailure = (error) => error.status === 401 || error.code === 'AUTH_REQUIRED';

export function clearProgress() {
    cacheGeneration++;
    loading = undefined;
    progressCache = emptyProgress();
    window.dispatchEvent(new Event(progressEvent));
}

export function readProgress() {
    return progressCache;
}

async function finishCheckpointSave(save, generation, id, completed) {
    try {
        const remote = await save;
        if (generation !== cacheGeneration) return;
        const completedCheckpoints = completed
            ? [...new Set([...progressCache.completedCheckpoints, id])]
            : progressCache.completedCheckpoints.filter((item) => item !== id);
        const startedLessons = completed
            ? progressCache.startedLessons.filter((item) => item !== id)
            : [id, ...progressCache.startedLessons.filter((item) => item !== id)];
        const authoritative = Array.isArray(remote?.completedCheckpoints);
        progressCache = {
            ...progressCache,
            ...(authoritative ? savedSnapshot(remote) : { completedCheckpoints, startedLessons }),
            saving: false,
            pendingId: null,
            sessionExpired: false,
            error: ''
        };
        window.dispatchEvent(new Event(progressEvent));
        if (!authoritative) {
            void loadProgressFromApi();
        }
    } catch (error) {
        if (generation !== cacheGeneration) return;
        progressCache = {
            ...progressCache,
            saving: false,
            pendingId: null,
            reloading: false,
            ready: sessionFailure(error) ? false : progressCache.ready,
            sessionExpired: sessionFailure(error),
            error: progressErrorMessage(error)
        };
        window.dispatchEvent(new Event(progressEvent));
    }
}

export function toggleCheckpoint(id) {
    return saveCheckpoint(id, !progressCache.completedCheckpoints.includes(id));
}

export function completeLesson(id) {
    if (progressCache.completedCheckpoints.includes(id)) {
        return progressCache;
    }
    return saveCheckpoint(id, true);
}

function saveCheckpoint(id, completed) {
    if (!progressCache.ready || progressCache.saving || progressCache.sessionExpired) {
        return progressCache;
    }
    const generation = ++cacheGeneration;
    // A pre-save refresh belongs to the old generation and must not suppress
    // the authoritative post-save refresh when the write completes.
    loading = undefined;
    progressCache = { ...progressCache, saving: true, reloading: false, pendingId: id, error: '' };
    window.dispatchEvent(new Event(progressEvent));
    // Serialize writes across navigation and never replace unrelated saved IDs.
    const save = apiRequest(`/api/progress/lessons/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed })
    });
    void finishCheckpointSave(save, generation, id, completed);
    return progressCache;
}

export function loadProgressFromApi() {
    if (progressCache.saving) return Promise.resolve(progressCache);
    if (loading) return loading;
    const generation = cacheGeneration;
    progressCache = { ...progressCache, reloading: true };
    const response = apiRequest('/api/progress', { cache: 'no-store' });
    const request = (async () => {
        try {
            const remote = await response;
            if (generation !== cacheGeneration) return progressCache;
            progressCache = {
                ...progressCache,
                ...savedSnapshot(remote),
                ready: true,
                reloading: false,
                sessionExpired: false,
                error: ''
            };
            window.dispatchEvent(new Event(progressEvent));
            return progressCache;
        } catch (error) {
            if (generation === cacheGeneration) {
                progressCache = {
                    ...progressCache,
                    reloading: false,
                    ready: sessionFailure(error) ? false : progressCache.ready,
                    sessionExpired: sessionFailure(error),
                    error: progressErrorMessage(error, 'load')
                };
                window.dispatchEvent(new Event(progressEvent));
            }
            return progressCache;
        } finally {
            if (loading === request) loading = undefined;
        }
    })();
    loading = request;
    window.dispatchEvent(new Event(progressEvent));
    return request;
}

export function subscribeToProgress(listener) {
    window.addEventListener(progressEvent, listener);
    return () => window.removeEventListener(progressEvent, listener);
}

export async function markLessonStarted(id) {
    const weekId = Number(id.match(/^w(\d+)-section-/)?.[1]);
    if (
        progressCache.completedWeeks.includes(weekId) ||
        !progressCache.ready ||
        progressCache.saving ||
        progressCache.reloading ||
        progressCache.sessionExpired ||
        progressCache.completedCheckpoints.includes(id) ||
        progressCache.startedLessons.includes(id)
    ) {
        return;
    }
    const generation = ++cacheGeneration;
    loading = undefined;
    progressCache = { ...progressCache, saving: true, pendingId: id, error: '' };
    window.dispatchEvent(new Event(progressEvent));
    const save = apiRequest(`/api/progress/lessons/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: false, startedOnly: true })
    });
    await finishCheckpointSave(save, generation, id, false);
}
