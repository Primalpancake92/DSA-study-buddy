import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
export function RoadmapDetailModal({ week, topic, state, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (!week) return;
    const trigger = document.activeElement;
    const element = dialog.current;
    const escape = (event) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    element.showModal();
    element.addEventListener('keydown', escape);
    return () => { element.removeEventListener('keydown', escape); element.close(); trigger?.focus(); };
  }, [week]);
  return <dialog ref={dialog} className="roadmap-modal" aria-labelledby="roadmap-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    {week && <><button autoFocus className="modal-x" aria-label="Close module details" onClick={onClose}>×</button><div className="eyebrow">WEEK {week.id}</div><h2 id="roadmap-dialog-title">{topic || week.title}</h2>{topic && <h3>{week.title}</h3>}<p>{week.concepts}</p>{week.objectives?.length > 0 && <><h3>Learning objectives</h3><ul>{week.objectives.map((item) => <li key={item}>{item}</li>)}</ul></>}<h3>Module topics</h3><ul>{week.concepts.split(',').map((item) => <li key={item}>{item.trim()}</li>)}</ul><p>{state.status.replace('-', ' ')} · {state.percentage}% · {state.completed}/{state.total} checkpoints</p><p>Open the module for its lessons, examples and exercises. Opening it does not complete it.</p><div className="modal-actions"><button className="button dark" onClick={onClose}>Cancel</button><Link className="button primary" to={`/app/weeks/${week.id}`}>Start Module</Link></div></>}
  </dialog>;
}
