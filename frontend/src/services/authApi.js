const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

let csrf;

async function getCsrf() {
  const response = await fetch(`${apiBase}/api/auth/csrf`, { credentials: 'include' });
  const payload = await response.json();
  csrf = payload.csrfToken;
  return csrf;
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers['X-CSRF-Token'] = csrf || await getCsrf();
  const response = await fetch(`${apiBase}${path}`, { ...options, method, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(payload.error || 'Request failed.'); error.fields = payload.fields; throw error; }
  return payload;
}

export const authApi = {
  me: () => apiRequest('/api/auth/me'),
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  profile: () => apiRequest('/api/users/me'),
  updateProfile: (data) => apiRequest('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) })
};
