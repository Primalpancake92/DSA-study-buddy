import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public curriculum surfaces only import the preview model', async () => {
    const publicFiles = await Promise.all([
        readFile(new URL('../frontend/src/pages/LandingPage.jsx', import.meta.url), 'utf8'),
        readFile(
            new URL('../frontend/src/pages/CurriculumPreviewPage.jsx', import.meta.url),
            'utf8'
        )
    ]);
    for (const source of publicFiles) {
        assert.match(source, /curriculumPreview/);
        assert.doesNotMatch(source, /shared\/curriculum\.js/);
        assert.doesNotMatch(source, /getLesson|weekCatalog/);
    }
});

test('detailed curriculum routes are protected in the backend source', async () => {
    const source = await readFile(new URL('../backend/src/app.js', import.meta.url), 'utf8');
    assert.match(source, /app\.get\('\/api\/curriculum', requireAuth/);
    assert.match(source, /app\.get\('\/api\/curriculum\/:weekNumber', requireAuth/);
    assert.match(source, /app\.get\('\/api\/curriculum\/preview'/);
});
