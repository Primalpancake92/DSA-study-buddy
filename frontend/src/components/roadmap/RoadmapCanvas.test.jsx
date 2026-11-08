import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { weekCatalog } from '../../../../shared/curriculum.js';
import { groupRoadmapStages, RoadmapCanvas } from './RoadmapCanvas.jsx';

describe('grouped roadmap', () => {
    it('retains every syllabus module once, in sequence rather than database ID order', () => {
        const groups = groupRoadmapStages([...weekCatalog].reverse());
        expect(groups.map((group) => group.weeks.length)).toEqual([3, 5, 5, 4]);
        expect(groups.flatMap((group) => group.weeks.map((week) => week.id)))
            .toEqual(weekCatalog.map((week) => week.id));
        expect(groups[0].weeks[1].id).toBe(17);
    });

    it('shows real progress and opens the current stage while retaining module detail controls', () => {
        const progress = {
            completedWeeks: weekCatalog.slice(0, 3).map((week) => week.id),
            completedCheckpoints: []
        };
        const html = renderToStaticMarkup(
            <RoadmapCanvas weeks={weekCatalog} progress={progress} onSelect={() => {}} />
        );
        expect(html.match(/<details[^>]* open=""/g)).toHaveLength(2);
        expect(html.match(/class="roadmap-card /g)).toHaveLength(17);
        expect(html).toContain('MODULE 04 · CURRENT');
        expect(html).toContain('100%');
        expect(html).toContain('17 modules');
    });
});
