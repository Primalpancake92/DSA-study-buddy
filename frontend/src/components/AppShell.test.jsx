import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout, PublicLayout } from './AppShell.jsx';

vi.mock('./AuthProvider.jsx', () => ({
    useAuth: () => ({ user: { firstName: 'Ada', lastName: 'Lovelace' }, loading: false, logout: vi.fn() })
}));

describe('shared application navigation', () => {
    it('starts with inert navigation and an accessible external reveal control', () => {
        const html = renderToStaticMarkup(<StaticRouter location="/notes"><AppLayout /></StaticRouter>);
        expect(html).toMatch(/<button[^>]+aria-controls="app-navbar"[^>]+aria-expanded="false"/);
        expect(html).toMatch(/<header[^>]+inert=""[^>]+aria-hidden="true"/);
        expect(html.indexOf('Open navigation')).toBeLessThan(html.indexOf('<header'));
        expect(html).toContain('class="app-navbar-inner"');
        for (const path of ['/app/dashboard', '/app/roadmap', '/app/modules', '/notes']) {
            expect(html).toContain(`href="${path}"`);
        }
        expect(html).toMatch(/aria-current="page"[^>]+href="\/notes"/);
        expect(html).toContain('aria-label="Account menu"');
    });

    it('keeps the public navbar outside the authenticated auto-hide layout', () => {
        const html = renderToStaticMarkup(<StaticRouter location="/"><PublicLayout /></StaticRouter>);
        expect(html).toContain('class="topbar public-topbar"');
        expect(html).not.toContain('navbar-activation-zone');
        expect(html).not.toContain('inert=');
    });
});
