export function recoveryEmailError(value) {
    const email = typeof value === 'string' ? value.trim() : '';
    if (!email) {
        return 'No email was entered. Please enter your email address.';
    }
    const [local = '', domain = '', extra] = email.split('@');
    const labels = domain.split('.');
    if (
        email.length > 254 ||
        local.length > 64 ||
        extra !== undefined ||
        !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) ||
        local.startsWith('.') ||
        local.endsWith('.') ||
        local.includes('..') ||
        labels.length < 2 ||
        labels.some((label) => !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label))
    ) {
        return 'Invalid email address. Please enter a valid email.';
    }
    return '';
}
