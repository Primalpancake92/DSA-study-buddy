import { useState } from 'react';
import { moduleProgress, useLearningData } from '../hooks/useLearningData.js';
import { RoadmapCanvas } from '../components/roadmap/RoadmapCanvas.jsx';
import { RoadmapDetailModal } from '../components/roadmap/RoadmapDetailModal.jsx';
import '../styles/roadmap.css';
export function RoadmapPage() {
  const { weeks, progress, loading, error } = useLearningData();
  const [selection, setSelection] = useState(null);
  const selected = selection && weeks.find((week) => week.id === selection.weekId);
  return <div className="page diagram-page"><div className="eyebrow">YOUR LEARNING JOURNEY</div><h1>The DSA learning map.</h1><p>Follow the numbered pathway and explore each module’s topic branches.</p><p>○ Not started · ◐ In progress · ✓ Completed. Progress belongs to modules, not individual topic mastery.</p>{loading && <p role="status">Loading roadmap…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && <RoadmapCanvas weeks={weeks} progress={progress} onSelect={setSelection} />}<RoadmapDetailModal week={selected} topic={selection?.topic} state={selected ? moduleProgress(selected, progress) : null} onClose={() => setSelection(null)} /></div>;
}
