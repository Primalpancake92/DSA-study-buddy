# Persistent section notes

Apply [008_section_notes.sql](../backend/migrations/008_section_notes.sql) with the normal migration runner **before deploying** the notes API. The migration is idempotent. Notes use the existing PostgreSQL pool; deleting an account cascades to all its notes and tombstones. No migration is applied by tests.

Authenticated endpoint: `/api/section-notes/:moduleId/:sectionId`.
For reading sections, use the stable `id` from `loadLesson(moduleId).lessons`, mapped by `sectionId`; never derive a reading ID from its title. For existing nonreading sections, use `wN-section-` plus the validated section ID (mastery and weekly progress checklist). The existing synthetic `coding-practice` section is available beside mastery in modules other than 1. Unknown module/section combinations return 404.

- GET returns `{ "note": { "content": "", "version": 0, "updatedAt": null, "exists": false } }` when never saved.
- PUT accepts strictly `{ "content": "plain text", "version": 0 }`. Content is plain text, preserved verbatim, up to 20,000 JavaScript characters. Render it as text rather than HTML. An empty saved note still exists.
- DELETE accepts strictly `{ "version": 1 }`. It clears content and stores a tombstone with an incremented version. GET returns `exists: false` and the retained version for a tombstone.

PUT and DELETE require the existing session CSRF token, share a 60 writes/minute limiter, and return the same note shape as GET. All responses after authentication use `Cache-Control: private, no-store`. The existing JSON body limit is 64 KB of UTF-8; multibyte content may hit that limit before the character limit.

Use the last returned version for each save or delete. Version zero creates a row only if none exists. Each successful mutation increments the version atomically. Concurrent or stale writes return HTTP 409 with `code: "NOTE_CONFLICT"`; reload and let the user resolve edits before retrying. Tombstones prevent an older client from recreating a deleted note. Requests cannot select an owner; ownership always comes from the authenticated session.

Account JSON exports include `sectionNotes` with `module_id`, `section_id`, `content`, `version`, and `updated_at` for all owned live notes, excluding tombstones. Notes do not alter lesson progress, practice, reviews, or activity and are not logged. Database failures use the existing generic API error handler.

Run isolated backend checks with `node --test tests/section-notes.test.js tests/settings-backend.test.js`. These tests use mocked database queries and the actual notes router without connecting to a configured database.

## Editor and draft recovery

Every displayed learning section has a collapsible **My Notes** panel, including completed sections, mastery and checklists. Opening a panel fetches that section only. Typing autosaves after one second; Save now and Retry are also available. The editor accepts plain text, not executable HTML or Markdown. Saving notes never completes a lesson.

The controller serializes requests for each owner/module/section. Edits made while a write is in flight remain visible and save next with the newly returned version. A stale version produces a conflict instead of silently replacing another tab's edits. Learners explicitly confirm either replacing the remote version or discarding their draft and loading it. A conflicting recovery draft keeps its old base version even after refreshing.

Pending drafts stay in memory during SPA navigation and are backed up in **sessionStorage**, scoped by account and section. Only unsaved drafts are stored there; committed content is retrieved from PostgreSQL. Drafts are plain text in this origin's tab storage, not encrypted backups. Storage may be blocked; the panel warns when recovery is unavailable. Closing a tab can discard its sessionStorage. The browser receives a before-unload warning while notes are dirty; it may suppress that warning according to its own policies. Keep the tab open until Saved when possible.

Navigation flushes pending writes; a global notice links back to failed drafts. Coming online retries nonconflicting saves. Logout first attempts to save notes and asks before discarding remaining unsaved drafts. Successful logout or account deletion clears note state and recovery drafts, including pending response callbacks. Do not rely on browser drafts as the permanent record.

## Native themed scrollbars

The global scrollbar stylesheet uses the existing background, control-border and accent-hover tokens. Standards-based scrollbar width/colour declarations cover modern engines, and WebKit pseudo-elements provide a fallback. Notes editors and other overflow panels keep native keyboard, wheel and touch scrolling. Forced-colour mode restores automatic width/colour; coarse pointers retain a wider native scrollbar. Overlay scrollbar visibility remains controlled by the operating system. No JavaScript scrolling library was added.

## Validation and deployment limits

Targeted backend tests cover all 17 modules' section identities, owner isolation, strict payload validation, authentication/CSRF, atomic conflicts, delete tombstones, safe errors and account exports. Frontend store tests cover debounce, sequential saves, failures/retry, conflicting recovery, deletion, owner isolation, logout cleanup and size limits.

Local Chromium checks with mocked API responses exercised save, separate sections, refresh restoration, retry after a simulated 503, confirmed deletion and collapse/reopen. Editors fitted 1440px, 800px and 390px viewports without page overflow. Computed scrollbar colours matched theme tokens; forced colours returned automatic native settings. These are not tests against production accounts or a live PostgreSQL database. Firefox and Safari were not exercised directly.

Run `npm test`, `npm --prefix frontend test` and `npm run build`. There is no configured root lint script; new files follow the existing four-space Prettier configuration. Apply migration 008 with the normal `npm run migrate` workflow against the intended database, then deploy both Render and Vercel. Existing environment variables, sessions and CORS settings remain unchanged. Verify a real account's notes across refresh and logout/login after deployment. No migration or production write was performed during implementation.

Final implementation checks: all 20 root test-file groups passed; all 46 frontend tests passed, including 13 note-store cases; all seven targeted backend notes cases passed. The production Vite build/prerender, backend `node --check`, editor diagnostics and `git diff --check` passed. Prettier was run on the new JavaScript/JSX/CSS and touched lesson/auth integration files. Live PostgreSQL persistence and a real logout/login round trip remain deployment verification steps, not completed browser claims.

## Files changed

- Backend: [notes router](../backend/src/sectionNotesRoutes.js), [notes service](../backend/src/sectionNotesService.js), [API mount](../backend/src/app.js), [account export](../backend/src/settingsModel.js), [migration 008](../backend/migrations/008_section_notes.sql), [backend tests](../tests/section-notes.test.js).
- Frontend: [notes interface](../frontend/src/components/SectionNotes.jsx), [notes hook](../frontend/src/hooks/useSectionNotes.js), [API client](../frontend/src/services/sectionNotesApi.js), [draft/autosave store](../frontend/src/services/sectionNotesStore.js), [store tests](../frontend/src/services/sectionNotesStore.test.js), [notes styles](../frontend/src/styles/section-notes.css), [scrollbar styles](../frontend/src/styles/scrollbars.css), [lesson integration](../frontend/src/pages/LessonPage.jsx), [auth cleanup](../frontend/src/components/AuthProvider.jsx), [application integration](../frontend/src/App.jsx).
