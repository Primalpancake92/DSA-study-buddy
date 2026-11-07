import test from 'node:test';
import assert from 'node:assert/strict';
import { weekCatalog, moduleIds, isModuleId } from '../shared/curriculum.js';
import {
    linearSearchFrame,
    growthFunctions,
    linearBounds
} from '../frontend/src/services/complexityModels.js';
import {
    recommendNextLesson,
    lessonModuleProgress
} from '../frontend/src/services/learningRecommendations.js';
import { loadLesson } from '../backend/src/markdownLesson.js';
import { getPracticeForWeek } from '../shared/practiceCatalog.js';

test('curriculum inserts Arrays second without reassigning any existing module key', () => {
    assert.deepEqual(moduleIds.slice(0, 4), [1, 17, 2, 3]);
    assert.equal(weekCatalog.find((week) => week.id === 2).title, 'Hash Maps and Sets');
    assert.equal(weekCatalog.find((week) => week.id === 16).title, 'Interview Consolidation');
    assert.equal(new Set(moduleIds).size, 17);
    assert.equal(isModuleId(17), true);
    assert.equal(isModuleId(18), false);
    assert.equal(isModuleId('17'), false);
});
test('linear search steps count comparisons and stop immediately on match', () => {
    assert.equal(linearSearchFrame(100, 101, 100).comparisons, 100);
    const best = linearSearchFrame(8, 1, 99);
    assert.equal(best.comparisons, 1);
    assert.equal(best.index, 0);
    assert.equal(best.found, true);
    assert.equal(linearSearchFrame(8, 9, 7).done, false);
    assert.equal(linearSearchFrame(8, 9, 8).done, true);
    assert.deepEqual(linearSearchFrame(0, 1, 1), {
        values: [],
        comparisons: 0,
        index: null,
        found: false,
        done: true
    });
});
test('the selected constants prove 3n <= 3n + 7 <= 10n from n0 = 1, not zero', () => {
    assert.equal(linearBounds(0).holds, false);
    assert.deepEqual(linearBounds(1), { n: 1, lower: 3, work: 10, upper: 10, holds: true });
    for (let n = 1; n <= 1000; n++) {
        assert.equal(linearBounds(n).holds, true);
    }
});
test('growth curves are finite within the interactive range and use base-two logarithms', () => {
    assert.deepEqual(
        growthFunctions.map((item) => item.evaluate(8)),
        [1, 3, 8, 24, 64, 256]
    );
    for (const item of growthFunctions) {
        for (let n = 1; n <= 20; n++) {
            assert.ok(Number.isFinite(item.evaluate(n)));
        }
    }
});
test('independent sections, assessments, navigation and completion survive the split', async () => {
    const complexity = await loadLesson(1);
    const arrays = await loadLesson(17);
    assert.equal(complexity.nextModuleId, 17);
    assert.equal(arrays.previousModuleId, 1);
    assert.equal(arrays.nextModuleId, 2);
    assert.equal((await loadLesson(2)).previousModuleId, 17);
    for (const chapter of [complexity, arrays]) {
        assert.ok(chapter.sections.some((section) => /assessment/.test(section.id)));
        assert.ok(
            chapter.lessons.every((lesson) => lesson.id.startsWith(`w${chapter.id}-section-`))
        );
        assert.ok(chapter.lessons.length >= 15);
    }
    const saved = {
        ready: true,
        completedWeeks: [1],
        completedCheckpoints: [],
        startedLessons: []
    };
    assert.equal(recommendNextLesson([complexity, arrays], saved).lesson.weekId, 17);
    assert.equal(lessonModuleProgress(arrays, saved).percentage, 0);
    assert.equal(lessonModuleProgress(complexity, saved).percentage, 100);
    assert.ok(getPracticeForWeek(17).some((problem) => problem.id === 'contains-duplicate'));
    assert.equal(getPracticeForWeek(1).length, 0);
});
