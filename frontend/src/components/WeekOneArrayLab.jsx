import { useEffect, useState } from 'react';

const steps = [
  { values: [7, 2, 9, 4, 1, 8], active: 0, note: 'Start at index 0. One indexed read is constant time.' },
  { values: [7, 2, 9, 4, 1, 8], active: 1, note: 'Move one position. Traversal work grows with n.' },
  { values: [7, 2, 9, 4, 1, 8], active: 2, note: 'Keep scanning until the target is found or input ends.' },
  { values: [7, 2, 9, 4, 1, 8], active: 3, note: 'The array remains unchanged: this is read-only traversal.' },
  { values: [7, 2, 9, 4, 1, 8], active: 4, note: 'Worst case may inspect every element: O(n) time.' },
  { values: [7, 2, 9, 4, 1, 8], active: 5, note: 'End of input. Auxiliary space is O(1).' }
];

export function WeekOneArrayLab() {
  const [step, setStep] = useState(0); const [playing, setPlaying] = useState(false);
  useEffect(() => { if (!playing) return undefined; const timer = setInterval(() => setStep((value) => value === steps.length - 1 ? 0 : value + 1), 900); return () => clearInterval(timer); }, [playing]);
  const current = steps[step];
  return <section className="lab-card"><div className="section-kicker">VISUAL LAB / ARRAY TRAVERSAL</div><div className="lab-head"><div><h2>Watch the cost of a scan</h2><p>{current.note}</p></div><span className="step-count">STEP {step + 1} / {steps.length}</span></div><div className="array-row">{current.values.map((value, index) => <div className={`array-cell ${index === current.active ? 'active' : ''}`} key={`${value}-${index}`}><small>{index}</small><strong>{value}</strong></div>)}</div><div className="lab-controls"><button onClick={() => setPlaying((value) => !value)}>{playing ? 'Pause' : 'Play'}</button><button onClick={() => setStep((value) => value === 0 ? steps.length - 1 : value - 1)}>← Step</button><button onClick={() => setStep((value) => value === steps.length - 1 ? 0 : value + 1)}>Step →</button><button className="ghost" onClick={() => { setStep(0); setPlaying(false); }}>Reset</button></div></section>;
}
