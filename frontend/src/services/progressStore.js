import { apiRequest } from './authApi.js';

const progressEvent = 'dsa-grind-progress-change';
const emptyProgress = () => ({
    completedWeeks: [],
    completedCheckpoints: [],
    startedLessons: [],
    ready: false,
    saving: false,
    error: ''
});
let progressCache = emptyProgress();
let cacheGeneration = 0;
let loading;

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
        await save;
        if (generation !== cacheGeneration) return;
        const completedCheckpoints = completed
            ? [...progressCache.completedCheckpoints, id]
            : progressCache.completedCheckpoints.filter((item) => item !== id);
        const startedLessons = completed
            ? progressCache.startedLessons.filter((item) => item !== id)
            : [id, ...progressCache.startedLessons.filter((item) => item !== id)];
        progressCache = { ...progressCache, completedCheckpoints, startedLessons, saving: false };
        window.dispatchEvent(new Event(progressEvent));
        loadProgressFromApi();
    } catch (error) {
        if (generation !== cacheGeneration) return;
        progressCache = {
            ...progressCache,
            saving: false,
            error: `Could not save this checkpoint. ${error.message} Try again.`
        };
        window.dispatchEvent(new Event(progressEvent));
    }
}

export function toggleCheckpoint(id) {
    if (!progressCache.ready || progressCache.saving) return progressCache;
    const generation = ++cacheGeneration;
    // A pre-save refresh belongs to the old generation and must not suppress
    // the authoritative post-save refresh when the write completes.
    loading = undefined;
    const completed = !progressCache.completedCheckpoints.includes(id);
    progressCache = { ...progressCache, saving: true, error: '' };
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
    const response = apiRequest('/api/progress');
    const request = (async () => {
        try {
            const remote = await response;
            if (generation !== cacheGeneration) return progressCache;
            progressCache = {
                ...progressCache,
                completedWeeks: remote.completedWeeks || [],
                completedCheckpoints: remote.completedCheckpoints || [],
                startedLessons: remote.startedLessons || [],
                ready: true,
                error: ''
            };
            window.dispatchEvent(new Event(progressEvent));
            return progressCache;
        } catch (error) {
            if (generation === cacheGeneration) {
                progressCache = {
                    ...progressCache,
                    error: `Could not load saved progress. ${error.message}`
                };
                window.dispatchEvent(new Event(progressEvent));
            }
            return progressCache;
        } finally {
            if (loading === request) loading = undefined;
        }
    })();
    loading = request;
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
        progressCache.completedCheckpoints.includes(id) ||
        progressCache.startedLessons.includes(id)
    ) {
        return;
    }
    const generation = ++cacheGeneration;
    loading = undefined;
    progressCache = { ...progressCache, saving: true, error: '' };
    window.dispatchEvent(new Event(progressEvent));
    const save = apiRequest(`/api/progress/lessons/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: false })
    });
    await finishCheckpointSave(save, generation, id, false);
}
