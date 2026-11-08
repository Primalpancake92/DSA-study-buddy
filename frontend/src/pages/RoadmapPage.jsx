import { useState } from 'react';
import { moduleProgress, useLearningData } from '../hooks/useLearningData.js';
import { RoadmapCanvas } from '../components/roadmap/RoadmapCanvas.jsx';
import { RoadmapDetailModal } from '../components/roadmap/RoadmapDetailModal.jsx';
import '../styles/roadmap.css';
export function RoadmapPage() {
    const { weeks, progress, loading, error } = useLearningData();
    const [selection, setSelection] = useState(null);
    const selected = selection && weeks.find((week) => week.id === selection.weekId);
    return (
        <div className="page diagram-page">
            <div className="eyebrow">YOUR LEARNING PATH</div>
            <h1>DSA Roadmap</h1>
            <p>Explore modules, topics, and your progress — one learning stage at a time.</p>
            {loading && <p role="status">Loading roadmap…</p>}
            {error && <p role="alert">{error}</p>}
            {!loading && !error && (
                <div className={`roadmap-explorer${selected ? ' has-selection' : ''}`}>
                    <RoadmapCanvas
                        weeks={weeks}
                        progress={progress}
                        selectedWeekId={selected?.id}
                        onSelect={setSelection}
                    />
                    <RoadmapDetailModal
                        week={selected}
                        state={selected ? moduleProgress(selected, progress) : null}
                        onClose={() => setSelection(null)}
                    />
                </div>
            )}
        </div>
    );
}
