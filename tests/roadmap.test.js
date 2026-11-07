import test from 'node:test';
import assert from 'node:assert/strict';
import { weekCatalog } from '../shared/curriculum.js';
import {
    buildRoadmap,
    clampZoom,
    createWidthFit,
    fitZoom,
    zoomScrollLeft,
    zoomStep
} from '../frontend/src/components/roadmap/layout.js';
test('roadmap preserves stable IDs in the 17-module curriculum order', () => {
    const rows = buildRoadmap(weekCatalog);
    assert.equal(rows.length, 17);
    rows.forEach((row, index) => {
        assert.equal(row.week.sequence, index + 1);
        assert.equal(row.week.id, weekCatalog[index].id);
        assert.deepEqual(
            row.topics.map((topic) => topic.title),
            row.week.concepts.split(',').map((topic) => topic.trim())
        );
        assert.ok(row.topics.every((topic) => topic.y < row.y + 240));
        assert.ok(new Set(row.topics.map((topic) => topic.x)).size > 1);
    });
    assert.equal(clampZoom(10), 1.8);
    assert.equal(clampZoom(0), 0.2);
});

test('height-only resize notifications cannot replace a chosen zoom', () => {
    const calls = [];
    const fitWidth = createWidthFit((width) => calls.push(width));
    fitWidth(0);
    fitWidth(1176);
    // Zoom changes the auto-height viewport but not its clientWidth.
    fitWidth(1176);
    fitWidth(1176);
    assert.deepEqual(calls, [1176]);
    fitWidth(760);
    fitWidth(760);
    assert.deepEqual(calls, [1176, 760]);
});

test('zoom uses predictable increments, clamped limits and responsive default fit', () => {
    assert.equal(clampZoom(1 + zoomStep), 1.15);
    assert.equal(clampZoom(1 - zoomStep), 0.85);
    assert.equal(clampZoom(1.75 + zoomStep), 1.8);
    assert.equal(clampZoom(0.25 - zoomStep), 0.2);
    assert.equal(fitZoom(1176), 1);
    assert.equal(fitZoom(760), 0.76);
    assert.equal(fitZoom(350), 0.65);
});

test('zoom preserves the panned center and keeps both edges reachable', () => {
    assert.equal(zoomScrollLeft(100, 600, 1, 1.5), 300);
    assert.equal(zoomScrollLeft(300, 600, 1.5, 1), 100);
    assert.equal(zoomScrollLeft(0, 1200, 1, 1.5), 150);
    assert.equal(zoomScrollLeft(900, 600, 1.5, 0.2), 0);
    assert.equal(zoomScrollLeft(-50, 600, 1, 1.5), 75);
});
