export async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) throw new Error(`Expected JSON from the API, received ${contentType || 'unknown content type'}. Check VITE_API_BASE_URL and the deployment configuration.`);
  const payload = await response.json();
  if (!response.ok) { const error = new Error(payload.error || `Request failed: ${response.status}`); error.fields = payload.fields; throw error; }
  return payload;
}
