# AI tutor backend

Apply `backend/migrations/009_ai_tutor.sql` through the existing migration runner before enabling the provider. This implementation was validated with mocks only; no migration or real AI request was run.

All `/api/tutor/:moduleId/:sectionId` operations require the existing verified account authentication. POST and DELETE also require the session CSRF token. Section IDs use the same stable lesson identity validation as section notes.

- GET returns `{ conversation, messages, enabled, limits: { daily, remaining } }`; an empty section has a null conversation and empty messages. History is the latest 20 messages in chronological order.
- POST accepts only `{ message, code?, includeNotes?, mode?, requestId }`. Message is nonblank and at most 4000 characters, code at most 8000, includeNotes a boolean, mode `tutor` or `summary`, and requestId a UUID. A successful stream sends SSE `data:` JSON events `{ type: "delta", text }` followed by `{ type: "done", messages, conversation }`. A stream failure sends `{ type: "error", message, code }`. Errors before streaming use a generic JSON error and HTTP status.
- DELETE returns `{ conversation: null, messages: [] }`. Any active user lease produces HTTP 409, preventing a late stream from recreating deleted history.

`createTutorRouter` accepts injected `streamTutor`, `buildInput`, and `enabled` functions (plus a store seam for isolated tests). Default adapters load `tutorProvider.js` and `tutorContext.js` lazily. Provider input is produced with the authenticated user, validated section, current message/code/options, pool and last 20 history messages. The provider receives `{ input, signal }`; client disconnection aborts that signal. The provider owns its 60-second timeout. The backend caps assistant output at 64000 characters.

`TUTOR_DAILY_REQUEST_LIMIT` defaults to 30; an integer from 0 to 200 overrides it, including zero to deny requests. Quota uses UTC dates and counts admitted attempts, including failed streams. Reservations serialize through a short owner-row transaction, acquire one 90-second database lease per user and record the request UUID before any provider work. Repeated admitted UUIDs return 409 even after failure or conversation deletion. Content-free UUID tombstones remain until account deletion; do not reuse request IDs. Busy/quota-rejected attempts roll back admission and do not consume IDs or quota. Lease release checks both owner and token; expired or replaced leases cannot persist answers.

Only a fully completed user/assistant pair is saved in one transaction. User history contains the submitted message and explicitly shared code. Automatically assembled lesson context, notes and settings are never copied into user history. A completed assistant response may refer to context it was given. No provider input, message text, credentials or raw errors are logged by these modules.

Lazy owner-only cleanup removes conversations inactive for `TUTOR_RETENTION_DAYS` (default 30, allowed 1–90 days), caps conversations at 100 and retains at most 40 messages per conversation. Cleanup runs on tutor access, not on a scheduled job: inactive accounts can retain expired records until their next access or account deletion. GET exposes only the latest 20. Account export includes tutor conversations and messages, and user foreign keys cascade on account deletion. Quota and lease metadata are not part of the content export.

Run the isolated checks with `node --test tests/tutor-backend.test.js`. These use fake stores and SQL clients, with no live database or AI calls.

## Deployment and API configuration

1. Install backend dependencies with `npm --prefix backend ci` (adds the official `openai` SDK). No frontend AI SDK or secret is required.
2. Back up the database and run the existing `npm run migrate` deployment step. This applies the pending section-notes migration **008** and tutor migration **009**. The tutor adds five user-scoped tables; it does not modify lesson progress, sessions or passwords. New tables and indexes use `IF NOT EXISTS`; the existing migration runner records applied versions.
3. Create a project API key in the OpenAI API platform, configure project spending controls, and store it as `OPENAI_API_KEY` in **Render only**. Never use a `VITE_` prefix, put it in Vercel, or commit a real key.
4. Set `OPENAI_MODEL` to a Responses-compatible text model available to that project (the example is `gpt-4.1-mini`). Set `AI_TUTOR_ENABLED=true` only after migrations and credentials are ready. With the flag off, other application features continue working and the panel explains that tutoring is unavailable.
5. Optional Render limits: `TUTOR_DAILY_REQUEST_LIMIT=30`, `TUTOR_RETENTION_DAYS=30`, `TUTOR_MAX_INPUT_TOKENS=8000` (1000–16000), `TUTOR_MAX_OUTPUT_TOKENS=1200` (128–2000). Invalid values fall back to conservative defaults. Generation uses a 60-second timeout and zero automatic retries. Actual provider token counting precedes inference and fails closed when unavailable or over budget. Count admitted attempts, not successful answers, when estimating user quota.
6. Redeploy backend and frontend. Existing `VITE_API_BASE_URL`, authentication, CORS and cookies are unchanged. Ensure any reverse proxy allows SSE without buffering. Test authenticated GET/POST/DELETE, cancellation, reload, opt-in notes, and logout against the deployed application. No live deployment or provider request was verified during implementation.

Provider references: [Responses streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [input token counting](https://developers.openai.com/api/docs/guides/token-counting), [example model](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

## Learning interface and privacy

The lesson page exposes **Ask AI tutor**. On desktop it opens a nonmodal right panel and reserves reading space; on smaller screens it is a native modal dialog with focus management and Escape dismissal. Quick actions populate a question without charging for a request. A revision-summary action makes an explicit model request; appending any completed response to My Notes separately requires confirmation and preserves existing content and unsaved edits. The existing notes controller handles autosave conflicts and retries.

Each current section uses its existing stable lesson ID. Changing section switches conversations and cancels the previous response. Only the current section (up to 6000 characters), objectives (1500), a current-module completion summary and up to eight recent messages (8000 characters combined) are considered. Explicitly shared code is limited to 8000 characters. Saved current-section notes (2000 characters maximum) are included **only** when the request checkbox is selected; unsaved drafts and other sections' notes are never automatically sent. Consent resets after a request and when section changes. Small excerpts may omit relevant material; ask a narrower question or explicitly share relevant code.

Responses use safe React Markdown with raw HTML/images disabled, no model-supplied external links, simple JavaScript syntax highlighting, and copy-code controls. User code is rendered as plain text and is never executed. The tutor cannot change completion status or recommendations. Course links are restricted to the real current-section reference.

System instructions and data separation reduce prompt-injection risk but do not guarantee that model output is correct or immune to manipulation. No tools, code execution, cross-user lookup or autonomous note/progress writes are exposed. Provider-side retention policies still apply even with `store:false`; do not submit secrets. Generated replies may reflect opted-in notes and remain in the private conversation until deleted/expired. Closing or stopping during streaming may leave an unfinished visible answer; reload history to check what actually committed before retrying.

## Validation and remaining work

Automated tests mock the provider, persistence layer and streaming transport. They cover ownership, CSRF, quotas, duplicate admission, atomic completed exchanges, token caps, timeout/error sanitisation, real section grounding, notes consent, truncated streams, stale contexts and append-only notes. These checks do not substitute for a live PostgreSQL migration test, real provider request, or production verification. Browser checks use mock authenticated API responses; no real emails, AI requests or user records are created.

Dependency audit reports a pre-existing high-severity Zod advisory (GHSA-mrhx-c7xc-m3w5); npm proposes a major-version upgrade. This feature does not silently upgrade the application's validation library. Schedule a separately tested upgrade. There is no dedicated lint script in this repository; syntax checks, formatting checks, both test suites and the production build are used instead.

### Implementation inventory

- Backend: `src/tutorContext.js`, `src/tutorProvider.js`, `src/tutorRoutes.js`, `src/tutorStore.js`, `migrations/009_ai_tutor.sql`; route registration in `src/app.js`, export fields in `src/settingsModel.js`, backend-only examples in `.env.example`, SDK dependency and lockfile.
- Client: `components/TutorAssistant.jsx`, `components/TutorMarkdown.jsx`, `hooks/useTutorChat.js`, `services/tutorApi.js`, `services/tutorChat.js`, `services/tutorNotes.js`, `styles/tutor.css`; lesson integration in `pages/LessonPage.jsx`, authenticated streaming helper in `services/authApi.js`.
- Tests: `tests/tutor-backend.test.js`, `tests/tutor-provider.test.js`, `frontend/src/services/tutorChat.test.js`, `frontend/src/components/TutorMarkdown.test.jsx`.

### Executed validation

- Root `npm test`: 22 test-file groups passed, including the existing backend syntax suite and mocked tutor route/provider/context tests.
- `npm --prefix frontend test`: 52 tests passed across 8 files.
- `npm run build`: passed, including Vite production bundling and public-page prerendering.
- Explicit `node --check` passed for all four new backend tutor JavaScript files; `git diff --check` passed.
- Browser, mock APIs only: rendered answer and highlighted JavaScript; desktop 1440×1000 panel and reading area did not overlap; mobile 390×844 used a native modal and had no horizontal overflow; Escape closed and restored launcher focus; switching sections updated context and reset notes consent; explicit append retained the existing note and appeared in My Notes.
- Not verified: real OpenAI inference, live PostgreSQL migrations/persistence, deployed Render/Vercel streaming and cross-site cookies, or answer correctness from a real model. The browser fixtures are not evidence of production persistence.
