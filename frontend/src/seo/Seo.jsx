import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metadataHtml } from './publicPages.js';

// Mount once inside BrowserRouter, before Routes. No auth changes required.
export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.head.querySelectorAll('[data-seo], title, meta[name="robots"], meta[name="description"], link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]').forEach((node) => node.remove());
    const template = document.createElement('template');
    template.innerHTML = metadataHtml(pathname, {
      'google-site-verification': import.meta.env.VITE_GOOGLE_SITE_VERIFICATION,
      'msvalidate.01': import.meta.env.VITE_BING_SITE_VERIFICATION
    }, (import.meta.env.VITE_SITE_URL || undefined)?.replace(/\/$/, ''));
    document.head.append(template.content);
  }, [pathname]);
  return null;
}
export default Seo;
