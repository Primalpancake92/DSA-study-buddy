// Explicit allowlist: never derive indexability from arbitrary application routes.
export const SITE_URL = 'https://dsa-study-buddy.vercel.app';
export const publicPages = {
    '/': {
        title: 'DSA Grind | Learn Data Structures & Algorithms in JavaScript',
        description:
            'Build problem-solving skills with a structured 16-week JavaScript curriculum, guided practice, algorithm visualisations and progress tracking.'
    },
    '/curriculum': {
        title: 'JavaScript DSA Curriculum Preview | DSA Grind',
        description:
            'Explore the high-level DSA Grind roadmap. Create a free account to unlock the complete 16-week syllabus, lessons, exercises and visualisations.'
    }
};
export function pageMetadata(pathname, siteUrl = SITE_URL) {
    const page = Object.hasOwn(publicPages, pathname) ? publicPages[pathname] : null;
    return page
        ? {
              ...page,
              canonical: `${siteUrl}${pathname === '/' ? '/' : pathname}`,
              robots: 'index,follow'
          }
        : { title: 'DSA Grind', description: '', robots: 'noindex,nofollow' };
}
export function pageSchema(pathname, siteUrl = SITE_URL) {
    if (pathname === '/')
        return {
            '@context': 'https://schema.org',
            '@graph': [
                { '@type': 'WebSite', name: 'DSA Grind', url: `${siteUrl}/` },
                {
                    '@type': 'SoftwareApplication',
                    name: 'DSA Grind',
                    applicationCategory: 'EducationalApplication',
                    operatingSystem: 'Web browser',
                    url: `${siteUrl}/`,
                    description: publicPages['/'].description
                }
            ]
        };
    if (pathname === '/curriculum')
        return {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: 'DSA Grind JavaScript Data Structures & Algorithms',
            description: publicPages[pathname].description,
            url: `${siteUrl}/curriculum`,
            provider: { '@type': 'Organization', name: 'DSA Grind', url: `${siteUrl}/` }
        };
    return null;
}
export const escapeHtml = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
    );
export const serializeSchema = (value) =>
    JSON.stringify(value).replace(
        /[<>&\u2028\u2029]/g,
        (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
    );
export function metadataHtml(pathname, verification = {}, siteUrl = SITE_URL) {
    const page = pageMetadata(pathname, siteUrl);
    const meta = (name, content, property = false) =>
        `<meta data-seo="true" ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(content)}">`;
    const tags = [
        `<title data-seo="true">${escapeHtml(page.title)}</title>`,
        meta('robots', page.robots)
    ];
    if (page.canonical) {
        tags.push(
            meta('description', page.description),
            `<link data-seo="true" rel="canonical" href="${escapeHtml(page.canonical)}">`
        );
        for (const [key, value] of Object.entries({
            'og:type': 'website',
            'og:site_name': 'DSA Grind',
            'og:title': page.title,
            'og:description': page.description,
            'og:url': page.canonical,
            'og:image': `${siteUrl}/social-card.png`,
            'og:image:width': '1200',
            'og:image:height': '630',
            'og:image:alt': 'DSA Grind — JavaScript data structures and algorithms'
        }))
            tags.push(meta(key, value, true));
        tags.push(
            meta('twitter:card', 'summary_large_image'),
            meta('twitter:title', page.title),
            meta('twitter:description', page.description),
            meta('twitter:image', `${siteUrl}/social-card.png`)
        );
        tags.push(
            `<script data-seo="true" type="application/ld+json">${serializeSchema(pageSchema(pathname, siteUrl))}</script>`
        );
        for (const [name, value] of Object.entries(verification))
            if (value) tags.push(meta(name, value));
    }
    return tags.join('\n');
}
