import { parseApiResponse } from './parseApiResponse.js';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
const apiBase = configuredApiBase
    ? configuredApiBase.replace(/\/+$/, '')
    : import.meta.env.DEV
      ? 'http://localhost:3001'
      : '';
const API_REQUEST_TIMEOUT_MS = 10000;

let csrf;
export function clearAuthCache() {
    csrf = undefined;
}

function requireApiBase() {
    if (!apiBase)
        throw new Error(
            'The production API URL is missing. Set VITE_API_BASE_URL in Vercel and redeploy the frontend.'
        );
}

async function getCsrf() {
    requireApiBase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
    let response;
    try {
        response = await fetch(`${apiBase}/api/auth/csrf`, {
            credentials: 'include',
            signal: controller.signal
        });
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw Object.assign(new Error('The API request timed out. Please try again.'), {
                code: 'TIMEOUT'
            });
        }
        throw Object.assign(new Error('The API is unreachable. Check the Render service URL.'), {
            code: 'NETWORK_ERROR'
        });
    } finally {
        clearTimeout(timeout);
    }
    const payload = await parseApiResponse(response);
    csrf = payload.csrfToken;
    return csrf;
}

export async function apiRequest(path, options = {}) {
    const method = options.method || 'GET';
    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
    };
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
        headers['X-CSRF-Token'] = csrf || (await getCsrf());
    requireApiBase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
    let response;
    try {
        response = await fetch(`${apiBase}${path}`, {
            ...options,
            method,
            headers,
            credentials: 'include',
            signal: options.signal || controller.signal
        });
    } catch (error) {
        if (error?.name === 'AbortError' && !options.signal?.aborted) {
            throw Object.assign(new Error('The API request timed out. Please try again.'), {
                code: 'TIMEOUT'
            });
        }
        throw Object.assign(new Error('The API is unreachable. Check the Render service URL.'), {
            code: 'NETWORK_ERROR'
        });
    } finally {
        clearTimeout(timeout);
    }
    const payload = await parseApiResponse(response);
    if (payload.csrfToken) csrf = payload.csrfToken;
    return payload;
}

// Streaming mutations reuse the same backend URL, cookie and CSRF cache.
export async function apiStreamRequest(path, body, signal) {
    requireApiBase();
    const token = csrf || (await getCsrf());
    signal?.throwIfAborted();
    let response;
    try {
        response = await fetch(`${apiBase}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
                'X-CSRF-Token': token
            },
            body: JSON.stringify(body),
            signal
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        throw new Error('Unable to connect to the tutor. Check your connection and try again.');
    }
    if (!response.ok) await parseApiResponse(response);
    if (!response.headers.get('content-type')?.includes('text/event-stream')) {
        throw new Error(
            'The tutor returned an unexpected response. Please reload the conversation.'
        );
    }
    return response;
}

export const authApi = {
    me: () => apiRequest('/api/auth/me'),
    register: (data) =>
        apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: async () => {
        await getCsrf();
        const result = await apiRequest('/api/auth/logout', { method: 'POST' });
        csrf = undefined;
        return result;
    },
    forgotPassword: (email) =>
        apiRequest('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
    resetPassword: (data) =>
        apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    verifyEmail: (token) =>
        apiRequest('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
    resendVerification: (email) =>
        apiRequest('/api/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
    profile: () => apiRequest('/api/users/me'),
    updateProfile: (data) =>
        apiRequest('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data) =>
        apiRequest('/api/users/me/password', { method: 'POST', body: JSON.stringify(data) })
};
