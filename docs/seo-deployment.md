# Public SEO deployment

The frontend build renders the existing landing page and curriculum preview through the existing PublicLayout and AuthProvider. Server rendering runs no effects and makes no account/API requests. It imports only public page components and the existing preview model; the complete syllabus remains behind existing authentication. Metadata does not publish lesson text or exercises.

Run `npm --prefix frontend run build`, then `node --test tests/seo.test.js` (tests inspect that production output). Set the Vercel project Root Directory to `frontend` and deploy that directory to Vercel using the existing Vite settings and `dist` output. No deployment is performed by these scripts.

## Client integration

The integrated `<Seo />` component remains mounted inside BrowserRouter across route changes. It sets public canonicals, descriptions, social tags and schema on the two allowed paths; every other path removes public metadata and sets `noindex,nofollow`. Protected page components are lazy-loaded separately from the public entry bundle.

The existing client uses createRoot, so it replaces prerendered content on startup. Hydration is not required for this implementation. AuthProvider initially renders the existing brand as a readable span with aria-busy; the footer on the landing page and navigation links remain usable without JavaScript. No auth or styling changes were needed.

## Configuration

- `VITE_SITE_URL` defaults to the production frontend origin already documented in this repository: `https://dsa-study-buddy.vercel.app`. Override only with the confirmed canonical HTTP(S) origin. Do not use a deployment preview hostname as the production canonical.
- Optionally set `VITE_GOOGLE_SITE_VERIFICATION` and `VITE_BING_SITE_VERIFICATION` to the corresponding public ownership verification values. These are public build-time values, never secrets. Rebuild after changing any SEO variable.
- The generated sitemap contains only `/` and `/curriculum`. Robots permits crawling so crawlers can see noindex on private/auth pages. Robots and metadata are indexing instructions; backend authentication remains the access control.

Vercel explicitly rewrites the two public routes to rendered HTML and all other SPA paths to the empty `app-shell.html`, which defaults to noindex. Existing static assets, sitemap and robots are served by Vercel's filesystem before fallback rewrites. The shell also carries an X-Robots-Tag when requested directly. Confirm routing on a deployment preview, including `/curriculum`, `/login`, `/app/dashboard`, an unknown path, `/sitemap.xml`, `/robots.txt` and built assets. Private requests must never receive landing page HTML. Confirm `/curriculum/` follows the deployment's slash normalization and does not expose an alternative indexable URL.

The social image is [social-card.png](../frontend/public/social-card.png), generated from the SVG source with ImageMagick. Metadata uses PNG because many social crawlers do not support SVG.

## Search engine submission

1. Add the confirmed production property in Google Search Console and Bing Webmaster Tools. Follow their domain DNS verification instructions or use the optional HTML verification variables above and rebuild.
2. Submit `https://dsa-study-buddy.vercel.app/sitemap.xml` (substitute the configured origin).
3. Inspect `/` and `/curriculum` using each service's URL inspection tools, checking the fetched HTML, canonical and indexability. Request indexing if appropriate.
4. Inspect an auth route and a protected route to confirm noindex and absence of protected content in the response. After client integration, navigate from a public page to login and back and check document head metadata.

Submission and valid structured data do not guarantee indexing, ranking, rich results or social image display. Do not submit protected lesson URLs.
