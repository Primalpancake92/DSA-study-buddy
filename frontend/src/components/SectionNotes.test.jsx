import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionNotes } from './SectionNotes.jsx';
import { useSectionNotes } from '../hooks/useSectionNotes.js';

vi.mock('../hooks/useSectionNotes.js', () => ({ useSectionNotes: vi.fn() }));
vi.mock('react', async (importOriginal) => ({
    ...await importOriginal(),
    useState: () => [true, vi.fn()]
}));

let note;
beforeEach(() => {
    note = {
        content: '',
        savedContent: '',
        loaded: true,
        loading: false,
        exists: false,
        dirty: false,
        saving: false,
        deleting: false,
        error: '',
        recoveryAvailable: true,
        controller: {}
    };
    useSectionNotes.mockImplementation(() => note);
});
const render = () => renderToStaticMarkup(
    <SectionNotes moduleId={1} sectionId="arrays" anchor="arrays" title="Arrays" />
);
const status = () => render().match(/role="status" aria-live="polite">(.*?)<\/p>/s)[1];

describe('notes editor feedback', () => {
    it('derives the empty state from current text before autosave runs', () => {
        expect(status()).toBe('No saved note yet.');
        note = { ...note, content: 'a', dirty: true };
        expect(status()).toBe('Unsaved changes');
        expect(render()).not.toContain('No saved note yet.');
        note = { ...note, content: '', dirty: false };
        expect(status()).toBe('No saved note yet.');
        note = { ...note, content: '   ', dirty: true };
        expect(status()).toBe('No saved note yet.');
    });

    it('does not infer emptiness from dirty state or show it during loading', () => {
        note = { ...note, content: 'Current text', dirty: false };
        expect(render()).not.toContain('No saved note yet.');
        note = { ...note, content: '', loading: true, loaded: false };
        expect(status()).toBe('Loading…');
        expect(render()).not.toContain('No saved note yet.');
    });

    it('keeps save progress and errors separate from empty-state feedback', () => {
        note = { ...note, saving: true };
        expect(status()).toBe('Saving…');
        note = { ...note, saving: false, error: 'Unable to save. Please retry.' };
        expect(status()).toBe('Unable to save. Please retry.');
        expect(render()).toContain('Retry');
        expect(status()).not.toContain('Saved');
    });

    it('shows saved only for a saved note without newer edits', () => {
        note = { ...note, content: 'Saved note', savedContent: 'Saved note', exists: true };
        expect(status()).toBe('Saved');
        expect(render()).toContain('Saved note</textarea>');
        note = { ...note, content: '', dirty: true };
        expect(status()).toBe('Unsaved changes');
        expect(render()).not.toContain('No saved note yet.');
    });

    it('renders the current section snapshot and preserves the counter and live region', () => {
        note = { ...note, content: 'First', exists: true };
        expect(render()).toContain('First</textarea>');
        note = { ...note, content: 'Second' };
        expect(render()).toContain('Second</textarea>');
        expect(render()).not.toContain('First</textarea>');
        expect(render()).toContain('6 / 20,000');
        expect(render()).toContain('aria-live="polite"');
    });
});
