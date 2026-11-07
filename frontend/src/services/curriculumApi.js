import { apiRequest } from './authApi.js';

export async function getCurriculumPreview() {
    return apiRequest('/api/curriculum/preview');
}

export const getProtectedCurriculum = () => apiRequest('/api/curriculum');
export const getProtectedLesson = (weekNumber) => apiRequest(`/api/curriculum/${weekNumber}`);
