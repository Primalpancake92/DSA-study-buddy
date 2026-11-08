import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { weekCatalog } from '../../../shared/curriculum.js';
import { getPractice } from '../services/practiceApi.js';
import '../styles/problems.css';

const draftKey = (id) => `dsa-grind:problem-draft:${id}`;

export function ProblemDetailPage() {
    const { problemId } = useParams();
    const [problem, setProblem] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let active = true;
        getPractice()
            .then(({ problems }) => {
                if (!active) return;
                const next = problems.find((item) => item.id === problemId);
                if (!next) throw new Error('Problem not found.');
                setProblem(next);
                setCode(
                    localStorage.getItem(draftKey(problemId)) ||
                    `function solve(input) {\n    // Build your solution here.\n    return input;\n}\n`
                );
            })
            .catch((reason) => active && setError(reason.message))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [problemId]);

    const saveDraft = () => {
        localStorage.setItem(draftKey(problemId), code);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
    };
    if (loading) return <div className="page"><p role="status">Loading challenge…</p></div>;
    if (error || !problem) return <div className="page"><p role="alert" className="form-error">{error || 'Problem not found.'}</p><Link to="/problems">Back to problems</Link></div>;
    const modules = problem.weekIds.map((id) => weekCatalog.find((week) => week.id === id)).filter(Boolean);

    return (
        <div className="page problem-detail-page">
            <Link className="back-link" to="/problems">← Problem repository</Link>
            <div className="problem-detail-grid">
                <article className="problem-description">
                    <div className="problem-card-meta">
                        <span>{problem.platform} reference</span>
                        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                    </div>
                    <h1>{problem.title}</h1>
                    <p className="problem-objective">{problem.objective}</p>
                    <h2>Recognise the pattern</h2>
                    <div className="problem-patterns">{problem.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                    <h2>Before you begin</h2>
                    <ul>{problem.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
                    <h2>Related lessons</h2>
                    <ul>{modules.map((module) => <li key={module.id}><Link to={`/app/weeks/${module.id}`}>Module {String(module.sequence).padStart(2, '0')} · {module.title}</Link></li>)}</ul>
                    <a className="button dark" href={problem.url} target="_blank" rel="noopener noreferrer">Open official challenge ↗</a>
                </article>
                <section className="problem-editor-panel" aria-label="JavaScript practice editor">
                    <div className="problem-editor-header">
                        <div><span className="eyebrow">JAVASCRIPT WORKSPACE</span><strong>Your draft</strong></div>
                        <span className="editor-status">Drafts stay in this browser</span>
                    </div>
                    <textarea
                        className="problem-editor"
                        spellCheck="false"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        aria-label="JavaScript solution draft"
                    />
                    <div className="problem-editor-actions">
                        <button className="button dark" type="button" onClick={() => setCode('')}>Reset</button>
                        <button className="button dark" type="button" onClick={saveDraft}>{saved ? 'Draft saved' : 'Save draft'}</button>
                        <button className="button primary" type="button" disabled title="Secure isolated execution is not enabled yet.">Run code (coming soon)</button>
                    </div>
                    <p className="editor-notice" role="note">Code execution is disabled until an isolated judge service is deployed. Your code is never executed inside the Express process.</p>
                </section>
            </div>
        </div>
    );
}
