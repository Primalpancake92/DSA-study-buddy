export function filterPractice(problems, filters) {
    return problems.filter(
        (problem) =>
            (!filters.platform || problem.platform === filters.platform) &&
            (!filters.difficulty || problem.difficulty === filters.difficulty) &&
            (!filters.topic || problem.topics.includes(filters.topic)) &&
            (!filters.status || problem.progress.status === filters.status)
    );
}
export function recommendPractice(problems, now = Date.now(), preferences = {}) {
    const rank = (problem) =>
        preferences.revisionExercises !== false &&
        (problem.progress.status === 'review-needed' ||
            (problem.progress.next_review_at && Date.parse(problem.progress.next_review_at) <= now))
            ? 0
            : problem.progress.status === 'attempted'
              ? 1
              : problem.progress.status === 'not-started'
                ? 2
                : 3;
    const difficulty = { Easy: 0, Medium: 1, Hard: 2 };
    const target =
        { beginner: 0, intermediate: 1, advanced: 2 }[preferences.difficulty] ??
        (problems.filter((problem) => problem.progress.status === 'solved').length >= 3 ? 1 : 0);
    return [...problems].sort(
        (a, b) =>
            rank(a) - rank(b) ||
            Math.abs(difficulty[a.difficulty] - target) -
                Math.abs(difficulty[b.difficulty] - target) ||
            a.id.localeCompare(b.id)
    );
}
