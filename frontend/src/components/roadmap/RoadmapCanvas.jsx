import { useLayoutEffect, useRef, useState } from 'react';
import { moduleProgress } from '../../hooks/useLearningData.js';
import {
    buildRoadmap,
    clampZoom,
    createWidthFit,
    diagramWidth,
    fitZoom,
    rowHeight,
    zoomScrollLeft,
    zoomStep
} from './layout.js';

export function RoadmapCanvas({ weeks, progress, onSelect }) {
    const viewport = useRef(null);
    const drag = useRef(null);
    const previousZoom = useRef(1);
    const recenter = useRef(true);
    const zoomAnchor = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [dragging, setDragging] = useState(false);
    const rows = buildRoadmap(weeks);
    const height = weeks.length * rowHeight + 60;
    const fit = () => {
        const element = viewport.current;
        const nextZoom = fitZoom(element.clientWidth);
        recenter.current = nextZoom !== previousZoom.current;
        element.scrollLeft = Math.max(
            0,
            (diagramWidth * nextZoom - element.clientWidth) / 2
        );
        setZoom(nextZoom);
    };
    const changeZoom = (increment) => {
        // Capture the pan before changing the bounds: browsers may clamp
        // scrollLeft immediately when the scaled content becomes narrower.
        zoomAnchor.current = viewport.current.scrollLeft;
        setZoom((value) => clampZoom(value + increment));
    };

    useLayoutEffect(() => {
        const fitWidth = createWidthFit(fit);
        const observer = new ResizeObserver(() => {
            // The auto-height viewport also resizes when zoom changes. Only a
            // real width change should replace the user's zoom with auto-fit.
            fitWidth(viewport.current.clientWidth);
        });
        observer.observe(viewport.current);
        return () => observer.disconnect();
    }, []);
    useLayoutEffect(() => {
        const element = viewport.current;
        element.scrollLeft = recenter.current
            ? Math.max(0, (diagramWidth * zoom - element.clientWidth) / 2)
            : zoomScrollLeft(
                  zoomAnchor.current ?? element.scrollLeft,
                  element.clientWidth,
                  previousZoom.current,
                  zoom
              );
        previousZoom.current = zoom;
        recenter.current = false;
        zoomAnchor.current = null;
    }, [zoom]);

    return (
        <section className="roadmap-diagram" aria-label="Interactive DSA roadmap">
            <div className="diagram-toolbar">
                <p>Follow the main path; explore a topic branch for module details.</p>
                <div className="diagram-controls">
                    <button
                        type="button"
                        onClick={() => changeZoom(zoomStep)}
                        disabled={zoom >= 1.8}
                        aria-label="Zoom in"
                    >
                        ＋
                    </button>
                    <output aria-live="polite" aria-label="Zoom level">
                        {Math.round(zoom * 100)}%
                    </output>
                    <button
                        type="button"
                        onClick={() => changeZoom(-zoomStep)}
                        disabled={zoom <= 0.2}
                        aria-label="Zoom out"
                    >
                        −
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            fit();
                            drag.current = null;
                            setDragging(false);
                            window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
                        }}
                    >
                        Reset
                    </button>
                    <button type="button" onClick={fit}>
                        Fit width
                    </button>
                </div>
            </div>
            <p className="diagram-help">
                Scroll down the page to follow the path. Drag the background or swipe sideways to
                pan. Use Tab to reach every topic.
            </p>
            <div
                className={`diagram-viewport${dragging ? ' is-dragging' : ''}`}
                ref={viewport}
                tabIndex={0}
                aria-label="Learning diagram; scroll horizontally to explore branches"
                onPointerDown={(event) => {
                    if (
                        event.pointerType !== 'mouse' ||
                        event.button !== 0 ||
                        event.target.closest('button')
                    ) {
                        return;
                    }
                    event.preventDefault();
                    setDragging(true);
                    drag.current = {
                        x: event.clientX,
                        y: event.clientY,
                        left: viewport.current.scrollLeft,
                        top: window.scrollY
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                    if (!drag.current) return;
                    viewport.current.scrollLeft =
                        drag.current.left + drag.current.x - event.clientX;
                    window.scrollTo({
                        left: 0,
                        top: drag.current.top + drag.current.y - event.clientY,
                        behavior: 'instant'
                    });
                }}
                onPointerUp={() => {
                    drag.current = null;
                    setDragging(false);
                }}
                onPointerCancel={() => {
                    drag.current = null;
                    setDragging(false);
                }}
                onLostPointerCapture={() => {
                    drag.current = null;
                    setDragging(false);
                }}
            >
                <div
                    className="diagram-bounds"
                    style={{ width: diagramWidth * zoom, height: height * zoom }}
                >
                    <div
                        className="diagram-world"
                        style={{ width: diagramWidth, height, transform: `scale(${zoom})` }}
                    >
                        <svg
                            width={diagramWidth}
                            height={height}
                            aria-hidden="true"
                            className="diagram-lines"
                        >
                            {rows.map(({ week, y, topics }, index) => (
                                <g key={week.id}>
                                    {index < rows.length - 1 && (
                                        <path d={`M500 ${y + 82} V${y + rowHeight}`} />
                                    )}
                                    {topics.map((topic, i) => (
                                        <path
                                            key={i}
                                            className="topic-edge"
                                            d={`M${i % 2 ? 650 : 350} ${y + 40} H${i % 2 ? 700 : 300} V${topic.y + 26} H${i % 2 ? 735 : 265}`}
                                        />
                                    ))}
                                </g>
                            ))}
                        </svg>
                        {rows.map(({ week, y, topics }) => {
                            const state = moduleProgress(week, progress);
                            return (
                                <div key={week.id}>
                                    <button
                                        className={`diagram-module ${state.status}`}
                                        style={{ left: 350, top: y }}
                                        onClick={() => onSelect({ weekId: week.id })}
                                    >
                                        <small>
                                            MODULE {String(week.sequence).padStart(2, '0')}
                                        </small>
                                        <strong>{week.title}</strong>
                                        <span>
                                            {state.status === 'completed'
                                                ? '✓'
                                                : state.percentage
                                                  ? '◐'
                                                  : '○'}{' '}
                                            {state.percentage}% complete
                                        </span>
                                    </button>
                                    {topics.map((topic, i) => (
                                        <button
                                            key={i}
                                            className="diagram-topic"
                                            style={{ left: topic.x, top: topic.y }}
                                            onClick={() =>
                                                onSelect({ weekId: week.id, topic: topic.title })
                                            }
                                        >
                                            {topic.title}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
