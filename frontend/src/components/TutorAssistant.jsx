import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { useTutorChat } from '../hooks/useTutorChat.js';
import { getSectionNote } from '../services/sectionNotesStore.js';
import { appendTutorNote } from '../services/tutorNotes.js';
import { TutorMarkdown } from './TutorMarkdown.jsx';
import '../styles/tutor.css';

const actions = [
    'Explain this concept',
    'Give me a hint',
    'Walk me through an example',
    'Explain the time complexity',
    'Quiz me on this section'
];

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
            open={open}
            setOpen={setOpen}
        />
    );
}

function TutorPanel({ userId, moduleId, sectionId, anchor, title, moduleTitle, open, setOpen }) {
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
            <button
                ref={launcher}
                type="button"
                className="button tutor-launcher"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                {open ? 'Close AI tutor' : 'Ask AI tutor'}
            </button>
            <dialog
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
                        <small>
                            {moduleTitle} · {title}
                        </small>
                    </div>
                    <button
                        type="button"
                        aria-label="Close AI tutor"
                        onClick={() => setOpen(false)}
                    >
                        ×
                    </button>
                </header>
                <p className="tutor-disclaimer">
                    AI-generated explanations can be wrong. Check them against{' '}
                    <a href={courseUrl}>this section</a>. Your progress never changes through chat.
                </p>
                <div className="tutor-toolbar">
                    <button
                        type="button"
                        disabled={chat.loading || chat.sending}
                        onClick={() => chat.controller.load()}
                    >
                        Reload history
                    </button>
                    <button
                        type="button"
                        disabled={chat.loading || chat.sending || !chat.messages.length}
                        onClick={() => {
                            if (window.confirm('Delete this section’s tutoring conversation?'))
                                void chat.controller.clear();
                        }}
                    >
                        Clear conversation
                    </button>
                    {chat.limits && <small>{chat.limits.remaining} daily requests remaining</small>}
                </div>
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
                        <p>
                            Ask a question about {title}. Start with a hint, or explicitly request a
                            complete solution when you need one.
                        </p>
                    )}
                    {chat.messages.map((item) => (
                        <article key={item.id} className={`tutor-message tutor-${item.role}`}>
                            <strong>{item.role === 'assistant' ? 'AI tutor' : 'You'}</strong>
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
                        </article>
                    ))}
                    {chat.pendingQuestion && (
                        <article className="tutor-message">
                            <strong>You</strong>
                            <p>{chat.pendingQuestion}</p>
                        </article>
                    )}
                    {chat.partial && (
                        <article className="tutor-message">
                            <strong>
                                AI tutor — {chat.sending ? 'streaming' : 'unfinished; not saved'}
                            </strong>
                            <TutorMarkdown content={chat.partial} courseUrl={courseUrl} />
                        </article>
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
                    ))}
                    <button
                        type="button"
                        disabled={
                            disabled || !chat.messages.some((item) => item.role === 'assistant')
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
                <form className="tutor-compose" onSubmit={send}>
                    <label htmlFor="tutor-question">Your question</label>
                    <textarea
                        ref={input}
                        id="tutor-question"
                        value={message}
                        maxLength={4000}
                        rows={3}
                        disabled={chat.sending}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="What would you like to understand?"
                    />
                    <details>
                        <summary>Share JavaScript for review (optional)</summary>
                        <label htmlFor="tutor-code">Only this explicitly shared code is sent</label>
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
                        Include saved notes for this section in this request (not unsaved drafts)
                    </label>
                    <small>
                        Sending shares this section, a small progress summary, and recent chat with
                        the AI provider. Never paste passwords or secrets.
                    </small>
                    <div className="tutor-send">
                        <button
                            className="button"
                            type="submit"
                            disabled={disabled || !message.trim()}
                        >
                            Send
                        </button>
                        {chat.sending && (
                            <button type="button" onClick={() => chat.controller.stop()}>
                                Stop response
                            </button>
                        )}
                    </div>
                </form>
            </dialog>
        </>
    );
}
