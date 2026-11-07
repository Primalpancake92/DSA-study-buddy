# My Notes

The authenticated `/notes` page adds a personal notes library to the main navbar.
`/app/notes` redirects to `/notes`. Both paths use the existing SPA hosting fallback;
no hosting rewrite changes are required.

## Storage and API

No new table or migration is required. The feature uses `section_notes`, introduced
by [migration 008](../backend/migrations/008_section_notes.sql). Existing deployments
must already have that migration applied.

`GET /api/section-notes` lists live notes for `req.session.userId`. It accepts:

- `limit`: 1–200, default 100.
- `afterModule`: numeric stable module ID, default 0.
- `afterSection`: stable section ID, default empty string.

The response contains `notes`, `modules`, and `nextCursor` (null on the last page).
Each note has `moduleId`, `sectionId`, `content`, `version`, `exists`, `createdAt`,
`updatedAt`, `sectionTitle`, `sectionOrder`, and `anchor`. Modules contain `id`,
`title`, and syllabus `sequence`. A non-null cursor contains `moduleId` and
`sectionId`; pass these as `afterModule` and `afterSection` for the next request.

A single parameterized database query per page uses the existing composite primary
key and excludes deleted notes. Authentication and private/no-store cache headers
apply to listing as well as existing individual-note operations. Client-supplied
owner IDs are rejected. Titles and ordering are resolved from the current lesson
registry, never copied into the database. Missing sections retain their content
and remain editable/deletable by their owner; no broken section link is shown.

## Display and synchronization

The page fetches in batches of 100, then searches and filters locally without
requests on each keystroke. Groups always follow syllabus order (which differs
from stable numeric module IDs). Sections default to lesson order; update-time
and creation-time sorting apply within each module. Only modules with notes are
shown unless the user chooses to include empty modules. Collapse state survives
filter changes.

The library embeds the existing [SectionNotes editor](../frontend/src/components/SectionNotes.jsx)
and shares its owner/module/section controller, 20,000-character limit, one-second
autosave, manual save, confirmation before deletion, recovery drafts, and optimistic
version checks. Local changes update library previews immediately. The page reloads
saved notes when entered or when its window regains focus, preserving dirty drafts
and in-flight saves. Navigation flushes the shared editor; failed drafts remain
available through the existing unsaved-note notice and browser-unload warning.

## Validation

- Root `npm test`: 23 test files passed.
- Frontend `npm --prefix frontend test -- --maxWorkers=1 --minWorkers=1`: 70 tests passed.
- `npm run build`: passed, including prerendering.
- Editor diagnostics and `git diff --check`: passed.
- Lint attempted; no lint script is configured in the project.
- Browser checks used mocked account/API data and actual lesson registry metadata:
  direct entry and refresh, authenticated/unauthenticated routes, module ordering,
  search and empty results, module filter, sorting, collapse preservation, edit and
  autosave synchronization with the lesson panel, confirmed/cancelled deletion,
  empty library, API error and retry, and 1280/768/390px layouts without horizontal overflow.
- No live PostgreSQL integration run or production deployment was performed.

## Files

Created:

- [Notes page](../frontend/src/pages/NotesPage.jsx)
- [Library grouping and merge helpers](../frontend/src/services/notesLibrary.js)
- [Library helper tests](../frontend/src/services/notesLibrary.test.js)
- [Library styles](../frontend/src/styles/notes-library.css)
- This implementation guide.

Modified:

- [Application routes](../frontend/src/App.jsx)
- [Application navbar](../frontend/src/components/AppShell.jsx)
- [Shared editor recovery link](../frontend/src/components/SectionNotes.jsx)
- [Notes API client](../frontend/src/services/sectionNotesApi.js)
- [Shared note controllers](../frontend/src/services/sectionNotesStore.js)
- [Controller tests](../frontend/src/services/sectionNotesStore.test.js)
- [Backend notes routes](../backend/src/sectionNotesRoutes.js)
- [Backend notes service](../backend/src/sectionNotesService.js)
- [Backend notes tests](../tests/section-notes.test.js)
- [SPA hosting tests](../tests/spa-routing.test.js)
