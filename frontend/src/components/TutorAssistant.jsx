import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, MessageCircle, RotateCcw, Square, Trash2, X } from 'lucide-react';
import { useAuth } from './AuthProvider.jsx';
import { useTutorChat } from '../hooks/useTutorChat.js';
import { getSectionNote } from '../services/sectionNotesStore.js';
import { appendTutorNote } from '../services/tutorNotes.js';
import { TutorMarkdown } from './TutorMarkdown.jsx';
import '../styles/tutor.css';

const actions = [
    { label: 'Give me a hint', prompt: 'Give me a hint for this section.' },
    { label: 'Show an example', prompt: 'Walk me through an example in this section.' },
    { label: 'Explain complexity', prompt: 'Explain the time complexity in this section.' }
];

export function TutorLauncher({ open, onClick, buttonRef }) {
    return (
        <button
            ref={buttonRef}
            type="button"
            className="tutor-launcher"
            aria-label={open ? 'Close AI tutor' : 'Ask AI tutor'}
            aria-expanded={open}
            aria-controls="learning-tutor-panel"
            title={open ? 'Close AI tutor' : 'Ask AI tutor'}
            onClick={onClick}
        >
            {open ? (
                <X size={24} aria-hidden="true" />
            ) : (
                <MessageCircle size={26} aria-hidden="true" />
            )}
            {!open && (
                <span className="tutor-launcher-label" aria-hidden="true">
                    AI
                </span>
            )}
        </button>
    );
}

export function TutorMessage({ role, children, label }) {
    return (
        <article className={`tutor-message tutor-${role}`}>
            {role === 'assistant' && (
                <span className="tutor-avatar" aria-hidden="true">
                    <Bot size={18} />
                </span>
            )}
            <div className="tutor-message-body">
                <span className="tutor-sr-only">
                    {label || (role === 'assistant' ? 'AI tutor' : 'You')}
                </span>
                {children}
            </div>
        </article>
    );
}

export function TutorAssistant({ lesson, section }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const sectionId =
        lesson.lessons?.find((item) => item.sectionId === section.id)?.id ||
        `w${lesson.id}-section-${section.id}`;
    return (
        <TutorPanel
            key={`${user?.id}:${lesson.id}:${sectionId}`}
            userId={user?.id}
            moduleId={lesson.id}
            sectionId={sectionId}
            anchor={section.id}
            title={section.title}
            moduleTitle={lesson.title}
            moduleNumber={lesson.sequence}
            open={open}
            setOpen={setOpen}
        />
    );
}

function TutorPanel({
    userId,
    moduleId,
    sectionId,
    anchor,
    title,
    moduleTitle,
    moduleNumber,
    open,
    setOpen
}) {
    const chat = useTutorChat(userId, moduleId, sectionId, open);
    const [message, setMessage] = useState('');
    const [code, setCode] = useState('');
    const [includeNotes, setIncludeNotes] = useState(false);
    const [notice, setNotice] = useState('');
    const dialog = useRef(null);
    const launcher = useRef(null);
    const input = useRef(null);
    const history = useRef(null);
    const courseUrl = `/app/weeks/${moduleId}#${anchor}`;
    useEffect(() => {
        if (!open) return;
        const element = dialog.current;
        const media = window.matchMedia('(max-width: 1100px)');
        const display = () => {
            element.close();
            if (media.matches) element.showModal();
            else element.show();
        };
        display();
        input.current?.focus();
        media.addEventListener('change', display);
        return () => {
            media.removeEventListener('change', display);
            element.close();
            chat.controller.stop();
            launcher.current?.focus();
        };
    }, [open, chat.controller]);
    useEffect(() => {
        const element = history.current;
        if (element) element.scrollTop = element.scrollHeight;
    }, [chat.messages, chat.partial, chat.pendingQuestion]);
    async function send(event, mode = 'tutor', question = message) {
        event?.preventDefault();
        const success = await chat.controller.send({
            message: question.trim(),
            code,
            includeNotes,
            mode
        });
        setIncludeNotes(false);
        if (success) {
            setMessage('');
            setCode('');
        }
    }
    async function saveNote(content) {
        if (
            !window.confirm(
                'Append this AI-generated explanation to this section’s notes? Existing notes will be preserved.'
            )
        )
            return;
        try {
            setNotice(
                await appendTutorNote(getSectionNote(userId, moduleId, sectionId, anchor), content)
            );
        } catch (error) {
            setNotice(error.message);
        }
    }
    const disabled = !chat.loaded || !chat.enabled || chat.loading || chat.sending;
    return (
        <>
            <TutorLauncher buttonRef={launcher} open={open} onClick={() => setOpen(!open)} />
            <dialog
                id="learning-tutor-panel"
                ref={dialog}
                className="tutor-panel"
                aria-labelledby="tutor-title"
                onCancel={(event) => {
                    event.preventDefault();
                    setOpen(false);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpen(false);
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        const bounds = event.currentTarget.getBoundingClientRect();
                        if (
                            event.clientX < bounds.left ||
                            event.clientX > bounds.right ||
                            event.clientY < bounds.top ||
                            event.clientY > bounds.bottom
                        )
                            setOpen(false);
                    }
                }}
            >
                <header className="tutor-header">
                    <div>
                        <h2 id="tutor-title">AI learning tutor</h2>
                        <p className="tutor-module-title">
                            Module {String(moduleNumber || moduleId).padStart(2, '0')} —{' '}
                            {moduleTitle}
                        </p>
                        <small>{title}</small>
                    </div>
                    <span
                        className={`tutor-badge${chat.loaded && chat.enabled ? ' is-ready' : ''}`}
                    >
                        <span aria-hidden="true" />
                        {!chat.loaded ? 'Loading' : chat.enabled ? 'AI Tutor' : 'Not configured'}
                    </span>
                    <button
                        type="button"
                        aria-label="Close AI tutor"
                        onClick={() => setOpen(false)}
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </header>
                <div
                    ref={history}
                    className="tutor-history"
                    aria-busy={chat.sending || chat.loading}
                >
                    {chat.loading && <p role="status">Loading history…</p>}
                    {chat.loaded && !chat.enabled && (
                        <p>
                            The tutor is not enabled. An administrator must configure the backend AI
                            provider. Your lessons and notes still work normally.
                        </p>
                    )}
                    {chat.loaded && chat.enabled && !chat.messages.length && (
                        <TutorMessage role="assistant">
                            <strong>Let’s work through it together.</strong>
                            <p>
                                What would you like to understand about {title}? We can start with a
                                small hint or explore an example.
                            </p>
                        </TutorMessage>
                    )}
                    {chat.messages.map((item) => (
                        <TutorMessage key={item.id} role={item.role}>
                            {item.role === 'assistant' ? (
                                <TutorMarkdown content={item.content} courseUrl={courseUrl} />
                            ) : (
                                <p className="tutor-user-text">{item.content}</p>
                            )}
                            {item.role === 'assistant' && (
                                <button
                                    type="button"
                                    disabled={chat.sending}
                                    onClick={() => saveNote(item.content)}
                                >
                                    Append to My Notes
                                </button>
                            )}
                        </TutorMessage>
                    ))}
                    {chat.pendingQuestion && (
                        <TutorMessage role="user">
                            <p className="tutor-user-text">{chat.pendingQuestion}</p>
                        </TutorMessage>
                    )}
                    {chat.partial && (
                        <TutorMessage role="assistant">
                            <small className="tutor-stream-label">
                                {chat.sending ? 'Writing…' : 'Unfinished · not saved'}
                            </small>
                            <TutorMarkdown content={chat.partial} courseUrl={courseUrl} />
                        </TutorMessage>
                    )}
                    {chat.sending && <p role="status">Thinking / receiving response…</p>}
                </div>
                {chat.error && (
                    <p className="tutor-error" role="alert">
                        {chat.error}
                    </p>
                )}
                {notice && (
                    <p className="tutor-notice" role="status">
                        {notice}
                    </p>
                )}
                <div className="tutor-actions">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                                setMessage(action.prompt);
                                input.current?.focus();
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
                <form className="tutor-compose" onSubmit={send}>
                    <div className="tutor-input-row">
                        <label className="tutor-sr-only" htmlFor="tutor-question">
                            Your question
                        </label>
                        <textarea
                            ref={input}
                            id="tutor-question"
                            value={message}
                            maxLength={4000}
                            rows={1}
                            disabled={chat.sending}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Ask a question about this lesson…"
                        />
                        <button
                            className="tutor-submit"
                            type="submit"
                            aria-label="Send question"
                            disabled={disabled || !message.trim()}
                        >
                            <ArrowUp size={20} aria-hidden="true" />
                        </button>
                    </div>
                    {chat.sending && (
                        <button
                            className="tutor-stop"
                            type="button"
                            onClick={() => chat.controller.stop()}
                        >
                            <Square size={12} aria-hidden="true" /> Stop response
                        </button>
                    )}
                    <details className="tutor-tools">
                        <summary>
                            Context &amp; tools{includeNotes ? ' · notes included' : ''}
                            {code ? ' · code attached' : ''}
                        </summary>
                        <div className="tutor-tools-content">
                            <div className="tutor-toolbar">
                                <button
                                    type="button"
                                    disabled={chat.loading || chat.sending}
                                    onClick={() => chat.controller.load()}
                                >
                                    <RotateCcw size={13} aria-hidden="true" /> Reload history
                                </button>
                                <button
                                    type="button"
                                    disabled={chat.loading || chat.sending || !chat.messages.length}
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                'Delete this section’s tutoring conversation?'
                                            )
                                        )
                                            void chat.controller.clear();
                                    }}
                                >
                                    <Trash2 size={13} aria-hidden="true" /> Clear conversation
                                </button>
                                {chat.limits && (
                                    <small>{chat.limits.remaining} daily requests remaining</small>
                                )}
                            </div>
                            <div className="tutor-toolbar">
                                {['Explain this concept', 'Quiz me on this section'].map(
                                    (action) => (
                                        <button
                                            key={action}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                setMessage(`${action} in this section.`);
                                                input.current?.focus();
                                            }}
                                        >
                                            {action}
                                        </button>
                                    )
                                )}
                                <button
                                    type="button"
                                    disabled={
                                        disabled ||
                                        !chat.messages.some((item) => item.role === 'assistant')
                                    }
                                    onClick={(event) =>
                                        send(
                                            event,
                                            'summary',
                                            'Summarise your last explanation as concise revision notes. Do not save anything automatically.'
                                        )
                                    }
                                >
                                    Generate revision summary
                                </button>
                            </div>
                            <details>
                                <summary>Share JavaScript for review (optional)</summary>
                                <label htmlFor="tutor-code">
                                    Only this explicitly shared code is sent
                                </label>
                                <textarea
                                    id="tutor-code"
                                    value={code}
                                    maxLength={8000}
                                    rows={5}
                                    disabled={chat.sending}
                                    onChange={(event) => setCode(event.target.value)}
                                    spellCheck={false}
                                />
                            </details>
                            <label className="tutor-optin">
                                <input
                                    type="checkbox"
                                    checked={includeNotes}
                                    disabled={chat.sending}
                                    onChange={(event) => setIncludeNotes(event.target.checked)}
                                />
                                Include saved notes for this section in this request (not unsaved
                                drafts)
                            </label>
                            <small>
                                Sending shares this section, a small progress summary, and recent
                                chat with the AI provider. Never paste passwords or secrets.
                            </small>
                        </div>
                    </details>
                    <p className="tutor-disclaimer">
                        AI can make mistakes. Check <a href={courseUrl}>your lesson</a>. Chat never
                        changes your progress.
                    </p>
                </form>
            </dialog>
        </>
    );
}
