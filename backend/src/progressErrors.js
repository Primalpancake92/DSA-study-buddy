export function progressFailure(error, loading = false) {
    if (error.status && ['UNKNOWN_LESSON', 'AUTH_REQUIRED'].includes(error.code)) {
        return { status: error.status, code: error.code, message: error.message };
    }
    const outdated =
        ['42P01', '42703'].includes(error.code) ||
        (error.code === '23514' && error.constraint === 'user_progress_week_number_check');
    if (outdated) {
        return {
            status: 503,
            code: 'PROGRESS_SCHEMA_OUTDATED',
            message:
                'Progress storage needs a server update. Please contact support and try again later.'
        };
    }
    const unavailable = [
        '23514',
        'ENOENT',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        'EAI_AGAIN',
        '57P01'
    ].includes(error.code);
    return {
        status: unavailable ? 503 : 500,
        code: unavailable
            ? 'PROGRESS_UNAVAILABLE'
            : loading
              ? 'PROGRESS_LOAD_FAILED'
              : 'PROGRESS_SAVE_FAILED',
        message: loading
            ? 'Your saved progress could not be loaded. Please try again shortly.'
            : 'Your progress could not be saved. Please try again shortly.'
    };
}
