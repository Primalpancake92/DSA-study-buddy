import { apiRequest } from './authApi.js';

const progressEvent = 'dsa-grind-progress-change';
let progressCache = { completedWeeks: [], completedCheckpoints: [] };
let cacheGeneration = 0;

export function clearProgress() {
  cacheGeneration++;
  progressCache = { completedWeeks: [], completedCheckpoints: [] };
  window.dispatchEvent(new Event(progressEvent));
}

export function readProgress() { return progressCache; }

export function toggleCheckpoint(id) {
  const completedCheckpoints = progressCache.completedCheckpoints.includes(id)
    ? progressCache.completedCheckpoints.filter((item) => item !== id)
    : [...progressCache.completedCheckpoints, id];
  progressCache = { ...progressCache, completedCheckpoints };
  window.dispatchEvent(new Event(progressEvent));
  apiRequest('/api/progress', { method: 'PUT', body: JSON.stringify(progressCache) }).catch(() => undefined);
  return progressCache;
}

export async function loadProgressFromApi() {
  const generation = cacheGeneration;
  try {
    const remote = await apiRequest('/api/progress');
    if (generation !== cacheGeneration) return progressCache;
    progressCache = { completedWeeks: remote.completedWeeks || [], completedCheckpoints: remote.completedCheckpoints || [] };
    window.dispatchEvent(new Event(progressEvent));
  } catch { if (generation === cacheGeneration) clearProgress(); }
  return progressCache;
}

export function subscribeToProgress(listener) {
  window.addEventListener(progressEvent, listener);
  return () => window.removeEventListener(progressEvent, listener);
}
