# DSA Grind Web

JavaScript-only full-stack learning platform for the DSA Grind curriculum.

## Current status

Phase 1 first vertical slice is implemented: a Vite + React shell with a landing page, roadmap, dashboard, Week 01 lesson viewer, progress persistence, and a visual array lab. The source repository import is intentionally strict and currently reports a clear error until the authoritative `DSA-grind` repository is available locally or through an approved GitHub credential.

## Run

```bash
npm install
npm run dev
```

The frontend is served on port 5173. The Express API is started with `npm run server`.

## Architecture blueprint

See [`docs/implementation-blueprint.md`](./docs/implementation-blueprint.md). The application keeps source curriculum, parsed content, UI state, persistence, and future isolated code execution as separate seams.

## Source import

```bash
npm run import:curriculum -- --source ../source/DSA-grind --output frontend/src/content/generated
```

The importer expects `README.md`, `STUDY-PLAYBOOK.md`, `weeks/01.md` through `weeks/16.md`, resource and guide files, practice files, templates, and tracking CSVs. It exits non-zero for missing required files.
