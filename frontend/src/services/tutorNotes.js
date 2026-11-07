import { maxNoteLength } from './sectionNotesStore.js';

export async function appendTutorNote(controller, content) {
    if (!controller.getSnapshot().loaded) await controller.load();
    const state = controller.getSnapshot();
    if (!state.loaded || state.loading || state.deleting || state.conflict || state.error) {
        throw new Error(
            'Open My Notes and resolve its loading or saving error before adding this explanation.'
        );
    }
    const next = `${state.content}${state.content ? '\n\n' : ''}AI-generated revision note — check against your lesson\n${content}`;
    if (next.length > maxNoteLength)
        throw new Error(
            'This explanation would exceed the notes limit. Copy a shorter excerpt instead.'
        );
    controller.edit(next);
    await controller.save();
    const saved = controller.getSnapshot();
    if (saved.error)
        throw new Error(
            'The explanation is in your notes draft, but saving failed. Retry in My Notes.'
        );
    return saved.dirty
        ? 'Added to your notes draft. Autosave is pending.'
        : 'Appended to your saved section notes.';
}
