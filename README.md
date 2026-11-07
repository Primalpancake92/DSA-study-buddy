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

### Email verification

New accounts are created unverified. Registration validates syntax with `validator`, checks MX/A/AAAA mail capability with a bounded DNS lookup, stores only a hash of the verification token, and does not create a fully authenticated session until verification succeeds. In development, `EMAIL_PROVIDER=development` queues a non-sending transport; in production configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, and a verified sender domain with SPF, DKIM and DMARC. The frontend routes are `/check-your-email` and `/verify-email`.

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
# Production verification email

See [Resend production setup](docs/resend-production.md) for Render configuration, sender-domain verification, retry behaviour and the manual deployment checklist.


### Frontend direct links and refreshes (Vercel)

Production frontend hosting is Vercel; Render serves the separate API. Neither the
Render web-service configuration nor the Railway API configuration hosts the SPA.

The Vercel configuration now explicitly runs the complete build, including the
prerender step that creates `app-shell.html`. There are equivalent configurations
for either project root:

| Vercel Root Directory | Configuration | Build command | Output Directory |
| --- | --- | --- | --- |
| `frontend` (recommended) | [frontend/vercel.json](frontend/vercel.json) | `npm run build` | `dist` |
| repository root | [vercel.json](vercel.json) | `npm --prefix frontend run build` | `frontend/dist` |

For a `frontend` root, enable access to source files outside the Root Directory:
this application imports shared curriculum/settings modules from its parent.
Do not deploy `frontend/dist` as the project root or override the build with only
`vite build`: that omits the private SPA shell. Vercel reads the config in its
selected project root, not arbitrary nested configs.

The public `/` and `/curriculum` paths retain their prerendered pages. Other
extensionless frontend URLs, including `/app/dashboard`, `/app/modules`,
`/app/weeks/1`, `/app/weeks/2`, and `/app/settings/profile`, rewrite internally to
`/app-shell.html`. Section links use fragments such as `/app/weeks/2#core-theory`;
fragments are handled by the browser, not the host. Unknown frontend routes render
the application's Not Found screen. `/api`, `/api/*`, `/assets/*`, and file paths
are excluded from the SPA fallback, so missing assets remain real 404s.

Keep `VITE_API_BASE_URL` set to the existing backend origin and `VITE_SITE_URL` set
to the frontend origin in the appropriate Vercel environment. API requests remain
absolute requests to that backend; there is no new API proxy. Unknown backend
API endpoints continue returning JSON 404 responses.

Redeploy the frontend after merging these changes. Confirm the deployment log runs
both Vite and `scripts/prerender.mjs`, and that `app-shell.html` exists in the output.
Run `VERCEL_DEPLOYMENT_URL=https://your-deployment.vercel.app npm run test:vercel`
after deployment, then check signed-in direct navigation and refreshes on Modules 1
and 2. No backend redeployment or database changes are required for this fix.
