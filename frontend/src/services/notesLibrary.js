export const noteKey = (note) => `${note.moduleId}:${note.sectionId}`;

export function mergeNotes(remote, cached) {
    const notes = new Map(remote.map((note) => [noteKey(note), note]));
    for (const local of cached) {
        if (!local.loaded && !local.dirty) continue;
        const key = noteKey(local);
        const previous = notes.get(key);
        if (!local.dirty && previous && previous.version > local.version) continue;
        if (!local.exists && !local.dirty) notes.delete(key);
        else notes.set(key, {
            sectionTitle: local.sectionId,
            sectionOrder: Number.MAX_SAFE_INTEGER,
            ...previous,
            ...local
        });
    }
    return [...notes.values()];
}

export function groupNotes(notes, modules, { search = '', moduleId = '', sort = 'module', allModules = false } = {}) {
    const query = search.trim().toLocaleLowerCase();
    const catalog = new Map(modules.map((module) => [module.id, module]));
    for (const note of notes) {
        if (!catalog.has(note.moduleId)) catalog.set(note.moduleId, {
            id: note.moduleId, title: `Unavailable module (${note.moduleId})`, sequence: Number.MAX_SAFE_INTEGER
        });
    }
    return [...catalog.values()]
        .sort((a, b) => a.sequence - b.sequence || a.id - b.id)
        .filter((module) => !moduleId || module.id === Number(moduleId))
        .map((module) => {
            const items = notes.filter((note) => note.moduleId === module.id && (!query ||
                `${module.title} ${note.sectionTitle} ${note.content}`.toLocaleLowerCase().includes(query)));
            items.sort((a, b) => {
                if (sort === 'updated-desc' || sort === 'updated-asc') {
                    const difference = (Date.parse(a.updatedAt) || 0) - (Date.parse(b.updatedAt) || 0);
                    if (difference) return sort === 'updated-desc' ? -difference : difference;
                }
                if (sort === 'newest' || sort === 'oldest') {
                    const difference = (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
                    if (difference) return sort === 'newest' ? -difference : difference;
                }
                return a.sectionOrder - b.sectionOrder || a.sectionId.localeCompare(b.sectionId);
            });
            return { ...module, notes: items };
        })
        .filter((module) => module.notes.length || (allModules && !query));
}
