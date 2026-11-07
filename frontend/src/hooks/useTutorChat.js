import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createTutorChat } from '../services/tutorChat.js';
const disposalTimers = new WeakMap();

export function useTutorChat(userId, moduleId, sectionId, open) {
    const controller = useMemo(
        () => createTutorChat(moduleId, sectionId),
        [userId, moduleId, sectionId]
    );
    const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
    useEffect(() => {
        clearTimeout(disposalTimers.get(controller));
        return () => {
            disposalTimers.set(
                controller,
                setTimeout(() => controller.dispose(), 0)
            );
        };
    }, [controller]);
    useEffect(() => {
        if (open && !controller.getSnapshot().loaded) void controller.load();
    }, [controller, open]);
    return { ...state, controller };
}
