import { apiRequest } from './authApi.js';

const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export async function getCurriculumPreview() {
  if (!apiBase) throw new Error('The API URL is not configured for this deployment.');
  const response = await fetch(`${apiBase}/api/curriculum/preview`);
  if (!response.ok) throw new Error('Unable to load curriculum preview.');
  return response.json();
}

export const getProtectedCurriculum = () => apiRequest('/api/curriculum');
export const getProtectedLesson = (weekNumber) => apiRequest(`/api/curriculum/${weekNumber}`);
