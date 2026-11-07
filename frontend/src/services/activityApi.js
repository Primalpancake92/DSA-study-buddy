import { apiRequest } from './authApi.js';

export async function getActivity() {
    const result = await apiRequest('/api/activity');
    return result.activities || [];
}
