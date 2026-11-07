export function recommendNextLesson(weeks, progress) {
    if (!progress.ready || progress.error) {
        return { state: progress.error ? 'error' : 'loading' };
    }
    const completed = new Set(progress.completedCheckpoints);
    const completedWeeks = new Set(progress.completedWeeks);
    const candidates = weeks
        .filter((week) => !week.locked && week.available !== false)
        .flatMap((week) =>
            (week.lessons || [])
                .filter(
                    (lesson) =>
                        !lesson.locked &&
                        lesson.available !== false &&
                        lesson.id &&
                        lesson.sectionId &&
                        !completedWeeks.has(week.id) &&
                        !completed.has(lesson.id)
                )
                .map((lesson) => ({
                    ...lesson,
                    weekId: week.id,
                    sequence: week.sequence,
                    moduleTitle: week.title
                }))
        );
    const resumed = (progress.startedLessons || [])
        .map((id) => candidates.find((lesson) => lesson.id === id))
        .find(Boolean);
    const partialWeek = weeks.find(
        (week) =>
            (week.lessons || []).some((lesson) => completed.has(lesson.id)) &&
            candidates.some((lesson) => lesson.weekId === week.id)
    );
    const lesson =
        resumed || candidates.find((item) => item.weekId === partialWeek?.id) || candidates[0];
    if (!lesson) {
        const all = weeks.flatMap((week) =>
            (week.lessons || []).map((lesson) => ({ ...lesson, weekId: week.id }))
        );
        return {
            state:
                all.length &&
                all.every((item) => completedWeeks.has(item.weekId) || completed.has(item.id))
                    ? 'complete'
                    : 'unavailable'
        };
    }
    return {
        state: 'ready',
        lesson,
        continuing: Boolean(resumed),
        href: `/app/weeks/${lesson.weekId}#${lesson.sectionId}`
    };
}

export function lessonModuleProgress(week, progress) {
    const lessons = [
        ...new Map((week.lessons || []).map((lesson) => [lesson.id, lesson])).values()
    ];
    const saved = new Set(progress.completedCheckpoints);
    const total = lessons.length;
    const completed = progress.completedWeeks.includes(week.id)
        ? total
        : lessons.filter((lesson) => saved.has(lesson.id)).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    return {
        completed,
        total,
        percentage,
        status:
            total && completed === total
                ? 'completed'
                : completed ||
                    lessons.some((lesson) => progress.startedLessons?.includes(lesson.id))
                  ? 'in-progress'
                  : 'not-started'
    };
}
