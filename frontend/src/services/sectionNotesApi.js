import { apiRequest } from './authApi.js';

const path = (moduleId, sectionId) =>
    `/api/section-notes/${moduleId}/${encodeURIComponent(sectionId)}`;

export const sectionNotesApi = {
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
