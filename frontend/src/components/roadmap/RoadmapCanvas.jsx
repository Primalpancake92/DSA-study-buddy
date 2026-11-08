import { useState } from 'react';
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

export function RoadmapCanvas({ weeks, progress, onSelect, selectedWeekId }) {
    const groups = groupRoadmapStages(weeks);
    const current = [...weeks].sort((a, b) => a.sequence - b.sequence)
        .find((week) => moduleProgress(week, progress).status !== 'completed');
    const currentStage = groups.findIndex((stage) =>
        stage.weeks.some((week) => week.id === current?.id)
    );
    const [expandedStages, setExpandedStages] = useState(() =>
        new Set([0, currentStage < 0 ? 0 : currentStage])
    );
    const toggleStage = (index) => {
        setExpandedStages((previous) => {
            const next = new Set(previous);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    return (
        <section className={`roadmap-tree${selectedWeekId ? ' has-selection' : ''}`} aria-label="Interactive DSA roadmap">
            <div className="roadmap-summary">
                <span>{weeks.length} modules</span>
                <span>{groups.length} learning stages</span>
                <span>Progress tracked</span>
            </div>
            {groups.map((stage, index) => (
                <section className={`roadmap-stage${expandedStages.has(index) ? ' is-expanded' : ''}`} key={stage.title}>
                    <button
                        type="button"
                        className="roadmap-stage-header"
                        aria-expanded={expandedStages.has(index)}
                        aria-controls={`roadmap-stage-${index}`}
                        onClick={() => toggleStage(index)}
                    >
                        <span>
                            <strong>STAGE {String(index + 1).padStart(2, '0')} <em>— {stage.title}</em></strong>
                            <small>
                                {stage.weeks.filter((week) => moduleProgress(week, progress).status === 'completed').length} of {stage.weeks.length} modules completed
                            </small>
                        </span>
                        <span className="roadmap-stage-range">
                            Modules {String(stage.weeks[0].sequence).padStart(2, '0')}–{String(stage.weeks.at(-1).sequence).padStart(2, '0')}
                            <span className="roadmap-chevron" aria-hidden="true">⌄</span>
                        </span>
                    </button>
                    <ol className="roadmap-path" id={`roadmap-stage-${index}`} hidden={!expandedStages.has(index)}>
                        {stage.weeks.map((week) => {
                            const state = moduleProgress(week, progress);
                            const isCurrent = week.id === current?.id;
                            return (
                                <li key={week.id} className={selectedWeekId === week.id ? 'is-selected' : ''}>
                                    <button
                                        type="button"
                                        className={`roadmap-card ${state.status}${isCurrent ? ' is-current' : ''}`}
                                        onClick={() => onSelect({ weekId: week.id })}
                                        aria-pressed={selectedWeekId === week.id}
                                    >
                                        <span className="roadmap-card-heading">
                                            <span>
                                                <small>MODULE {String(week.sequence).padStart(2, '0')}{isCurrent ? ' · CURRENT' : ''}</small>
                                                <strong>{week.title}</strong>
                                            </span>
                                            <span className="roadmap-status-icon" aria-hidden="true">{state.status === 'completed' ? '✓' : isCurrent ? '↗' : '○'}</span>
                                        </span>
                                        <span className="roadmap-concepts">
                                            {week.concepts.split(',').slice(0, 3).map((topic) => topic.trim()).join(' · ')}
                                        </span>
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
                </section>
            ))}
            <p className="roadmap-hint">Select a module to explore its topics and lessons. Progress reflects completed lessons.</p>
        </section>
    );
}
