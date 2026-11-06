import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';
// Match the production browser runtime and avoid development-only router warnings.
process.env.NODE_ENV = 'production';
const { default: React } = await import('react');
const { renderToString } = await import('react-dom/server');

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = new URL('../dist/', import.meta.url);
const env = { ...loadEnv('production', root, 'VITE_'), ...process.env };
const server = await createServer({ root, mode: 'production', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { PublicRender } = await server.ssrLoadModule('/src/seo/PublicRender.jsx');
  const { publicPages, SITE_URL, metadataHtml, escapeHtml } = await server.ssrLoadModule('/src/seo/publicPages.js');
  const siteUrl = (env.VITE_SITE_URL || SITE_URL).replace(/\/$/, '');
  const origin = new URL(siteUrl);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('VITE_SITE_URL must be an HTTP(S) origin without credentials, path, query or fragment');
  const template = await readFile(new URL('index.html', dist), 'utf8');
  await writeFile(new URL('app-shell.html', dist), template);
  for (const pathname of Object.keys(publicPages)) {
    const markup = renderToString(React.createElement(PublicRender, { pathname }));
    const html = template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, () => `<!--seo:start-->\n${metadataHtml(pathname, { 'google-site-verification': env.VITE_GOOGLE_SITE_VERIFICATION, 'msvalidate.01': env.VITE_BING_SITE_VERIFICATION }, siteUrl)}\n<!--seo:end-->`).replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`);
    if (!/^\/(?:[a-z0-9-]+\/?)*$/.test(pathname)) throw new Error('Public route registry contains an unsafe path.');
    const directory = pathname === '/' ? dist : new URL(`${pathname.slice(1)}/`, dist);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), html);
  }
  await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(publicPages).map((path) => `<url><loc>${escapeHtml(`${siteUrl}${path}`)}</loc></url>`).join('')}</urlset>\n`);
  await writeFile(new URL('robots.txt', dist), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
} finally {
  await server.close();
}
