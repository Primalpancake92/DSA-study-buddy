# Arrays progress persistence

## Confirmed cause

Arrays is displayed as **Module 2**, but its permanent database/module ID is **17**. The existing curriculum split deliberately retained IDs 1–16 to avoid reassigning older progress. Its sections already have unique `w17-section-…` lesson IDs, used consistently by the client PATCH request and backend validator.

A read-only audit of the configured PostgreSQL database found migrations **001–006** only, and the constraint `user_progress_week_number_check` still required `week_number BETWEEN 1 AND 16`. Saving an Arrays section writes its `lesson_progress` row and updates its parent `user_progress` record in one transaction. The ID-17 parent update violates that old constraint, rolling back the section save too. Authentication, cookies, and the lesson identifier were not the demonstrated cause.

## Fix and deployment

- Applied the existing pending migrations **007–009** using the versioned migration runner. Migration 007 expands the constraint to 17, initializes the Arrays aggregate where missing, and copies only explicitly mapped legacy checkpoints without overwriting existing progress. Migrations 008–009 install the already-shipped notes/tutor tables. No new migration was necessary for this fix.
- Backend `npm start` now executes `npm run migrate` through its `prestart` lifecycle. The root `npm run server` delegates to that backend command, including the correct working directory. Render's existing backend-root `npm start` and Railway's `npm --prefix backend start` both run this lifecycle without new environment variables or changes to CORS, sessions or database providers.
- The runner checks `schema_migrations` and uses a transaction/advisory lock for each pending migration. Repeated starts do not reset progress. Migration failures stop startup instead of accepting requests against an outdated schema. The configured database role must have the required migration permissions. Any manually overridden platform start command must use `npm start`, not invoke the application JavaScript directly.
- Deploy the backend changes. If another environment uses a different database, apply its migrations there as well; applying migrations to the configured database does not prove all deployments share it.

## Saved state and recovery

The existing authenticated PATCH endpoint remains `/api/progress/lessons/:lessonId`, with `{ completed }` or `{ completed: false, startedOnly: true }`. It uses parameterized, user-scoped queries, a unique owner/lesson key, an owner-row lock, and a transaction. Only confirmed saves update the frontend cache. Repeated completion calls are idempotent and do not duplicate activity or completion counts.

The existing common `lessonModuleProgress` calculation counts unique completed section IDs and is used by the module, dashboard, catalog and roadmap. The same server snapshot drives next-lesson recommendations. There is no second Arrays-specific progress calculation.

Failures retain the last saved snapshot. The new **Retry save** action resubmits the exact failed section/status, blocks duplicate pending retries, and disappears after success. **Reload saved progress** still performs an uncached authenticated GET and clears stale errors only on success. Session expiry prompts sign-in, network and invalid-input errors are distinguished, and a missing migration now has the controlled `PROGRESS_SCHEMA_OUTDATED` code. Backend diagnostics include the sanitized constraint name but never SQL payloads, passwords or session values.

## Validation

`npm test` and `npm --prefix frontend test` include stable Arrays identity, shared progress/recommendation, failure retention, duplicate prevention, retry and startup migration regression checks.

The explicitly invoked `npm run test:progress:database` test exercises the **real PostgreSQL service queries** using two newly generated test accounts in an outer transaction. Service commits are translated into savepoint releases, and the outer transaction is always rolled back. It tests initial 0%, every Arrays section, fresh reads, duplicate completion, cross-user isolation, 100%, reopening, missing IDs, the next recommendation, and Module 1/old Module 2 compatibility. It does not log user data or send emails. Prefer a test database when replaying it. It is intentionally excluded from ordinary offline CI tests.

This is database/service verification, not a claim that browser logout/login or the deployed Render/Vercel cookie workflow has been tested. Browser fixtures from earlier UI checks are not evidence of live persistence. No database provider or deployment credential was changed.

### Executed results

- Versioned migration run: applied 007, 008 and 009 successfully.
- Live PostgreSQL integration: passed, including every Arrays reading lesson; temporary records rolled back.
- Root `npm test`: 22 test-file groups passed.
- Frontend `npm --prefix frontend test`: 56 tests passed across 9 files.
- `npm run build`: passed, including prerendering.
- Backend startup on temporary port 3002: reran migrations without reapplying them, then started successfully.
- Live local API probes: health returned 200 with a connected database; unauthenticated progress access returned 401. The temporary verification server was stopped afterward.
- JavaScript syntax checks and `git diff --check`: passed. There is no separate lint script in this repository.

### Changed files

- Startup lifecycle: `backend/package.json`, `package.json`.
- Safe error classification/logging: `backend/src/progressErrors.js`, `backend/src/app.js`, `backend/src/database.js`.
- Frontend retry and validation feedback: `frontend/src/services/progressStore.js`, `frontend/src/pages/LessonPage.jsx`.
- Regression tests: `frontend/src/services/progressStore.test.js`, `tests/progress-service.test.js`, `tests/progress-database.integration.mjs`.
- This report: `docs/arrays-progress-fix.md`.
