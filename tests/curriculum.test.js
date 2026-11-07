import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getLesson, weekCatalog } from '../shared/curriculum.js';
import { loadLesson } from '../backend/src/markdownLesson.js';

const requiredSections = [
    'learning-objectives',
    'prerequisite-knowledge',
    'core-theory',
    'javascript-implementations',
    'worked-examples',
    'visual-explanations',
    'complexity-analysis',
    'common-mistakes',
    'interview-and-leetcode-pattern-recognition',
    'practice-exercises',
    'hints-and-worked-solutions',
    'sources-and-further-reading',
    'weekly-summary',
    'weekly-progress-checklist'
];

test('all 17 module identities resolve to canonical Markdown in curriculum order', async () => {
    assert.deepEqual(
        weekCatalog.map((week) => week.id),
        [1, 17, ...Array.from({ length: 15 }, (_, i) => i + 2)]
    );
    for (const week of weekCatalog) {
        const lesson = await loadLesson(week.id);
        assert.ok(lesson, `week ${week.id} should resolve`);
        assert.equal(lesson.id, week.id);
        assert.equal(lesson.title, week.title);
        assert.equal(
            lesson.sourcePath,
            `docs/weekly_content/week-${String(week.id).padStart(2, '0')}.md`
        );
        const markdownSections = lesson.sections.filter(
            (section) => typeof section.markdown === 'string'
        );
        assert.ok(
            markdownSections.length,
            `week ${week.id} must not silently fall back to structured blocks`
        );
        if (week.id !== 1 && week.id !== 17) {
            assert.deepEqual(
                markdownSections
                    .filter((section) => section.id !== 'chapter-introduction')
                    .map((section) => section.id),
                requiredSections
            );
        }
        assert.equal(
            new Set(lesson.sections.map((section) => section.id)).size,
            lesson.sections.length
        );
        for (const section of markdownSections)
            assert.ok(section.markdown.trim(), `Empty section ${section.id}`);
        assert.ok(
            lesson.sections.some((section) => section.id === 'module-summary-and-mastery'),
            'Preserve existing mastery deep link'
        );
        assert.deepEqual(
            await loadLesson(week.id),
            lesson,
            'Section and checkpoint identities must remain stable on reload'
        );
    }
});

test('Markdown loading preserves problem, resource and practice metadata', async () => {
    for (const week of weekCatalog) {
        const legacy = getLesson(week.id);
        const lesson = await loadLesson(week.id);
        for (const key of ['problems', 'resources', 'checkpoint'])
            assert.deepEqual(lesson[key], legacy[key], `week ${week.id} lost ${key}`);
        for (const key of ['guide', 'theory', 'workedExample'])
            assert.equal(
                Object.hasOwn(lesson, key),
                false,
                `week ${week.id} duplicates legacy ${key}`
            );
        for (const resource of lesson.resources) assert.doesNotThrow(() => new URL(resource.url));
        for (const problem of lesson.problems) assert.doesNotThrow(() => new URL(problem.url));
    }
});

test('invalid module identities cannot resolve a chapter', async () => {
    for (const id of [0, -1, 18, 1.5, NaN, '../week-01', '1', null, undefined])
        assert.equal(await loadLesson(id), null);
});

test('Markdown routes retain authentication and stable lesson URLs', async () => {
    const backend = await readFile(new URL('../backend/src/app.js', import.meta.url), 'utf8');
    const frontend = await readFile(new URL('../frontend/src/App.jsx', import.meta.url), 'utf8');
    assert.match(backend, /app\.get\('\/api\/curriculum', requireAuth/);
    assert.match(backend, /app\.get\('\/api\/curriculum\/:weekNumber', requireAuth/);
    assert.match(backend, /app\.get\('\/api\/curriculum\/preview'/);
    assert.match(backend, /app\.get\('\/api\/weeks\/:weekNumber', requireAuth/);
    assert.match(backend, /app\.get\('\/api\/roadmap', requireAuth/);
    assert.match(frontend, /path="\/app\/weeks\/:weekId"/);
    assert.match(frontend, /path="\/lesson\/:weekId"[^]*?element={<LegacyLessonRedirect/);
    assert.ok(frontend.includes("to={`/app/weeks/${weekId}`}"));
    assert.doesNotMatch(backend, /express\.static\([^\n]*(?:weekly_content|docs)/);
});
