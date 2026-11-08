import { apiRequest } from './authApi.js';
export const getPractice = (week) =>
    apiRequest(week === undefined ? '/api/practice' : `/api/practice?week=${week}`);
export const updatePractice = (id, data) =>
    apiRequest(`/api/practice/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });

export { filterPractice, recommendPractice } from './practiceModel.js';
