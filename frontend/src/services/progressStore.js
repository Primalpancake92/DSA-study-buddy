const key = 'dsa-grind-progress-v1';

export function readProgress() {
  try { return JSON.parse(localStorage.getItem(key)) || { completedWeeks: [], completedCheckpoints: [] }; }
  catch { return { completedWeeks: [], completedCheckpoints: [] }; }
}

export function toggleCheckpoint(id) {
  const progress = readProgress();
  const completedCheckpoints = progress.completedCheckpoints.includes(id)
    ? progress.completedCheckpoints.filter((item) => item !== id)
    : [...progress.completedCheckpoints, id];
  const next = { ...progress, completedCheckpoints };
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}
