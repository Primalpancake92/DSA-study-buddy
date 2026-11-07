import { apiRequest } from './authApi.js';

const path = (moduleId, sectionId) =>
    `/api/section-notes/${moduleId}/${encodeURIComponent(sectionId)}`;

export const sectionNotesApi = {
    list: (cursor) => {
        const query = new URLSearchParams({ limit: '100' });
        if (cursor) {
            query.set('afterModule', cursor.moduleId);
            query.set('afterSection', cursor.sectionId);
        }
        return apiRequest(`/api/section-notes?${query}`, { cache: 'no-store' });
    },
    get: (moduleId, sectionId) => apiRequest(path(moduleId, sectionId), { cache: 'no-store' }),
    put: (moduleId, sectionId, content, version) =>
        apiRequest(path(moduleId, sectionId), {
            method: 'PUT',
            body: JSON.stringify({ content, version })
        }),
    remove: (moduleId, sectionId, version) =>
        apiRequest(path(moduleId, sectionId), {
            method: 'DELETE',
            body: JSON.stringify({ version })
        })
};
