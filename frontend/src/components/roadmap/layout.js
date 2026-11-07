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
export const zoomStep = 0.15;
export const fitZoom = (width) => Math.max(0.65, Math.min(1, width / diagramWidth));

export function createWidthFit(onFit) {
    let previousWidth;
    return (width) => {
        if (width > 0 && width !== previousWidth) {
            previousWidth = width;
            onFit(width);
        }
    };
}

export function zoomScrollLeft(scrollLeft, viewportWidth, previousZoom, nextZoom) {
    const previousGutter = Math.max(0, (viewportWidth - diagramWidth * previousZoom) / 2);
    const center = (scrollLeft + viewportWidth / 2 - previousGutter) / previousZoom;
    const maximum = Math.max(0, diagramWidth * nextZoom - viewportWidth);
    return Math.max(0, Math.min(maximum, center * nextZoom - viewportWidth / 2));
}
