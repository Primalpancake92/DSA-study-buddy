# Production verification email

1. Create a Resend account and add a domain you own under Domains. Publish the SPF and DKIM records Resend supplies and configure DMARC for that domain. Wait for Resend to report verification. The application cannot authorise a sender itself.
2. Generate a Resend API key with sending permission for that domain. The Render blueprint declares the key and sender as required manual values (`sync: false`); do not put either value in source control.
3. In Render → backend service → Environment, set `NODE_ENV=production`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` (secret), `EMAIL_FROM=DSA Grind <verify@YOUR-VERIFIED-DOMAIN>`, `EMAIL_VERIFICATION_BASE_URL=https://dsa-study-buddy.vercel.app/verify-email`, and `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60`. Replace the sender with your actual verified address. Preserve database, session, CORS and TLS settings.
4. Redeploy Render. Missing required email configuration now stops startup with the variable name, never its value. Apply existing migrations with `npm run migrate` against the configured database; this change adds no migration. Email verification and activity tables from migrations 003 and 004 must exist.
5. Vercel needs only its existing public API base URL; never put the Resend key or database credentials there. Existing SPA rewrites must allow direct `/verify-email` and `/check-your-email` navigation.
6. Register a dedicated test account through the frontend. Check the actual inbox and spam folder, open the link, verify, then sign in. Confirm unverified login fails and the consumed link cannot be replayed. This is a manual production check, not established by mocked tests.

Render logs record email failure category and provider HTTP status, not provider response bodies or links. Inspect Resend delivery logs for sender-domain errors, restrictions, quota and delivery results. HTTP 503 `EMAIL_DELIVERY_FAILED` means delivery was not confirmed; a timeout can occur even if the provider accepted the email.

Account and hashed token are committed before sending. On failure the unverified account remains; use resend after the existing 60-second cooldown rather than registering again. Resend rotates the prior token and also commits before sending. No raw tokens are stored in PostgreSQL. This is a user-retry design, not an automatic outbox: process failure between commit and send requires resend. A successful API send means provider acceptance, not inbox delivery.

Local development uses `EMAIL_PROVIDER=development`, a no-send transport. Automated tests inject mocked fetch calls and must not use real credentials or send emails.
