import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createVerificationToken,
    validateEmailAddress,
    validateEmailConfiguration,
    sendVerificationEmail
} from '../backend/src/emailService.js';

const production = {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 'test-secret',
    EMAIL_FROM: 'DSA <verify@example.com>',
    EMAIL_VERIFICATION_BASE_URL: 'https://example.com/verify-email'
};
test('production configuration fails clearly without leaking secrets', () => {
    for (const name of [
        'EMAIL_PROVIDER',
        'RESEND_API_KEY',
        'EMAIL_FROM',
        'EMAIL_VERIFICATION_BASE_URL'
    ]) {
        assert.throws(
            () => validateEmailConfiguration({ ...production, [name]: '' }),
            new RegExp(name)
        );
    }
    assert.throws(
        () =>
            validateEmailConfiguration({
                ...production,
                EMAIL_VERIFICATION_BASE_URL: 'http://example.com'
            }),
        /HTTPS/
    );
    assert.doesNotThrow(() => validateEmailConfiguration(production));
    assert.doesNotThrow(() => validateEmailConfiguration({ NODE_ENV: 'development' }));
});

test('Resend delivery uses authorization, escaped HTML, URL token and bounded request', async () => {
    let calls = 0;
    await sendVerificationEmail(
        { email: 'learner@example.com', firstName: '<script>', rawToken: 'token-value' },
        {
            env: production,
            fetchImpl: async (url, options) => {
                calls++;
                assert.equal(url, 'https://api.resend.com/emails');
                assert.equal(options.headers.Authorization, 'Bearer test-secret');
                assert.ok(options.signal instanceof AbortSignal);
                const body = JSON.parse(options.body);
                assert.ok(body.html.includes('&lt;script&gt;'));
                assert.ok(body.text.includes('https://example.com/verify-email?token=token-value'));
                return { ok: true };
            }
        }
    );
    assert.equal(calls, 1);
});

test('provider rejection includes safe diagnostics without exposing response bodies', async () => {
    await assert.rejects(
        sendVerificationEmail(
            { email: 'learner@example.com', firstName: 'Test', rawToken: 'secret-token' },
            { env: production, fetchImpl: async () => ({ ok: false, status: 403 }) }
        ),
        (error) => {
            assert.equal(error.code, 'EMAIL_DELIVERY_FAILED');
            assert.equal(error.emailCategory, 'provider-rejection');
            assert.equal(error.providerStatus, 403);
            assert.equal(error.retryable, false);
            return true;
        }
    );
});

test('network failure and timeout become retryable delivery failures', async () => {
    for (const fetchImpl of [
        async () => {
            throw new TypeError('network');
        },
        async () => {
            throw new DOMException('timeout', 'TimeoutError');
        }
    ]) {
        await assert.rejects(
            sendVerificationEmail(
                { email: 'learner@example.com', firstName: 'Test', rawToken: 'secret-token' },
                { env: production, fetchImpl }
            ),
            (error) => {
                assert.equal(error.code, 'EMAIL_DELIVERY_FAILED');
                assert.equal(error.retryable, true);
                return true;
            }
        );
    }
});

test('development transport never calls external email services', async () => {
    await sendVerificationEmail(
        { email: 'learner@example.com', firstName: 'Test', rawToken: 'secret' },
        {
            env: { NODE_ENV: 'development' },
            fetchImpl: () => {
                throw new Error('must not send');
            }
        }
    );
});

test('verification tokens are cryptographically random and stored as hashes', () => {
    const first = createVerificationToken();
    const second = createVerificationToken();
    assert.equal(first.rawToken.length, 64);
    assert.equal(first.tokenHash.length, 64);
    assert.notEqual(first.rawToken, first.tokenHash);
    assert.notEqual(first.rawToken, second.rawToken);
});

test('email syntax validation rejects malformed addresses before DNS lookup', async () => {
    const result = await validateEmailAddress('not-an-email');
    assert.deepEqual(result, {
        ok: false,
        code: 'INVALID_EMAIL',
        message: 'Enter a valid email address.'
    });
});
