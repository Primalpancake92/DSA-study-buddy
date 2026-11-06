import dns from 'node:dns/promises';
import crypto from 'node:crypto';
import { domainToASCII } from 'node:url';
import validator from 'validator';

const lookupTimeoutMs = 3000;

function withTimeout(promise, label) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => { const error = new Error(`${label} lookup timed out.`); error.code = 'DNS_TIMEOUT'; reject(error); }, lookupTimeoutMs); })]).finally(() => clearTimeout(timer));
}

export async function validateEmailAddress(input) {
  const email = typeof input === 'string' ? input.trim() : '';
  if (email.length > 254 || !validator.isEmail(email, { allow_utf8_local_part: true })) return { ok: false, code: 'INVALID_EMAIL', message: 'Enter a valid email address.' };
  const separator = email.lastIndexOf('@');
  const localPart = email.slice(0, separator);
  const domain = domainToASCII(email.slice(separator + 1).toLowerCase());
  if (!domain || domain.length > 253) return { ok: false, code: 'INVALID_EMAIL_DOMAIN', message: 'Enter a valid email domain.' };
  const normalizedEmail = `${localPart}@${domain}`;
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 'MX');
    if (mx.length > 0) return { ok: true, email: normalizedEmail, domain };
    const [a, aaaa] = await Promise.allSettled([withTimeout(dns.resolve4(domain), 'A'), withTimeout(dns.resolve6(domain), 'AAAA')]);
    if (a.status === 'fulfilled' || aaaa.status === 'fulfilled') return { ok: true, email: normalizedEmail, domain };
    return { ok: false, code: 'EMAIL_DOMAIN_NO_MAIL', message: 'That email domain cannot receive mail.' };
  } catch (error) {
    if (['DNS_TIMEOUT', 'EAI_AGAIN', 'SERVFAIL', 'ETIMEOUT'].includes(error.code)) { const temporary = new Error('Email domain validation is temporarily unavailable. Try again shortly.'); temporary.code = 'EMAIL_DNS_TEMPORARY'; throw temporary; }
    return { ok: false, code: 'EMAIL_DOMAIN_INVALID', message: 'That email domain cannot receive mail.' };
  }
}

export function createVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export async function sendVerificationEmail({ email, firstName, rawToken }) {
  const baseUrl = process.env.EMAIL_VERIFICATION_BASE_URL || 'http://localhost:5173/verify-email';
  const verificationUrl = `${baseUrl}?token=${encodeURIComponent(rawToken)}`;
  if (process.env.EMAIL_PROVIDER === 'resend') {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email provider is not configured.');
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: 'Verify your DSA Grind email', html: `<p>Hi ${firstName},</p><p>Verify your DSA Grind account:</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in ${process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60} minutes.</p>` }) });
    if (!response.ok) { const error = new Error('Email provider rejected the verification email.'); error.code = 'EMAIL_DELIVERY_FAILED'; throw error; }
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('EMAIL_PROVIDER=resend, RESEND_API_KEY and EMAIL_FROM are required in production.');
  console.info('[email:development] verification email queued', JSON.stringify({ email }));
}
