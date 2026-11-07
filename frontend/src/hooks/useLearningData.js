import { useEffect, useState } from 'react';
import { getProtectedCurriculum } from '../services/curriculumApi.js';
import { lessonModuleProgress } from '../services/learningRecommendations.js';
import {
    loadProgressFromApi,
    readProgress,
    subscribeToProgress
} from '../services/progressStore.js';

export function useLearningData() {
    const [weeks, setWeeks] = useState([]);
    const [progress, setProgress] = useState(readProgress());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadLearningData() {
            try {
                const [curriculum, currentProgress] = await Promise.all([
                    getProtectedCurriculum(),
                    loadProgressFromApi()
                ]);
                if (!active) return;
                setWeeks(curriculum.weeks);
                setProgress(currentProgress);
            } catch (reason) {
                if (active) setError(reason.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadLearningData();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => subscribeToProgress(() => setProgress(readProgress())), []);

    return { weeks, progress, loading, error };
}

export function moduleProgress(week, progress) {
    if (Array.isArray(week?.lessons)) {
        return lessonModuleProgress(week, progress);
    }
    const total = week?.totalLessonCount || 3;
    const completed = progress.completedWeeks.includes(week.id)
        ? total
        : Math.min(
              total,
              new Set(
                  progress.completedCheckpoints.filter((id) =>
                      new RegExp(`^w${week.id}-[0-9]+$`).test(id)
                  )
              ).size
          );
    const percentage = Math.min(100, Math.round((completed / total) * 100));
    return {
        completed,
        total,
        percentage,
        status: percentage === 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started'
    };
}
