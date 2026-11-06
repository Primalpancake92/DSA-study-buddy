import { parseApiResponse } from './parseApiResponse.js';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
const apiBase = (configuredApiBase ? configuredApiBase.replace(/\/+$/, '') : import.meta.env.DEV ? 'http://localhost:3001' : '');

let csrf;

function requireApiBase() {
  if (!apiBase) throw new Error('The production API URL is missing. Set VITE_API_BASE_URL in Vercel and redeploy the frontend.');
}

async function getCsrf() {
  requireApiBase();
  let response;
  try { response = await fetch(`${apiBase}/api/auth/csrf`, { credentials: 'include' }); } catch { throw new Error('The API is unreachable. Check the Render service URL.'); }
  const payload = await parseApiResponse(response);
  csrf = payload.csrfToken;
  return csrf;
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers['X-CSRF-Token'] = csrf || await getCsrf();
  requireApiBase();
  let response;
  try { response = await fetch(`${apiBase}${path}`, { ...options, method, headers, credentials: 'include' }); } catch { throw new Error('The API is unreachable. Check the Render service URL.'); }
  return parseApiResponse(response);
}

export const authApi = {
  me: () => apiRequest('/api/auth/me'),
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (token) => apiRequest('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: (email) => apiRequest('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  profile: () => apiRequest('/api/users/me'),
  updateProfile: (data) => apiRequest('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) })
};
