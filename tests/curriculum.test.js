import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { getLesson, weekCatalog } from '../shared/curriculum.js';

const requiredSections = [
  'introduction-and-objectives',
  'fundamental-theory',
  'javascript-implementation',
  'worked-examples',
  'complexity-analysis',
  'problem-solving-patterns',
  'practice-exercises',
  'common-mistakes',
  'module-summary-and-mastery'
];

test('all 16 curriculum modules have the required teaching sections', () => {
  assert.equal(weekCatalog.length, 16);
  for (const week of weekCatalog) {
    const lesson = getLesson(week.id);
    assert.ok(lesson, `week ${week.id} should resolve`);
    assert.deepEqual(lesson.sections.map((section) => section.id), requiredSections);
    assert.ok(lesson.sections.every((section) => section.body.trim().length > 80), `week ${week.id} has insufficient section content`);
    assert.equal(new Set(lesson.sections.map((section) => section.id)).size, lesson.sections.length);
  }
});

test('module JavaScript examples are syntactically valid', () => {
  for (const week of weekCatalog) {
    const lesson = getLesson(week.id);
    assert.doesNotThrow(() => new vm.Script(lesson.guide.code), `week ${week.id} has invalid JavaScript`);
  }
});

test('existing resource and problem links remain valid URLs', () => {
  const lesson = getLesson(1);
  for (const resource of lesson.resources) assert.doesNotThrow(() => new URL(resource.url));
  for (const problem of lesson.problems) assert.doesNotThrow(() => new URL(problem.url));
});
