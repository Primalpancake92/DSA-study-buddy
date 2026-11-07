import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider.jsx';
import { SectionNotes } from '../components/SectionNotes.jsx';
import { sectionNotesApi } from '../services/sectionNotesApi.js';
import {
    cachedSectionNotes,
    flushSectionNotes,
    readNotesRevision,
    refreshCachedSectionNotes,
    subscribeNotesNotice
} from '../services/sectionNotesStore.js';
import { groupNotes, mergeNotes, noteKey } from '../services/notesLibrary.js';
import '../styles/notes-library.css';

function updatedLabel(value) {
    return value ? new Date(value).toLocaleString() : 'Not saved yet';
}

export function NotesPage() {
    const { user } = useAuth();
    const [result, setResult] = useState({ notes: [], modules: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [search, setSearch] = useState('');
    const [moduleId, setModuleId] = useState('');
    const [sort, setSort] = useState('module');
    const [allModules, setAllModules] = useState(false);
    const [collapsed, setCollapsed] = useState(new Set());
    const [selected, setSelected] = useState(null);
    const editorHeading = useRef(null);
    useSyncExternalStore(subscribeNotesNotice, readNotesRevision, readNotesRevision);

    useEffect(() => {
        let current = true;
        async function load() {
            setLoading(true);
            setError('');
            try {
                await flushSectionNotes();
                const notes = [];
                let cursor;
                let page;
                do {
                    page = await sectionNotesApi.list(cursor);
                    if (!current) return;
                    notes.push(...page.notes);
                    cursor = page.nextCursor;
                } while (cursor);
                await refreshCachedSectionNotes(user.id, notes);
                if (current) setResult({ notes, modules: page.modules });
            } catch (reason) {
                if (current) setError(reason.message || 'Unable to load your notes. Please retry.');
            } finally {
                if (current) setLoading(false);
            }
        }
        void load();
        return () => { current = false; };
    }, [user.id, reload]);

    useEffect(() => {
        const refresh = () => setReload((value) => value + 1);
        window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, []);

    useEffect(() => {
        if (selected) editorHeading.current?.focus();
    }, [selected]);

    const notes = mergeNotes(result.notes, cachedSectionNotes(user.id));
    const groups = groupNotes(notes, result.modules, { search, moduleId, sort, allModules });
    const active = notes.find((note) => noteKey(note) === selected);
    const saved = notes.filter((note) => note.exists);
    const clearFilters = () => { setSearch(''); setModuleId(''); };
    const toggle = (id) => setCollapsed((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });

    return (
        <div className="page notes-library">
            <header className="notes-library-heading">
                <div className="eyebrow">YOUR LEARNING</div>
                <h1>My Notes</h1>
                <p>Your personal knowledge library, organised by learning module.</p>
                {!loading && !error && <p className="notes-library-count">
                    {saved.length} saved {saved.length === 1 ? 'note' : 'notes'} ·{' '}
                    {new Set(saved.map((note) => note.moduleId)).size} modules with notes
                </p>}
            </header>
            {loading && <p role="status">Loading your notes…</p>}
            {error && <div className="notes-library-state" role="alert">
                <p>{error}</p>
                <button type="button" className="button dark" onClick={() => setReload((value) => value + 1)}>
                    Retry loading notes
                </button>
            </div>}
            {((!loading && !error) || result.modules.length > 0) && <>
                <div className="notes-library-filters" role="search" aria-label="Search your notes">
                    <label>Search notes
                        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search modules, sections, or note content" />
                    </label>
                    <label>Learning module
                        <select value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
                            <option value="">All modules</option>
                            {result.modules.map((module) => <option key={module.id} value={module.id}>
                                {String(module.sequence).padStart(2, '0')} — {module.title}
                            </option>)}
                        </select>
                    </label>
                    <label>Sort notes within modules
                        <select value={sort} onChange={(event) => setSort(event.target.value)}>
                            <option value="module">Module order</option>
                            <option value="section">Section order</option>
                            <option value="updated-desc">Last updated — newest first</option>
                            <option value="updated-asc">Last updated — oldest first</option>
                            <option value="newest">Created — newest first</option>
                            <option value="oldest">Created — oldest first</option>
                        </select>
                    </label>
                    <label className="notes-library-checkbox">
                        <input type="checkbox" checked={allModules} onChange={(event) => setAllModules(event.target.checked)} />
                        Show modules without notes
                    </label>
                </div>
                {!loading && !error && !notes.length && <div className="notes-library-state">
                    <p>You haven't written any notes yet. Open a learning module to start capturing what you've learned.</p>
                    <Link className="button primary" to="/app/modules">Explore modules</Link>
                </div>}
                {!loading && !error && notes.length > 0 && groups.length === 0 && <div className="notes-library-state" role="status">
                    <p>No notes match your search.</p>
                    <button type="button" className="button dark" onClick={clearFilters}>Clear search and filters</button>
                </div>}
                <div className={`notes-library-layout${active ? ' has-editor' : ''}`}>
                    <div className="notes-library-groups">
                        {groups.map((module) => <section className="notes-module" key={module.id}>
                            <h2>
                                <button type="button" aria-expanded={!collapsed.has(module.id)}
                                    aria-controls={`notes-module-${module.id}`} onClick={() => toggle(module.id)}>
                                    <span><small>MODULE {String(module.sequence === Number.MAX_SAFE_INTEGER ? module.id : module.sequence).padStart(2, '0')}</small>
                                        {module.title}<small>{module.notes.length} sections with notes</small></span>
                                    <span aria-hidden="true">{collapsed.has(module.id) ? '+' : '−'}</span>
                                </button>
                            </h2>
                            <div id={`notes-module-${module.id}`} hidden={collapsed.has(module.id)}>
                                {!module.notes.length && <p className="notes-module-empty">No saved notes in this module.</p>}
                                <ul>
                                    {module.notes.map((note) => <li key={noteKey(note)}>
                                        <button type="button" className="notes-entry" aria-pressed={selected === noteKey(note)}
                                            onClick={() => setSelected(noteKey(note))}>
                                            <strong>{note.sectionTitle}</strong>
                                            <span className="notes-preview">{note.content.trim().slice(0, 180) || 'Empty note'}{note.content.trim().length > 180 ? '…' : ''}</span>
                                            <small>{note.dirty ? 'Unsaved changes' : `Updated ${updatedLabel(note.updatedAt)}`}</small>
                                            <span className="notes-entry-action">Open / edit note →</span>
                                        </button>
                                        {note.anchor && <Link className="notes-section-link" to={`/app/weeks/${note.moduleId}#${note.anchor}`}>Go to learning section ↗</Link>}
                                    </li>)}
                                </ul>
                            </div>
                        </section>)}
                    </div>
                    {active && <section className="notes-library-editor" aria-label="Note editor">
                        <div className="notes-editor-heading">
                            <h2 ref={editorHeading} tabIndex={-1}>{active.sectionTitle}</h2>
                            <button type="button" className="button dark" onClick={() => setSelected(null)}>Close editor</button>
                        </div>
                        <p>{result.modules.find((module) => module.id === active.moduleId)?.title || 'Unavailable module'}</p>
                        {active.anchor
                            ? <Link to={`/app/weeks/${active.moduleId}#${active.anchor}`}>Go to learning section ↗</Link>
                            : <p>This section is no longer in the syllabus. Your note is still available to edit or delete.</p>}
                        <SectionNotes key={selected} moduleId={active.moduleId} sectionId={active.sectionId}
                            anchor={active.anchor || ''} title={active.sectionTitle} embedded />
                    </section>}
                </div>
            </>}
        </div>
    );
}
