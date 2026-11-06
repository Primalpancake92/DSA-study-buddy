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
    assert.ok(requiredSections.every((id) => lesson.sections.some((section) => section.id === id)), `week ${week.id} lost a stable section anchor`);
    assert.ok(lesson.sections.filter((section) => !section.blocks).every((section) => section.body.trim().length > 80), `week ${week.id} has insufficient overview content`);
    assert.equal(new Set(lesson.sections.map((section) => section.id)).size, lesson.sections.length);
  }
});

test('every module delivers structured concepts, executable examples and concealed practice', () => {
  for (const week of weekCatalog) {
    const concepts = getLesson(week.id).sections.filter((section) => section.blocks);
    assert.ok(concepts.length >= 2, `week ${week.id} needs multiple concept chapters`);
    const blocks = concepts.flatMap((section) => section.blocks);
    assert.ok(blocks.some((block) => block.type === 'diagram'), `week ${week.id} needs a worked state trace`);
    const exercises = blocks.filter((block) => block.type === 'exercise');
    assert.ok(exercises.length >= 2, `week ${week.id} needs guided exercises`);
    assert.ok(exercises.every((block) => block.hints?.length && block.solution?.length > 40));
    for (const block of blocks.filter((block) => block.type === 'code')) {
      assert.doesNotThrow(() => new vm.Script(block.code).runInNewContext({ console: { log() {} } }, { timeout: 1000 }), `week ${week.id} has an example that fails to execute`);
    }
  }
});

test('literal expected outputs in runnable examples match actual values', () => {
  let checked = 0;
  for (const week of weekCatalog) {
    const blocks = getLesson(week.id).sections.flatMap((section) => section.blocks || []);
    for (const block of blocks.filter((item) => item.type === 'code')) {
      // Compare explicit single-value console examples when the annotation is a
      // JavaScript literal. Explanatory annotations are not treated as assertions.
      const lines = block.code.split('\n');
      const rewritten = lines.map((line) => {
        const match = line.match(/^\s*console\.log\((.*)\);?\s*\/\/\s*=>\s*(.+)$/);
        if (!match) return line;
        let expected;
        try { expected = new vm.Script(`(${match[2]})`).runInNewContext({}, { timeout: 100 }); } catch { return line; }
        if (expected === undefined) return line;
        checked++;
        return `checkOutput((${match[1]}), ${JSON.stringify(expected)});`;
      }).join('\n');
      new vm.Script(rewritten).runInNewContext({ console: { log() {} }, checkOutput: (actual, expected) => assert.equal(typeof actual === 'string' && typeof expected !== 'string' ? actual : JSON.stringify(actual), JSON.stringify(expected), `week ${week.id} example output mismatch`) }, { timeout: 1000 });
    }
  }
  assert.ok(checked > 0, 'No expected-output examples were validated');
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
