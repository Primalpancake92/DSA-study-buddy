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

## Authentication and PostgreSQL

Authentication uses PostgreSQL-backed sessions, Argon2id password hashes, CSRF tokens, and secure HttpOnly cookies. Configure the backend before starting it:

```bash
cp backend/.env.example backend/.env
# Set DATABASE_URL and a random SESSION_SECRET in backend/.env
npm install --prefix backend
npm run migrate
npm run server
```

Set `VITE_API_BASE_URL` when the frontend and API are hosted on different origins. Never commit `.env` files or production credentials.

For Vercel, define `VITE_API_BASE_URL=https://dsa-study-buddy.onrender.com` for the **Production** environment and redeploy after changing it. Vite embeds `VITE_*` values at build time; changing the Vercel variable without a new deployment does not change the browser bundle. The frontend uses absolute Render URLs, so the SPA rewrite in [frontend/vercel.json](./frontend/vercel.json) does not proxy API requests. If preview deployments need credentialed sessions, list their exact origins in the backend `VERCEL_PREVIEW_ORIGINS` variable as a comma-separated allowlist.

For Supabase Session Pooler TLS, keep verification enabled. The repository includes the inspected public Supabase Root 2021 CA at `backend/certs/supabase-root-2021-ca.pem`; when Render uses `backend/` as its root directory, set `DATABASE_CA_CERT_PATH=certs/supabase-root-2021-ca.pem`. Alternatively inject the verified PEM through `DATABASE_CA_CERT` with escaped `\\n` line breaks. Do not set `PGSSL_REJECT_UNAUTHORIZED=false` or `NODE_TLS_REJECT_UNAUTHORIZED=0`.

### Supabase, Railway and Vercel deployment

1. In Supabase, open **Connect → Session pooler** and copy the PostgreSQL URI. Do not use the Supabase HTTPS project URL as `DATABASE_URL`.
2. Set `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_ORIGIN`, `DATABASE_SSL=true`, and `PGSSL_REJECT_UNAUTHORIZED=true` in Railway. Keep `DATABASE_URL` and `SESSION_SECRET` out of Vercel variables.
3. Run the migrations against the Supabase database from a trusted environment with `npm run migrate`.
4. Deploy the backend using [railway.toml](./railway.toml), then set `VITE_API_BASE_URL` to the Railway API URL in Vercel.
5. Deploy `frontend/` as the Vercel project root. [frontend/vercel.json](./frontend/vercel.json) keeps React Router refreshes working.
6. Verify `/api/health`, registration, login, logout, protected curriculum access and progress restoration. Configure database backups and Railway logs before production use.

## Architecture blueprint

See [`docs/implementation-blueprint.md`](./docs/implementation-blueprint.md). The application keeps source curriculum, parsed content, UI state, persistence, and future isolated code execution as separate seams.

## Source import

```bash
npm run import:curriculum -- --source ../source/DSA-grind --output frontend/src/content/generated
```

The importer expects `README.md`, `STUDY-PLAYBOOK.md`, `weeks/01.md` through `weeks/16.md`, resource and guide files, practice files, templates, and tracking CSVs. It exits non-zero for missing required files.
