import { useLayoutEffect, useRef, useState } from 'react';
import { moduleProgress } from '../../hooks/useLearningData.js';
import { buildRoadmap, clampZoom, diagramWidth, rowHeight } from './layout.js';

export function RoadmapCanvas({ weeks, progress, onSelect }) {
  const viewport = useRef(null);
  const drag = useRef(null);
  const [zoom, setZoom] = useState(1);
  const rows = buildRoadmap(weeks);
  const height = weeks.length * rowHeight + 60;
  const fit = () => setZoom(Math.max(0.65, Math.min(1, viewport.current.clientWidth / diagramWidth)));

  useLayoutEffect(() => {
    const observer = new ResizeObserver(fit);
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    viewport.current.scrollLeft = Math.max(0, (diagramWidth * zoom - viewport.current.clientWidth) / 2);
  }, [zoom]);

  return <section className="roadmap-diagram" aria-label="Interactive DSA roadmap">
    <div className="diagram-toolbar"><p>Follow the main path; explore a topic branch for module details.</p><div className="diagram-controls">
      <button onClick={() => setZoom(clampZoom(zoom + 0.15))} aria-label="Zoom in">＋</button><output aria-live="polite">{Math.round(zoom * 100)}%</output>
      <button onClick={() => setZoom(clampZoom(zoom - 0.15))} aria-label="Zoom out">−</button><button onClick={() => { fit(); viewport.current.scrollLeft = Math.max(0, (diagramWidth * Math.max(0.65, Math.min(1, viewport.current.clientWidth / diagramWidth)) - viewport.current.clientWidth) / 2); }}>Reset</button><button onClick={fit}>Fit width</button>
    </div></div>
    <p className="diagram-help">Scroll down the page to follow the path. Drag the background or swipe sideways to pan. Use Tab to reach every topic.</p>
    <div className="diagram-viewport" ref={viewport} tabIndex={0} aria-label="Learning diagram; scroll horizontally to explore branches"
      onPointerDown={(event) => { if (event.pointerType !== 'mouse' || event.target.closest('button')) return; drag.current = { x: event.clientX, y: event.clientY, left: viewport.current.scrollLeft, top: window.scrollY }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (!drag.current) return; viewport.current.scrollLeft = drag.current.left + drag.current.x - event.clientX; window.scrollTo({ left: 0, top: drag.current.top + drag.current.y - event.clientY, behavior: 'instant' }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <div className="diagram-bounds" style={{ width: diagramWidth * zoom, height: height * zoom }}><div className="diagram-world" style={{ width: diagramWidth, height, transform: `scale(${zoom})` }}>
        <svg width={diagramWidth} height={height} aria-hidden="true" className="diagram-lines">{rows.map(({ week, y, topics }, index) => <g key={week.id}>
          {index < rows.length - 1 && <path d={`M500 ${y + 82} V${y + rowHeight}`} />}
          {topics.map((topic, i) => <path key={i} className="topic-edge" d={`M${i % 2 ? 650 : 350} ${y + 40} H${i % 2 ? 700 : 300} V${topic.y + 26} H${i % 2 ? 735 : 265}`} />)}
        </g>)}</svg>
        {rows.map(({ week, y, topics }) => { const state = moduleProgress(week, progress); return <div key={week.id}>
          <button className={`diagram-module ${state.status}`} style={{ left: 350, top: y }} onClick={() => onSelect({ weekId: week.id })}>
            <small>WEEK {String(week.id).padStart(2, '0')}</small><strong>{week.title}</strong><span>{state.status === 'completed' ? '✓' : state.percentage ? '◐' : '○'} {state.percentage}% complete</span>
          </button>{topics.map((topic, i) => <button key={i} className="diagram-topic" style={{ left: topic.x, top: topic.y }} onClick={() => onSelect({ weekId: week.id, topic: topic.title })}>{topic.title}</button>)}
        </div>; })}
      </div></div>
    </div>
  </section>;
}
