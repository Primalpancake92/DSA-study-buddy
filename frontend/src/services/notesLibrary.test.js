import { describe, expect, it } from 'vitest';
import { groupNotes, mergeNotes } from './notesLibrary.js';

const modules = [
    { id: 1, title: 'Foundations', sequence: 1 },
    { id: 17, title: 'Arrays', sequence: 2 },
    { id: 2, title: 'Hash Maps', sequence: 3 }
];
const notes = [
    { moduleId: 2, sectionId: 'hash', sectionTitle: 'Frequency', sectionOrder: 0, content: 'Map counts', exists: true, version: 1 },
    { moduleId: 17, sectionId: 'later', sectionTitle: 'Traversal', sectionOrder: 2, content: 'Linear scan', exists: true, version: 2, updatedAt: '2026-03-01', createdAt: '2026-01-01' },
    { moduleId: 17, sectionId: 'first', sectionTitle: 'Indexing', sectionOrder: 1, content: 'Constant time', exists: true, version: 1, updatedAt: '2026-02-01', createdAt: '2026-02-01' }
];
describe('notes library', () => {
    it('uses syllabus sequence rather than module IDs and original section order', () => {
        const groups = groupNotes(notes, modules);
        expect(groups.map((group) => group.id)).toEqual([17, 2]);
        expect(groups[0].notes.map((note) => note.sectionId)).toEqual(['first', 'later']);
        expect(groupNotes(notes, modules, { allModules: true }).map((group) => group.id)).toEqual([1, 17, 2]);
    });
    it('searches module titles, section titles and plain text without case or surrounding whitespace', () => {
        expect(groupNotes(notes, modules, { search: ' ARRays ' })[0].notes).toHaveLength(2);
        expect(groupNotes(notes, modules, { search: 'INDEXING' })[0].notes[0].sectionId).toBe('first');
        expect(groupNotes(notes, modules, { search: 'linear scan' })[0].notes[0].sectionId).toBe('later');
        expect(groupNotes(notes, modules, { search: 'missing', allModules: true })).toEqual([]);
        expect(groupNotes(notes, modules, { moduleId: '2' })).toHaveLength(1);
    });
    it('sorts update and creation times within syllabus groups', () => {
        for (const [sort, first] of [['updated-desc', 'later'], ['updated-asc', 'first'], ['newest', 'first'], ['oldest', 'later'], ['section', 'first']]) {
            expect(groupNotes(notes, modules, { sort })[0].notes[0].sectionId).toBe(first);
        }
    });
    it('overlays active edits and removes deleted notes without overwriting newer server data', () => {
        const draft = { ...notes[1], loaded: true, dirty: true, content: 'Fresh draft' };
        expect(mergeNotes(notes, [draft])[1].content).toBe('Fresh draft');
        expect(mergeNotes(notes, [{ ...draft, dirty: false, exists: false, version: 3 }])).toHaveLength(2);
        expect(mergeNotes(notes, [{ ...draft, dirty: false, version: 1 }])[1].content).toBe('Linear scan');
        expect(mergeNotes(notes, [{ ...draft, loaded: false, dirty: false }])).toEqual(notes);
    });
    it('preserves notes for missing modules and sections', () => {
        const groups = groupNotes([{ ...notes[0], moduleId: 99 }], modules);
        expect(groups[0].title).toContain('Unavailable module');
        expect(groups[0].notes).toHaveLength(1);
    });
});
