import test from 'node:test';
import assert from 'node:assert/strict';
import { weekCatalog } from '../shared/curriculum.js';
import { buildRoadmap, clampZoom } from '../frontend/src/components/roadmap/layout.js';
test('roadmap preserves 16 module identities and branches only from actual topics', () => {
  const rows = buildRoadmap(weekCatalog);
  assert.equal(rows.length, 16);
  rows.forEach((row, index) => {
    assert.equal(row.week.id, index + 1);
    assert.deepEqual(row.topics.map((topic) => topic.title), row.week.concepts.split(',').map((topic) => topic.trim()));
    assert.ok(row.topics.every((topic) => topic.y < row.y + 240));
    assert.ok(new Set(row.topics.map((topic) => topic.x)).size > 1);
  });
  assert.equal(clampZoom(10), 1.8);
  assert.equal(clampZoom(0), 0.2);
});
