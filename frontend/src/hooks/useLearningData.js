import { useEffect, useState } from 'react';
import { getProtectedCurriculum } from '../services/curriculumApi.js';
import { loadProgressFromApi, readProgress, subscribeToProgress } from '../services/progressStore.js';

export function useLearningData() { const [weeks, setWeeks] = useState([]); const [progress, setProgress] = useState(readProgress()); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); useEffect(() => { Promise.all([getProtectedCurriculum(), loadProgressFromApi()]).then(([curriculum, currentProgress]) => { setWeeks(curriculum.weeks); setProgress(currentProgress); }).catch((reason) => setError(reason.message)).finally(() => setLoading(false)); return subscribeToProgress(() => setProgress(readProgress())); }, []); return { weeks, progress, loading, error }; }

export function moduleProgress(week, progress) {
  const total = week?.totalLessonCount || 3;
  const completed = progress.completedWeeks.includes(week.id) ? total : Math.min(total,
    new Set(progress.completedCheckpoints.filter((id) => new RegExp(`^w${week.id}-[0-9]+$`).test(id))).size);
  const percentage = Math.min(100, Math.round((completed / total) * 100));
  return { completed, total, percentage, status: percentage === 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started' };
}
