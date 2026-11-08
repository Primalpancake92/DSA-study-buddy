import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { weekCatalog } from '../../../shared/curriculum.js';
import { getPractice } from '../services/practiceApi.js';
import '../styles/problems.css';

const difficulties = ['Easy', 'Medium', 'Hard'];
const statuses = [
    ['not-started', 'Not started'],
    ['attempted', 'Attempted'],
    ['solved', 'Solved'],
    ['review-needed', 'Needs revision']
];

function moduleForProblem(problem, id) {
    return weekCatalog.find((week) => week.id === id);
}

export function ProblemsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        module: searchParams.get('module') || '',
        pattern: searchParams.get('pattern') || '',
        difficulty: searchParams.get('difficulty') || '',
        status: searchParams.get('status') || '',
        sort: searchParams.get('sort') || 'module'
    });

    useEffect(() => {
        let active = true;
        getPractice()
            .then((result) => active && setProblems(result.problems))
            .catch((reason) => active && setError(reason.message))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const patterns = useMemo(
        () => [...new Set(problems.flatMap((problem) => problem.topics))].sort(),
        [problems]
    );
    const visible = useMemo(() => {
        const difficultyRank = { Easy: 0, Medium: 1, Hard: 2 };
        const result = problems.filter((problem) => {
            const title = problem.title.toLowerCase();
            const selectedModule =
                weekCatalog.find((week) => week.sequence === Number(filters.module))?.id ||
                Number(filters.module);
            const matchesSearch =
                !filters.search ||
                title.includes(filters.search.toLowerCase()) ||
                problem.objective.toLowerCase().includes(filters.search.toLowerCase());
            return (
                matchesSearch &&
                (!filters.module || problem.weekIds.includes(selectedModule)) &&
                (!filters.pattern || problem.topics.includes(filters.pattern)) &&
                (!filters.difficulty || problem.difficulty === filters.difficulty) &&
                (!filters.status || problem.progress.status === filters.status)
            );
        });
        return result.sort((a, b) => {
            if (filters.sort === 'difficulty')
                return difficultyRank[a.difficulty] - difficultyRank[b.difficulty] || a.title.localeCompare(b.title);
            if (filters.sort === 'completion')
                return a.progress.status.localeCompare(b.progress.status) || a.title.localeCompare(b.title);
            return (a.weekIds[0] || 0) - (b.weekIds[0] || 0) || a.title.localeCompare(b.title);
        });
    }, [filters, problems]);
    const updateFilter = (name, value) => {
        const next = { ...filters, [name]: value };
        setFilters(next);
        const params = Object.entries(next).filter(([key, item]) => item && key !== 'sort');
        setSearchParams(Object.fromEntries(params), { replace: true });
    };
    const solved = problems.filter((problem) => problem.progress.status === 'solved').length;
    const attempted = problems.filter((problem) => problem.progress.status !== 'not-started').length;

    return (
        <div className="page problems-page">
            <div className="page-intro">
                <div>
                    <div className="eyebrow">THE DSA PROBLEM REPOSITORY</div>
                    <h1>Practice the pattern.</h1>
                    <p>Move from a lesson to a focused challenge, then record what you learned.</p>
                </div>
                <div className="problem-stats" aria-label="Problem progress summary">
                    <span><strong>{solved}</strong> solved</span>
                    <span><strong>{attempted}</strong> attempted</span>
                    <span><strong>{problems.length}</strong> available</span>
                </div>
            </div>
            <div className="problem-toolbar">
                <label className="problem-search">
                    <span>Search problems</span>
                    <input
                        type="search"
                        value={filters.search}
                        placeholder="Title or learning objective"
                        onChange={(event) => updateFilter('search', event.target.value)}
                    />
                </label>
                <label>
                    Module
                    <select value={filters.module} onChange={(event) => updateFilter('module', event.target.value)}>
                        <option value="">All modules</option>
                        {weekCatalog.map((week) => (
                            <option key={week.id} value={week.id}>
                                Module {String(week.sequence).padStart(2, '0')} · {week.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Pattern
                    <select value={filters.pattern} onChange={(event) => updateFilter('pattern', event.target.value)}>
                        <option value="">All patterns</option>
                        {patterns.map((pattern) => <option key={pattern}>{pattern}</option>)}
                    </select>
                </label>
                <label>
                    Difficulty
                    <select value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}>
                        <option value="">All difficulties</option>
                        {difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
                    </select>
                </label>
                <label>
                    Status
                    <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                        <option value="">All statuses</option>
                        {statuses.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
                    </select>
                </label>
                <label>
                    Sort
                    <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                        <option value="module">Module</option>
                        <option value="difficulty">Difficulty</option>
                        <option value="completion">Completion</option>
                    </select>
                </label>
            </div>
            {loading && <p role="status">Loading problem repository…</p>}
            {error && <p role="alert" className="form-error">{error}</p>}
            {!loading && !error && (
                <div className="problem-grid">
                    {visible.map((problem) => {
                        const module = moduleForProblem(problem, problem.weekIds[0]);
                        return (
                            <article className="problem-repository-card" key={problem.id}>
                                <div className="problem-card-meta">
                                    <span>{problem.platform} reference</span>
                                    <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                                </div>
                                <h2>{problem.title}</h2>
                                <p>{problem.objective}</p>
                                <div className="problem-patterns">
                                    {problem.topics.map((topic) => <span key={topic}>{topic}</span>)}
                                </div>
                                <div className="problem-card-footer">
                                    <small>
                                        Module {String(module?.sequence || problem.weekIds[0]).padStart(2, '0')} ·{' '}
                                        {problem.progress.status.replace('-', ' ')}
                                    </small>
                                    <Link className="button dark compact" to={`/problems/${problem.id}`}>Open challenge →</Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
            {!loading && !error && !visible.length && <p className="problem-empty">No challenges match these filters.</p>}
        </div>
    );
}
