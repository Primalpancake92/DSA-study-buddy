import { moduleProgress } from '../../hooks/useLearningData.js';

const stages = [
    { title: 'Foundations', end: 3 },
    { title: 'Core Patterns & Data Structures', end: 8 },
    { title: 'Recursion, Trees & Graphs', end: 13 },
    { title: 'Advanced Techniques & Interview Practice', end: Infinity }
];

export function groupRoadmapStages(weeks) {
    const ordered = [...weeks].sort((a, b) => a.sequence - b.sequence);
    return stages.map((stage, index) => ({
        ...stage,
        weeks: ordered.filter((week) =>
            week.sequence > (stages[index - 1]?.end ?? 0) && week.sequence <= stage.end
        )
    })).filter((stage) => stage.weeks.length);
}

export function RoadmapCanvas({ weeks, progress, onSelect }) {
    const groups = groupRoadmapStages(weeks);
    const current = [...weeks].sort((a, b) => a.sequence - b.sequence)
        .find((week) => moduleProgress(week, progress).status !== 'completed');

    return (
        <section className="roadmap-tree" aria-label="Interactive DSA roadmap">
            <div className="roadmap-summary">
                <span>{weeks.length} modules</span>
                <span>{groups.length} learning stages</span>
                <span>Progress tracked</span>
            </div>
            {groups.map((stage, index) => (
                <details
                    className="roadmap-stage"
                    key={stage.title}
                    open={stage.weeks.some((week) => week.id === current?.id) || index === 0}
                >
                    <summary>
                        <span>
                            <strong>Stage {String(index + 1).padStart(2, '0')} — {stage.title}</strong>
                            <small>{stage.weeks.filter((week) => moduleProgress(week, progress).status === 'completed').length} of {stage.weeks.length} modules completed</small>
                        </span>
                        <span className="roadmap-stage-range">
                            Modules {String(stage.weeks[0].sequence).padStart(2, '0')}–{String(stage.weeks.at(-1).sequence).padStart(2, '0')}
                            <span className="roadmap-chevron" aria-hidden="true">⌄</span>
                        </span>
                    </summary>
                    <ol className="roadmap-path">
                        {stage.weeks.map((week) => {
                            const state = moduleProgress(week, progress);
                            const isCurrent = week.id === current?.id;
                            return (
                                <li key={week.id}>
                                    <button
                                        type="button"
                                        className={`roadmap-card ${state.status}${isCurrent ? ' is-current' : ''}`}
                                        onClick={() => onSelect({ weekId: week.id })}
                                    >
                                        <span className="roadmap-card-heading">
                                            <span>
                                                <small>MODULE {String(week.sequence).padStart(2, '0')}{isCurrent ? ' · CURRENT' : ''}</small>
                                                <strong>{week.title}</strong>
                                            </span>
                                            <span className="roadmap-status-icon" aria-hidden="true">{state.status === 'completed' ? '✓' : isCurrent ? '↗' : '○'}</span>
                                        </span>
                                        <span className="roadmap-concepts">{week.concepts.split(',').slice(0, 3).map((topic) => topic.trim()).join(' · ')}</span>
                                        <span className="roadmap-progress-track" aria-hidden="true">
                                            <span style={{ width: `${state.percentage}%` }} />
                                        </span>
                                        <span className="roadmap-card-footer">
                                            <span>{state.status === 'completed' ? 'Completed' : state.status === 'in-progress' ? 'In progress' : 'Not started'}</span>
                                            <span>{state.percentage}%</span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </details>
            ))}
            <p className="roadmap-hint">Select a module to explore its topics and lessons. Progress reflects completed lessons.</p>
        </section>
    );
}
