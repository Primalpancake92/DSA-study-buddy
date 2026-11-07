export const diagramWidth = 1000;
export const rowHeight = 240;
export function buildRoadmap(weeks) {
    return weeks.map((week, index) => ({
        week,
        y: 60 + index * rowHeight,
        topics: week.concepts
            .split(',')
            .map((title) => title.trim())
            .filter(Boolean)
            .map((title, i) => ({
                title,
                x: i % 2 ? 735 : 25,
                y: 60 + index * rowHeight + Math.floor(i / 2) * 66
            }))
    }));
}
export const clampZoom = (value) => Math.max(0.2, Math.min(1.8, value));
