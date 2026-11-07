export function linearSearchFrame(size, target, requestedSteps) {
    const values = Array.from({ length: size }, (_, index) => index + 1);
    const match = values.indexOf(target);
    const limit = match < 0 ? size : match + 1;
    const comparisons = Math.min(limit, Math.max(0, requestedSteps));
    return {
        values,
        comparisons,
        index: comparisons ? comparisons - 1 : null,
        found: match >= 0 && comparisons === limit,
        done: comparisons === limit
    };
}

export const growthFunctions = [
    { label: 'O(1): 1', evaluate: () => 1 },
    { label: 'O(log n): log₂ n', evaluate: (n) => Math.log2(n) },
    { label: 'O(n): n', evaluate: (n) => n },
    { label: 'O(n log n): n log₂ n', evaluate: (n) => n * Math.log2(n) },
    { label: 'O(n²): n²', evaluate: (n) => n * n },
    { label: 'O(2ⁿ): 2ⁿ', evaluate: (n) => 2 ** n }
];

export function linearBounds(n) {
    return {
        n,
        lower: 3 * n,
        work: 3 * n + 7,
        upper: 10 * n,
        holds: 3 * n <= 3 * n + 7 && 3 * n + 7 <= 10 * n
    };
}
