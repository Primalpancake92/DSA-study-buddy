import { useId, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useSectionNotes } from '../hooks/useSectionNotes.js';
import {
    maxNoteLength,
    readNotesNotice,
    subscribeNotesNotice
} from '../services/sectionNotesStore.js';
import '../styles/section-notes.css';

export function SectionNotes({ moduleId, sectionId, anchor, title }) {
    const [open, setOpen] = useState(false);
    const panelId = useId();
    const editorId = useId();
    const statusId = useId();
    const note = useSectionNotes(moduleId, sectionId, anchor, open);
    const busy = note.loading || note.deleting;
    const showEmptyState =
        note.loaded && !note.loading && !note.exists && note.content.trim().length === 0;
    let status = note.loaded
        ? note.exists ? 'Saved' : ''
        : 'Notes have not been loaded yet.';
    if (note.dirty) status = showEmptyState ? '' : 'Unsaved changes';
    if (note.saving) status = 'Saving…';
    if (note.deleting) status = 'Deleting…';
    if (note.loading) status = 'Loading…';
    if (note.error) status = note.error;

    return (
        <div className="section-notes">
            <button
                type="button"
                className="section-notes-toggle"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((value) => !value)}
            >
                My Notes <span aria-hidden="true">{open ? '−' : '+'}</span>
                <span className="sr-only"> for {title}</span>
            </button>
            {open && (
                <div id={panelId} className="section-notes-panel">
                    <label htmlFor={editorId}>Personal notes for {title}</label>
                    <p>
                        Capture an idea, question, or example to revisit. Only you can see these
                        notes.
                    </p>
                    <textarea
                        id={editorId}
                        value={note.content}
                        onChange={(event) => note.controller.edit(event.target.value)}
                        disabled={busy || !note.loaded}
                        maxLength={maxNoteLength}
                        rows={7}
                        aria-describedby={statusId}
                        placeholder="Write your notes for this section…"
                    />
                    <div className="section-notes-feedback">
                        <p id={statusId} role="status" aria-live="polite">
                            {status || (showEmptyState ? 'No saved note yet.' : '')}
                        </p>
                        <small>
                            {note.content.length.toLocaleString()} /{' '}
                            {maxNoteLength.toLocaleString()}
                        </small>
                    </div>
                    {!note.recoveryAvailable && note.dirty && (
                        <p role="alert">
                            Your browser cannot keep a recovery draft. Keep this tab open until your
                            note is saved.
                        </p>
                    )}
                    <div className="section-notes-actions">
                        {note.conflict ? (
                            <>
                                <button
                                    type="button"
                                    disabled={busy || note.saving}
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                'Replace the saved note with your draft? Another tab may have edited it.'
                                            )
                                        ) {
                                            void note.controller.resolveConflict(true);
                                        }
                                    }}
                                >
                                    Save my version instead
                                </button>
                                <button
                                    type="button"
                                    disabled={busy || note.saving}
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                'Discard this draft and load the saved note?'
                                            )
                                        ) {
                                            void note.controller.resolveConflict(false);
                                        }
                                    }}
                                >
                                    Load saved version
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                disabled={
                                    busy ||
                                    note.saving ||
                                    (!note.dirty && note.loaded && !note.error)
                                }
                                onClick={() => void note.controller.retry()}
                            >
                                {note.error ? 'Retry' : 'Save now'}
                            </button>
                        )}
                        {(note.exists || note.content) && (
                            <button
                                type="button"
                                className="section-notes-delete"
                                disabled={busy || note.saving || !note.loaded}
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            'Delete the note and any unsaved draft for this section? This cannot be undone.'
                                        )
                                    ) {
                                        void note.controller.remove();
                                    }
                                }}
                            >
                                Delete note
                            </button>
                        )}
                    </div>
                    <small>
                        Autosaves after you pause typing. Notes do not change lesson completion.
                    </small>
                </div>
            )}
        </div>
    );
}

export function NotesSaveNotice() {
    const notice = useSyncExternalStore(subscribeNotesNotice, readNotesNotice, () => null);
    if (!notice) return null;
    return (
        <aside className="notes-save-notice" aria-label="Unsaved section notes">
            <p role="status">A section note is not saved. Your draft is retained in this tab.</p>
            <Link to={`/app/weeks/${notice.moduleId}#${notice.anchor}`}>
                Return to the section’s My Notes
            </Link>
        </aside>
    );
}
