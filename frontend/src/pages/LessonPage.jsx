import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { WeekOneArrayLab } from '../components/WeekOneArrayLab.jsx';
import { ComplexityLab } from '../components/ComplexityLab.jsx';
import '../styles/complexity.css';
import { MarkdownChapter } from '../components/MarkdownChapter.jsx';
import { ChapterContent } from '../components/ChapterContent.jsx';
import { CodingPractice } from '../components/CodingPractice.jsx';
import { useAccountSettings } from '../components/AccountSettingsProvider.jsx';
import { getProtectedLesson } from '../services/curriculumApi.js';
import {
    loadProgressFromApi,
    readProgress,
    subscribeToProgress,
    markLessonStarted,
    retryProgressSave,
    toggleCheckpoint
} from '../services/progressStore.js';
import { completeLesson, reopenLesson } from '../services/progressStore.js';
import { moduleProgress } from '../hooks/useLearningData.js';
import { ModuleNavigation } from '../components/ModuleNavigation.jsx';
import { LearningTools } from '../components/LearningTools.jsx';
import '../styles/learning-workspace.css';

const legacySectionAliases = {
    'introduction-and-objectives': 'chapter-introduction',
    'fundamental-theory': 'core-theory',
    'javascript-implementation': 'javascript-implementations',
    'problem-solving-patterns': 'interview-and-leetcode-pattern-recognition'
};

export function LessonCompletionButton({ item, weekId, progress }) {
    if (!item) {
        return null;
    }
    const done =
        progress.completedWeeks.includes(weekId) || progress.completedCheckpoints.includes(item.id);
    return (
        <button
            className="button dark"
            type="button"
            disabled={!progress.ready || progress.saving || progress.reloading}
            aria-pressed={done}
            onClick={() => (done ? reopenLesson(item.id) : completeLesson(item.id))}
        >
            {progress.pendingId === item.id
                ? 'Saving…'
                : done
                  ? 'Lesson completed ✓ — Mark incomplete'
                  : 'Mark lesson complete'}
        </button>
    );
}

export function LessonPage() {
    const { settings } = useAccountSettings();
    const { weekId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(readProgress());
    const [activeSection, setActiveSection] = useState('introduction-and-objectives');
    useEffect(() => {
        let current = true;
        setLesson(null);
        setError('');

        async function loadLesson() {
            try {
                const data = await getProtectedLesson(Number(weekId));
                if (!current) return;
                setActiveSection(data.sections[0]?.id || 'coding-practice');
                setLesson({
                    ...data,
                    sections: data.sections.flatMap((section) =>
                        section.id === 'module-summary-and-mastery' && data.id !== 1
                            ? [
                                  { id: 'coding-practice', title: 'Coding Practice', body: '' },
                                  section
                              ]
                            : [section]
                    )
                });
            } catch (reason) {
                if (current) setError(reason.message);
            }
        }

        loadLesson();
        return () => {
            current = false;
        };
    }, [weekId]);
    useEffect(() => {
        loadProgressFromApi();
        return subscribeToProgress(() => setProgress(readProgress()));
    }, []);
    useEffect(() => {
        if (!lesson) return undefined;
        const sections = lesson.sections
            .map(({ id }) => document.getElementById(id))
            .filter(Boolean);
        let frame;
        const selectSection = () => {
            // Select the last heading above a stable reading line, not whichever
            // intersection entry happened to change most recently.
            const line = Math.min(160, window.innerHeight * 0.25);
            const selected = [...sections].reverse().find(
                (element) => element.getBoundingClientRect().top <= line
            ) || sections[0];
            if (selected) setActiveSection(selected.id);
        };
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(selectSection);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [lesson]);
    useEffect(() => {
        if (!location.hash || !lesson) return;
        const target = document.getElementById(
            legacySectionAliases[location.hash.slice(1)] || location.hash.slice(1)
        );
        if (target) {
            setActiveSection(target.id);
            target.scrollIntoView({
                behavior: 'instant',
                block: 'start'
            });
        }
    }, [location.hash, lesson]);
    useEffect(() => {
        const selected = lesson?.lessons?.find((item) => item.sectionId === activeSection);
        if (
            selected &&
            progress.ready &&
            !progress.saving &&
            !progress.reloading &&
            !progress.error
        ) {
            void markLessonStarted(selected.id);
        }
    }, [
        lesson,
        activeSection,
        progress.ready,
        progress.saving,
        progress.reloading,
        progress.error
    ]);
    if (error)
        return (
            <div className="page">
                <div className="form-error" role="alert">
                    {error}
                </div>
                <Link className="button primary" to="/login">
                    Sign in to continue
                </Link>
            </div>
        );
    if (!lesson) return <div className="auth-loading">Loading your module…</div>;
    const completion = moduleProgress(lesson, progress);
    const readingWords =
        lesson.readingWords ||
        lesson.sections
            .map((section) =>
                section.blocks
                    ? section.blocks.map((block) => block.text || block.prompt || '').join(' ')
                    : section.body
            )
            .join(' ')
            .trim()
            .split(/\s+/).length;
    const handleSectionClick = (event, id) => {
        event.preventDefault();
        setActiveSection(id);
        navigate({ pathname: location.pathname, hash: `#${id}` });
    };
    return (
        <div className="learning-shell">
            <div className="lesson-layout learning-layout">
                <ModuleNavigation>
                    <Link className="back-link" to="/app/roadmap">
                        ← Roadmap
                    </Link>
                    <div className="lesson-week">
                        MODULE {String(lesson.sequence).padStart(2, '0')}{' '}
                        <span>of {lesson.moduleCount}</span>
                    </div>
                    <h2>{lesson.title}</h2>
                    <div className="lesson-progress">
                        <div>
                            <span>MODULE PROGRESS</span>
                            <strong>{completion.percentage}%</strong>
                        </div>
                        <div className="progress-bar">
                            <i style={{ width: `${completion.percentage}%` }} />
                        </div>
                    </div>
                    <nav className="topic-list" aria-label="Module sections">
                        {lesson.sections.map((section, index) => (
                            <a
                                aria-current={activeSection === section.id ? 'location' : undefined}
                                className={activeSection === section.id ? 'selected' : ''}
                                href={`#${section.id}`}
                                onClick={(event) => handleSectionClick(event, section.id)}
                                key={section.id}
                            >
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </ModuleNavigation>
                <main className="lesson-main">
                    <div className="eyebrow">
                        MODULE {String(lesson.sequence).padStart(2, '0')} · SELF-PACED
                    </div>
                    <h1>{lesson.title}</h1>
                    {settings.learning.showEstimates && (
                        <p className="lesson-reading-estimate">
                            Reading estimate: {Math.ceil(readingWords / 220)} min at 220 words/minute;
                            coding practice takes additional time.
                        </p>
                    )}
                    <div className="checkpoint-save-status" aria-live="polite">
                        {progress.saving
                            ? 'Saving checkpoint…'
                            : progress.reloading
                              ? 'Reloading saved progress…'
                              : !progress.ready && !progress.error
                                ? 'Loading saved progress…'
                                : ''}
                    </div>
                    {progress.error && (
                        <div className="form-error" role="alert">
                            {progress.error}{' '}
                            {progress.failedSave && !progress.sessionExpired && (
                                <button
                                    type="button"
                                    disabled={progress.saving || progress.reloading}
                                    onClick={() => retryProgressSave()}
                                >
                                    Retry save
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={progress.saving || progress.reloading}
                                onClick={() => loadProgressFromApi()}
                            >
                                {progress.reloading ? 'Reloading…' : 'Reload saved progress'}
                            </button>
                            {progress.sessionExpired && (
                                <Link
                                    to={`/login?next=${encodeURIComponent(location.pathname + location.hash)}`}
                                >
                                    Sign in again
                                </Link>
                            )}
                        </div>
                    )}
                    <p className="lede">
                        {lesson.concepts}. Work through each section, then complete the mastery
                        checklist when you can explain the pattern without looking back.
                    </p>
                    {lesson.sections.map((section) => (
                        <section
                            className="lesson-section"
                            id={section.id}
                            key={`${lesson.id}:${section.id}`}
                        >
                            <h2>{section.title}</h2>
                            <LessonCompletionButton
                                item={lesson.lessons?.find((item) => item.sectionId === section.id)}
                                weekId={lesson.id}
                                progress={progress}
                            />
                            {section.id === 'coding-practice' ? (
                                <CodingPractice key={lesson.id} weekId={lesson.id} />
                            ) : typeof section.markdown === 'string' ? (
                                section.id === 'hints-and-worked-solutions' ? (
                                    <details
                                        open={
                                            lesson.id !== 1 && lesson.id !== 17
                                                ? !settings.learning.hideSolutions || undefined
                                                : undefined
                                        }
                                    >
                                        <summary>Reveal hints and worked solutions</summary>
                                        <MarkdownChapter
                                            markdown={section.markdown}
                                            weekId={lesson.id}
                                            progress={progress}
                                            onToggle={toggleCheckpoint}
                                        />
                                    </details>
                                ) : (
                                    <MarkdownChapter
                                        markdown={section.markdown}
                                        weekId={lesson.id}
                                        progress={progress}
                                        onToggle={toggleCheckpoint}
                                    />
                                )
                            ) : section.blocks ? (
                                <ChapterContent blocks={section.blocks} />
                            ) : (
                                <div className="lesson-copy">
                                    {section.body.split('\n\n').map((paragraph, index, parts) =>
                                        index === parts.length - 1 &&
                                        section.id === 'javascript-implementation' ? (
                                            <pre key={index}>
                                                <code>{paragraph}</code>
                                            </pre>
                                        ) : (
                                            <p key={index}>{paragraph}</p>
                                        )
                                    )}
                                </div>
                            )}
                            {section.id === 'visual-explanations' && lesson.id === 17 && (
                                <WeekOneArrayLab />
                            )}
                            {section.id === 'visual-explanations' && lesson.id === 1 && (
                                <ComplexityLab />
                            )}
                            {section.id === 'module-summary-and-mastery' && (
                                <div className="checkpoint">
                                    <div>
                                        <div className="section-kicker">MASTERY CHECKPOINT</div>
                                        <h3>Can you explain the pattern?</h3>
                                        <p>
                                            Mark each statement only when you can explain it without
                                            looking back.
                                        </p>
                                    </div>
                                    {lesson.checkpoint.map((item, index) => {
                                        const id = `w${lesson.id}-${index}`;
                                        return (
                                            <label className="check-row" key={id}>
                                                <input
                                                    type="checkbox"
                                                    disabled={
                                                        !progress.ready ||
                                                        progress.saving ||
                                                        progress.reloading
                                                    }
                                                    checked={progress.completedCheckpoints.includes(id)}
                                                    onChange={() => setProgress(toggleCheckpoint(id))}
                                                />
                                                <span>{item}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    ))}
                    <nav className="chapter-pagination" aria-label="Adjacent modules">
                        {lesson.previousModuleId ? (
                            <Link to={`/app/weeks/${lesson.previousModuleId}`}>← Previous module</Link>
                        ) : (
                            <Link to="/app/modules">All modules</Link>
                        )}
                        {lesson.nextModuleId && (
                            <Link to={`/app/weeks/${lesson.nextModuleId}`}>Next module →</Link>
                        )}
                    </nav>
                    <aside className="lesson-right learning-resources">
                        <div className="section-kicker">RESOURCES</div>
                        {lesson.resources.length ? (
                            lesson.resources.map((resource) => (
                                <a
                                    className="resource-card"
                                    href={resource.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    key={resource.title}
                                >
                                    <small>{resource.provider}</small>
                                    <strong>{resource.title}</strong>
                                    <span>Open reference ↗</span>
                                </a>
                            ))
                        ) : (
                            <p className="lede">
                                Relevant lectures and source resources are available inside the
                                authenticated curriculum.
                            </p>
                        )}
                        <div className="section-kicker challenge-label">CHALLENGE</div>
                        {lesson.problems.length ? (
                            <Link className="challenge-card" to={`/app/weeks/${lesson.id}`}>
                                <small>
                                    {lesson.problems[0].difficulty.toUpperCase()} ·{' '}
                                    {lesson.problems[0].topic.toUpperCase()}
                                </small>
                                <strong>{lesson.problems[0].title}</strong>
                                <span>Open challenge →</span>
                            </Link>
                        ) : (
                            <div className="challenge-card">
                                <small>REVIEW</small>
                                <strong>Use the practice set</strong>
                                <span>Complete the exercises and checkpoint in this module.</span>
                            </div>
                        )}
                    </aside>
                </main>
                <LearningTools
                    lesson={lesson}
                    section={lesson.sections.find((section) => section.id === activeSection) || lesson.sections[0]}
                />
            </div>
        </div>
    );
}
