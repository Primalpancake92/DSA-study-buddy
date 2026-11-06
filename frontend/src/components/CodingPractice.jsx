import { useEffect, useState } from 'react';
import { filterPractice, getPractice, recommendPractice, updatePractice } from '../services/practiceApi.js';
import '../styles/practice.css';
import { useAccountSettings } from './AccountSettingsProvider.jsx';

const statuses = [['not-started', 'Not Started'], ['attempted', 'Attempted'], ['solved', 'Solved'], ['review-needed', 'Review Needed']];

function PracticeCard({ problem, onSaved }) {
  const [status, setStatus] = useState(problem.progress.status);
  const [notes, setNotes] = useState(problem.progress.notes || '');
  const [attempts, setAttempts] = useState(problem.progress.attempts_count || 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { const { progress } = await updatePractice(problem.id, { status, notes, attemptsCount: Number(attempts) }); setAttempts(progress.attempts_count); onSaved(progress); setMessage('Practice progress saved.'); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  return <article className="practice-card">
    <div className="practice-meta"><span>{problem.platform}</span><span>{problem.difficulty}</span><span className={`practice-status ${problem.progress.status}`}>{statuses.find(([value]) => value === problem.progress.status)?.[1]}</span></div>
    <h3>{problem.title}</h3><p>{problem.objective}</p><p className="practice-topics">Topics: {problem.topics.join(' · ')}</p><p className="practice-topics">Before you begin: {problem.prerequisites.join(', ')}</p>
    <a className="button dark" href={problem.url} target="_blank" rel="noopener noreferrer">Solve on {problem.platform} ↗</a>
    <details><summary>Record your progress</summary><form onSubmit={save}>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
      <label>Attempts (recorded manually)<input type="number" min="0" max="10000" step="1" required value={attempts} onChange={(event) => setAttempts(event.target.value)} /></label>
      <label>Personal notes<textarea maxLength="4000" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save progress'}</button>
      {message && <p role="status" className="success-message">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
    </form></details>
    {problem.progress.last_attempted_at && <small>Last attempt: {new Date(problem.progress.last_attempted_at).toLocaleDateString()}</small>}
    {problem.progress.solved_at && <small>First marked solved: {new Date(problem.progress.solved_at).toLocaleDateString()}</small>}
    {problem.progress.next_review_at && <small>Review: {new Date(problem.progress.next_review_at).toLocaleDateString()}</small>}
  </article>;
}

export function CodingPractice({ weekId }) {
  const { settings } = useAccountSettings();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ platform: '', difficulty: '', topic: '', status: '' });
  useEffect(() => {
    let current = true; setLoading(true); setError(''); setProblems([]);
    getPractice(weekId).then((data) => { if (current) setProblems(data.problems); }).catch((reason) => { if (current) setError(reason.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [weekId]);
  const topics = [...new Set(problems.flatMap((problem) => problem.topics))].sort();
  const changeFilter = (name, value) => setFilters((previous) => ({ ...previous, [name]: value }));
  const visible = recommendPractice(filterPractice(problems, filters), Date.now(), settings.learning);
  return <div className="coding-practice"><p>Apply this module on LeetCode and HackerRank. These links open the official sites; opening a link never changes your progress. Statuses are self-reported, not synchronised submissions.</p><p>Start with introductory problems, then try the harder variations. Due reviews come first, followed by attempted problems and easier new practice. Use the prerequisites to check your readiness.</p>
    {loading && <p role="status">Loading practice…</p>}{error && <p role="alert" className="form-error">{error}</p>}
    {!loading && !error && <><div className="practice-filters">
      <label>Platform<select value={filters.platform} onChange={(e) => changeFilter('platform', e.target.value)}><option value="">All platforms</option>{['LeetCode', 'HackerRank'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Difficulty<select value={filters.difficulty} onChange={(e) => changeFilter('difficulty', e.target.value)}><option value="">All difficulties</option>{['Easy', 'Medium', 'Hard'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Topic<select value={filters.topic} onChange={(e) => changeFilter('topic', e.target.value)}><option value="">All topics</option>{topics.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Status<select value={filters.status} onChange={(e) => changeFilter('status', e.target.value)}><option value="">All statuses</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div><p role="status">{visible.length} recommended problems · {problems.filter((problem) => problem.progress.status === 'solved').length} marked solved</p>
      {visible.length ? visible.map((problem) => <PracticeCard key={problem.id} problem={problem} onSaved={(progress) => setProblems((previous) => previous.map((item) => item.id === problem.id ? { ...item, progress } : item))} />) : <p>No problems match these filters. Try clearing a filter.</p>}</>}
  </div>;
}
