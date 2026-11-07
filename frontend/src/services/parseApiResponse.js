export async function parseApiResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
        throw Object.assign(
            new Error(
                `Expected JSON from the API, received ${contentType || 'unknown content type'}. Check VITE_API_BASE_URL and the deployment configuration.`
            ),
            { code: 'INVALID_RESPONSE', status: response.status }
        );
    }
    let payload;
    try {
        payload = await response.json();
    } catch {
        throw Object.assign(new Error('The API returned an invalid response. Please try again.'), {
            code: 'INVALID_RESPONSE',
            status: response.status
        });
    }
    if (!payload || typeof payload !== 'object') {
        throw Object.assign(new Error('The API returned an invalid response. Please try again.'), {
            code: 'INVALID_RESPONSE',
            status: response.status
        });
    }
    if (!response.ok) {
        const apiError =
            payload.error && typeof payload.error === 'object'
                ? payload.error
                : { code: undefined, message: payload.error };
        const error = new Error(apiError.message || `Request failed: ${response.status}`);
        error.code = apiError.code;
        error.status = response.status;
        error.fields = payload.fields;
        throw error;
    }
    return payload;
}
