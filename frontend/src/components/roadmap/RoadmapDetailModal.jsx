import { Link } from 'react-router-dom';
export function RoadmapDetailModal({ week, topic, state, onClose }) {
    if (!week) return null;
    return (
        <aside className="roadmap-detail-panel" aria-labelledby="roadmap-dialog-title">
            <button className="modal-x" aria-label="Close module details" onClick={onClose}>×</button>
            <div className="eyebrow">MODULE {String(week.sequence).padStart(2, '0')}</div>
            <h2 id="roadmap-dialog-title">{topic || week.title}</h2>
            {topic && <h3>{week.title}</h3>}
            <p>{week.concepts}</p>
            {week.objectives?.length > 0 && (
                <>
                    <h3>Learning objectives</h3>
                    <ul>{week.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
                </>
            )}
            <h3>Module topics</h3>
            <ul>{week.concepts.split(',').map((item) => <li key={item}>{item.trim()}</li>)}</ul>
            <div className="roadmap-detail-progress">
                <span>{state.status.replace('-', ' ')}</span>
                <strong>{state.percentage}%</strong>
                <div className="roadmap-progress-track"><span style={{ width: `${state.percentage}%` }} /></div>
            </div>
            <p>Open the module for lessons, examples and exercises. Opening it does not complete it.</p>
            <div className="modal-actions">
                <Link className="button primary" to={`/app/weeks/${week.id}`}>Continue Learning</Link>
                <Link className="button dark" to={`/app/weeks/${week.id}#coding-practice`}>Practice Problems</Link>
            </div>
        </aside>
    );
}
