import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '../components/AuthProvider.jsx';
import { getSectionNote } from '../services/sectionNotesStore.js';

export function useSectionNotes(moduleId, sectionId, anchor, open) {
    const { user } = useAuth();
    const controller = useMemo(
        () => getSectionNote(user.id, moduleId, sectionId, anchor),
        [user.id, moduleId, sectionId, anchor]
    );
    const state = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot
    );
    useEffect(() => {
        if (open && !controller.getSnapshot().loaded) void controller.load();
    }, [controller, open]);
    useEffect(
        () => () => {
            // Flush on SPA navigation; controller and recovery draft outlive this view.
            if (controller.getSnapshot().dirty) void controller.save();
        },
        [controller]
    );
    return { ...state, controller };
}
