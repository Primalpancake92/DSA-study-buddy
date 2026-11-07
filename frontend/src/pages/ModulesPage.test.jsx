import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { weekCatalog } from '../../../shared/curriculum.js';
import { ModulesPage } from './ModulesPage.jsx';

vi.mock('../hooks/useLearningData.js', () => ({
    useLearningData: () => ({ weeks: weekCatalog, progress: {}, loading: false, error: '' }),
    moduleProgress: () => ({ status: 'not-started', completed: 0, total: 3, percentage: 0 })
}));

describe('module catalogue cards', () => {
    it('groups progress and actions in one bottom-aligned footer without truncating content', () => {
        const html = renderToStaticMarkup(
            <StaticRouter location="/app/modules">
                <ModulesPage />
            </StaticRouter>
        );
        expect(html.match(/class="module-card"/g)).toHaveLength(17);
        expect(html.match(/class="module-card-footer"/g)).toHaveLength(17);
        expect(html.match(/class="module-progress-line"/g)).toHaveLength(17);
        expect(html.match(/Open Module/g)).toHaveLength(17);
        for (const week of weekCatalog) {
            expect(html).toContain(week.title);
            expect(html).toContain(week.concepts);
            expect(html).toContain(`href="/app/weeks/${week.id}"`);
        }
    });
});
