import dns from 'node:dns/promises';
import crypto from 'node:crypto';
import { domainToASCII } from 'node:url';
import validator from 'validator';

const lookupTimeoutMs = 3000;
const deliveryTimeoutMs = 10000;

async function withTimeout(promise, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const error = new Error(`${label} lookup timed out.`);
            error.code = 'DNS_TIMEOUT';
            reject(error);
        }, lookupTimeoutMs);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

export async function validateEmailAddress(input) {
    const email = typeof input === 'string' ? input.trim() : '';
    if (email.length > 254 || !validator.isEmail(email, { allow_utf8_local_part: true }))
        return { ok: false, code: 'INVALID_EMAIL', message: 'Enter a valid email address.' };
    const separator = email.lastIndexOf('@');
    const localPart = email.slice(0, separator);
    const domain = domainToASCII(email.slice(separator + 1).toLowerCase());
    if (!domain || domain.length > 253)
        return { ok: false, code: 'INVALID_EMAIL_DOMAIN', message: 'Enter a valid email domain.' };
    const normalizedEmail = `${localPart}@${domain}`;
    try {
        const mx = await withTimeout(dns.resolveMx(domain), 'MX');
        if (mx.length > 0) return { ok: true, email: normalizedEmail, domain };
        const [a, aaaa] = await Promise.allSettled([
            withTimeout(dns.resolve4(domain), 'A'),
            withTimeout(dns.resolve6(domain), 'AAAA')
        ]);
        if (a.status === 'fulfilled' || aaaa.status === 'fulfilled')
            return { ok: true, email: normalizedEmail, domain };
        return {
            ok: false,
            code: 'EMAIL_DOMAIN_NO_MAIL',
            message: 'That email domain cannot receive mail.'
        };
    } catch (error) {
        if (['DNS_TIMEOUT', 'EAI_AGAIN', 'SERVFAIL', 'ETIMEOUT'].includes(error.code)) {
            const temporary = new Error(
                'Email domain validation is temporarily unavailable. Try again shortly.'
            );
            temporary.code = 'EMAIL_DNS_TEMPORARY';
            throw temporary;
        }
        return {
            ok: false,
            code: 'EMAIL_DOMAIN_INVALID',
            message: 'That email domain cannot receive mail.'
        };
    }
}

export function createVerificationToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
}

export function validateEmailConfiguration(env = process.env) {
    if (env.NODE_ENV !== 'production' && env.EMAIL_PROVIDER !== 'resend') return;
    if (env.EMAIL_PROVIDER !== 'resend')
        throw new Error('EMAIL_PROVIDER must equal resend in production.');
    for (const name of ['RESEND_API_KEY', 'EMAIL_FROM', 'EMAIL_VERIFICATION_BASE_URL']) {
        if (!env[name]?.trim()) throw new Error(`${name} is required for Resend email delivery.`);
    }
    let url;
    try {
        url = new URL(env.EMAIL_VERIFICATION_BASE_URL);
    } catch {
        throw new Error('EMAIL_VERIFICATION_BASE_URL must be a valid HTTPS URL.');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search)
        throw new Error(
            'EMAIL_VERIFICATION_BASE_URL must be an HTTPS URL without credentials, query or fragment.'
        );
}

export async function sendVerificationEmail(
    { email, firstName, rawToken },
    { env = process.env, fetchImpl = fetch, correlationId = 'unknown' } = {}
) {
    const startedAt = performance.now();
    try {
        validateEmailConfiguration(env);
        if (env.EMAIL_PROVIDER !== 'resend') return; // Development transport intentionally never sends or logs tokens.
        const url = new URL(env.EMAIL_VERIFICATION_BASE_URL);
        url.searchParams.set('token', rawToken);
        const escape = (value) =>
            String(value).replace(
                /[&<>"']/g,
                (character) =>
                    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
                        character
                    ]
            );
        const response = await fetchImpl('https://api.resend.com/emails', {
            method: 'POST',
            signal: AbortSignal.timeout(deliveryTimeoutMs),
            headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: env.EMAIL_FROM,
                to: [email],
                subject: 'Verify your DSA Grind email',
                html: `<p>Hi ${escape(firstName)},</p><p><a href="${escape(url.href)}">Verify my email</a></p><p>This link expires in ${escape(env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60)} minutes.</p>`,
                text: `Verify your DSA Grind account: ${url.href}`
            })
        });
        if (!response.ok) {
            const retryable = response.status === 429 || response.status >= 500;
            throw createDeliveryError(
                retryable ? 'provider-temporary-failure' : 'provider-rejection',
                response.status,
                retryable
            );
        }
    } catch (cause) {
        const error =
            cause.code === 'EMAIL_DELIVERY_FAILED'
                ? cause
                : createDeliveryError(
                      ['TimeoutError', 'AbortError'].includes(cause.name)
                          ? 'timeout'
                          : cause.code === 'ERR_INVALID_ARG_TYPE' ||
                              cause.code === 'ENOTFOUND' ||
                              cause.code === 'ECONNRESET' ||
                              cause.code === 'ECONNREFUSED'
                            ? 'network-failure'
                            : 'delivery-failure',
                      cause.status,
                      true
                  );
        console.error(
            '[email]',
            JSON.stringify({
                provider: env.EMAIL_PROVIDER || 'unconfigured',
                category: error.emailCategory,
                status: error.providerStatus,
                correlationId,
                durationMs: Math.round(performance.now() - startedAt),
                retryable: error.retryable
            })
        );
        throw error;
    }
}

function createDeliveryError(category, providerStatus, retryable) {
    const error = new Error(
        'We could not send your verification email. Please try again shortly.'
    );
    error.code = 'EMAIL_DELIVERY_FAILED';
    error.emailCategory = category;
    error.providerStatus = providerStatus;
    error.retryable = retryable;
    return error;
}
