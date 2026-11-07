export async function parseApiResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json'))
        throw new Error(
            `Expected JSON from the API, received ${contentType || 'unknown content type'}. Check VITE_API_BASE_URL and the deployment configuration.`
        );
    const payload = await response.json();
    if (!response.ok) {
        const apiError =
            typeof payload.error === 'object'
                ? payload.error
                : { code: undefined, message: payload.error };
        const error = new Error(apiError.message || `Request failed: ${response.status}`);
        error.code = apiError.code;
        error.fields = payload.fields;
        throw error;
    }
    return payload;
}
