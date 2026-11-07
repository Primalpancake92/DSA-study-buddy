import test from 'node:test';
import assert from 'node:assert/strict';
import {
    recommendNextLesson,
    lessonModuleProgress
} from '../frontend/src/services/learningRecommendations.js';
import { loadLesson } from '../backend/src/markdownLesson.js';
import { recoveryEmailError } from '../shared/recoveryEmail.js';

const lesson = (id) => ({ id, sectionId: id, title: id, category: 'Reading', estimatedMinutes: 2 });
const weeks = [
    { id: 1, lessons: [lesson('a'), lesson('b')] },
    { id: 2, lessons: [lesson('c')] }
];
const saved = (overrides = {}) => ({
    ready: true,
    completedCheckpoints: [],
    completedWeeks: [],
    startedLessons: [],
    ...overrides
});

test('recovery rejects empty and invalid addresses and trims valid input', () => {
    assert.equal(
        recoveryEmailError('  '),
        'No email was entered. Please enter your email address.'
    );
    for (const input of [
        'abc',
        'a@@b.com',
        'a b@example.com',
        'a@b',
        'a..b@example.com',
        'a@bad..com',
        'a@-bad.com'
    ]) {
        assert.equal(
            recoveryEmailError(input),
            'Invalid email address. Please enter a valid email.'
        );
    }
    assert.equal(recoveryEmailError('  person@example.com '), '');
});
test('new users start first lesson; saved starts take priority over syllabus order', () => {
    assert.equal(recommendNextLesson(weeks, saved()).lesson.id, 'a');
    const result = recommendNextLesson(weeks, saved({ startedLessons: ['deleted', 'c'] }));
    assert.equal(result.lesson.id, 'c');
    assert.equal(result.continuing, true);
    assert.equal(result.href, '/app/weeks/2#c');
});
test('completion advances lessons and modules without recommending finished items', () => {
    assert.equal(recommendNextLesson(weeks, saved({ completedCheckpoints: ['a'] })).lesson.id, 'b');
    assert.equal(
        recommendNextLesson(weeks, saved({ completedCheckpoints: ['a', 'b'] })).lesson.id,
        'c'
    );
    assert.equal(
        recommendNextLesson(weeks, saved({ completedCheckpoints: ['a', 'b', 'c'] })).state,
        'complete'
    );
    assert.equal(recommendNextLesson(weeks, saved({ completedWeeks: [1, 2] })).state, 'complete');
});
test('partially completed modules precede untouched modules, using defined order', () => {
    assert.equal(recommendNextLesson(weeks, saved({ completedCheckpoints: ['c'] })).lesson.id, 'a');
    const expanded = [...weeks, { id: 3, lessons: [lesson('d'), lesson('e')] }];
    assert.equal(
        recommendNextLesson(expanded, saved({ completedCheckpoints: ['d'] })).lesson.id,
        'e'
    );
});
test('locked, unavailable, empty, stale, loading and failed states are safe', () => {
    assert.equal(
        recommendNextLesson(
            [{ ...weeks[0], locked: true }, weeks[1]],
            saved({ startedLessons: ['a'] })
        ).lesson.id,
        'c'
    );
    assert.equal(
        recommendNextLesson([{ ...weeks[0], available: false }], saved()).state,
        'unavailable'
    );
    assert.equal(recommendNextLesson([], saved()).state, 'unavailable');
    assert.equal(recommendNextLesson(weeks, saved({ ready: false })).state, 'loading');
    assert.equal(recommendNextLesson(weeks, saved({ error: 'Network failure' })).state, 'error');
    assert.equal(
        recommendNextLesson(weeks, saved({ completedCheckpoints: ['deleted'] })).lesson.id,
        'a'
    );
});
test('module percentages deduplicate IDs and handle zero lessons', () => {
    assert.equal(
        lessonModuleProgress(
            { id: 1, lessons: [lesson('a'), lesson('a'), lesson('b')] },
            saved({ completedCheckpoints: ['a', 'a'] })
        ).percentage,
        50
    );
    assert.equal(lessonModuleProgress({ id: 1, lessons: [] }, saved()).percentage, 0);
});
test('all seventeen recommendations reference real chapter anchors and stable progress IDs', async () => {
    for (let id = 1; id <= 17; id++) {
        const chapter = await loadLesson(id);
        assert.ok(chapter.lessons.length > 0);
        for (const item of chapter.lessons) {
            assert.ok(chapter.sections.some((section) => section.id === item.sectionId));
            assert.ok(item.id.length <= 120);
            assert.ok(item.estimatedMinutes > 0);
        }
        const snapshot = saved({ startedLessons: [chapter.lessons[1].id] });
        assert.deepEqual(
            recommendNextLesson([chapter], snapshot),
            recommendNextLesson([chapter], JSON.parse(JSON.stringify(snapshot)))
        );
    }
});
