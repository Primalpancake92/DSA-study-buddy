# DSA Grind implementation blueprint

## Context

The requested product is a separate JavaScript-only application that turns the existing DSA Grind repository into an interactive learning environment. The repository is the curriculum source of truth; the app must preserve source paths, original ordering, exercises, resources, and revision philosophy. The referenced GitHub repository could not be cloned from this environment because GitHub rejected the unauthenticated request, so the first slice is based only on the supplied master prompt and is labelled as provisional until source import succeeds.

## Architecture

```text
dsa-grind-web/
├── frontend/                 React + Vite + JSX + Tailwind-compatible CSS
│   └── src/
│       ├── App.jsx            routes and shell
│       ├── content/           checked-in fallback + generated curriculum
│       ├── components/        reusable learning UI
│       ├── pages/             landing, dashboard, roadmap, lesson
│       ├── services/          browser persistence and API clients
│       └── styles/            visual system
├── backend/                  Express REST seam
├── shared/                   curriculum and schedule constants
├── scripts/                  strict Markdown/CSV importer
├── tests/                    Node/Vitest/Supertest/Playwright layers
└── docs/                     implementation evidence and decisions
```

## Requirement mapping

| Requirement | Representation |
| --- | --- |
| 16-week syllabus | `shared/curriculum.js` metadata and imported week records |
| source fidelity | `scripts/import-curriculum.js`, source path + commit metadata |
| daily routine | `shared/schedule.js`, dashboard session cards |
| weekly rhythm | `shared/schedule.js`, configurable day state |
| roadmap | `frontend/src/pages/RoadmapPage.jsx` |
| Week 01 vertical slice | `frontend/src/pages/LessonPage.jsx` + `WeekOneArrayLab.jsx` |
| persisted student state | `frontend/src/services/progressStore.js` with API seam |
| revision queue | `shared/reviewSchedule.js` (next slice) |
| journal | planned REST resource and lesson action (next slice) |
| secure code execution | explicitly deferred; never use `eval`/`Function` in Express |
| resources | imported resource records with verified URLs only |
| testing | root scripts and focused first-slice tests |

## First vertical slice acceptance criteria

1. Open the app and see DSA Grind branding and a visible learning roadmap.
2. Navigate to Week 01 without GitHub Markdown navigation.
3. Read provisional Complexity and Arrays content.
4. Run the array visualisation using play/pause/reset/step controls.
5. Mark a checkpoint complete and see dashboard progress update after reload.
6. Keep source import failure explicit rather than publishing an empty course.

## Next actions

1. Obtain an accessible clone or archive of `Primalpancake92/DSA-grind` and run the importer.
2. Replace provisional Week 01 content with imported Markdown-derived records.
3. Add backend SQLite migrations and progress endpoints.
4. Add Monaco plus a sandboxed worker/container execution service.
5. Add revision queue, journal export, visualisation suite, mock interviews, and full test matrix.
