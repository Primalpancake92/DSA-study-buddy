# Account settings API

Mount `createSettingsRouter({ pool, requireAuth, csrfProtection })` at `/api/settings` after authentication middleware is available. This module also enforces `requireAuth`. Apply migration 006 through the normal deployment process before enabling routes. It creates only `user_settings`; migration 005 remains unchanged. No automatic migrations occur on import.

All responses use `Cache-Control: private, no-store`. Requests require an authenticated, verified account under the application's existing authentication policy. Mutations require the application's CSRF token (`X-CSRF-Token`). Invalid payloads return 400; authentication failures return 401, CSRF failures 403, rate limits 429, and unexpected errors a generic 500 without database or credential details.

## Preferences

`GET /api/settings/` returns `{ "settings": { ... } }`, merging validated stored fields with the portable `defaultSettings` exported by the shared defaults module and re-exported by the backend model. GET does not create a row.

`PATCH /api/settings/` accepts strict partial objects. Both unknown categories and unknown nested keys are rejected, as are null values, numeric strings, and invalid enums. Empty objects are accepted as no-ops. Each category is merged with current settings, preserving other fields and categories. Updates run in a transaction with an owner-row lock so simultaneous updates serialize even before the first settings row exists.

| Category | Fields and accepted values |
| --- | --- |
| learning | `dailyMinutes`: integer 15–240; `daysPerWeek`: integer 1–7; `difficulty`: beginner/intermediate/advanced/adaptive; `showHints`, `hideSolutions`, `stepByStep`, `revisionExercises`, `showEstimates`: boolean |
| notifications | `study`, `reviews`, `weeklySummary`, `moduleCompletion`: boolean |
| appearance | `theme`: dark/light/system |
| accessibility | `fontSize`: small/default/large/extra-large; `readingWidth`: narrow/comfortable/wide; `lineSpacing`: compact/comfortable/relaxed; `reducedMotion`, `enhancedContrast`: boolean |
| connections | `leetcode`, `hackerrank`: username, official HTTP(S) public profile URL, or empty string to disconnect |

Example: `{"learning":{"dailyMinutes":45},"appearance":{"theme":"dark"}}`.

Connections normalize to HTTPS public profile URLs: `https://leetcode.com/u/name/` and `https://www.hackerrank.com/profile/name`. HackerRank's legacy `/name` profile form is also accepted and canonicalized. Hosts, profile path structure, and username syntax are checked locally; credentials, query parameters, fragments, ports, and non-profile paths are rejected. No external API requests or external account ownership/existence verification occur. These are manual profile links: no platform passwords, tokens, scraping, or automatic progress synchronization.

## Sessions

`GET /api/settings/sessions` returns `{"sessions":[{"id":"<sha256 hex handle>","current":true,"expiresAt":"<timestamp>"}]}`. Handles are stable SHA-256 hashes of internal session IDs and cannot be used as session cookies. Raw session IDs and stored session objects are never returned.

`POST /api/settings/sessions/revoke-others` returns `{"count":2}`. It deletes only sessions whose stored `userId` matches the authenticated account, excluding the current session ID. This count can include expired rows pending pruning.

## Export

`GET /api/settings/export?format=json` downloads the account's explicitly selected safe profile fields, week and lesson progress, problem attempts, journals, review queue, mock interviews, practice state, and merged preferences. JSON is the default format. Sessions, password hashes, reset/verification tokens, and provider credentials are excluded. User-authored code, notes, and journal content are included as account data and may contain information the user entered themselves.

`GET /api/settings/export?format=csv` returns a JSON envelope `{ "csv": "..." }`; the frontend downloads the CSV through a Blob using the existing credentialed JSON client. CSV contains practice state only, including problem ID, status, attempts count, notes, attempt/solve/review timestamps, review stage, and update time. The header is present even for an empty account. Cells are quoted, embedded quotes doubled, and formula-like prefixes or leading control characters neutralized with an apostrophe for spreadsheet use. Unsupported formats return 400. Export reads use a repeatable-read, read-only transaction for a consistent snapshot; every data query is scoped to the session user ID.

## Delete account

`DELETE /api/settings/account` requires `{"password":"<current password>","confirmation":"DELETE MY ACCOUNT"}`. Unknown keys and incorrect confirmation are rejected. The existing password service verifies the re-entered password against the user row locked in the deletion transaction. On successful verification, all account sessions are deleted, then the user is deleted; existing foreign-key cascades remove user-owned rows, including preferences and practice state. No successful deletion occurs for invalid credentials.

Only after commit does the route destroy the request session. It waits for the destruction callback, clears `dsa.sid` with the request session's matching cookie options, and returns `{"ok":true}`. If session-store cleanup fails after commit, a generic 500 is returned although the account deletion has already committed; the endpoint does not claim success early.

Deletion concerns the application's active database. It does not immediately remove copies from database backups or data retained independently by infrastructure or email providers; those follow the operator's configured retention policies. Deleting this account does not delete linked LeetCode or HackerRank accounts. Export files already downloaded remain under the user's control.

Preference updates and session revocation share a limit of 20 mutations per 15 minutes per client IP. Account deletion allows five attempts per 15 minutes per client IP. These use the application's Express proxy configuration and process-local limiter stores; multi-instance deployments should provide an appropriate shared limiting strategy at the application or ingress layer.

## Tests

Run `node --test tests/settings-backend.test.js` after the shared defaults module is available. Tests use mocked pools and session callbacks only; they do not connect to PostgreSQL, apply migrations, call external profile APIs, or delete real accounts.
