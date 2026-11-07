import { useState } from 'react';
import { growthFunctions, linearBounds, linearSearchFrame } from '../services/complexityModels.js';

function SearchLab() {
    const [size, setSize] = useState(8);
    const [target, setTarget] = useState(8);
    const [steps, setSteps] = useState(0);
    const frame = linearSearchFrame(size, target, steps);
    function chooseTarget(value) {
        setTarget(value);
        setSteps(0);
    }
    return (
        <section aria-labelledby="search-lab-title">
            <h3 id="search-lab-title">Step through linear search</h3>
            <p>
                Values are 1 through n. Each step performs one element comparison; reaching the end
                or finding the target stops the search.
            </p>
            <div className="complexity-controls">
                <label>
                    Array size n: {size}
                    <input
                        type="range"
                        min="0"
                        max="20"
                        value={size}
                        onChange={(event) => {
                            setSize(Number(event.target.value));
                            setSteps(0);
                        }}
                    />
                </label>
                <label>
                    Target value
                    <input
                        type="number"
                        min="-100"
                        max="100"
                        value={target}
                        onChange={(event) => chooseTarget(Number(event.target.value))}
                    />
                </label>
                <button className="button dark" onClick={() => chooseTarget(1)}>
                    Best case (first)
                </button>
                <button className="button dark" onClick={() => chooseTarget(-1)}>
                    Worst case (absent)
                </button>
            </div>
            <ol className="complexity-array" aria-label="Array and current comparison">
                {frame.values.map((value, index) => (
                    <li key={index} aria-current={frame.index === index ? 'step' : undefined}>
                        <small>index {index}</small>
                        <strong>{value}</strong>
                        {index < frame.comparisons && (
                            <span>
                                {frame.index === index && frame.found ? 'Found' : 'Checked'}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
            <p role="status">
                {size === 0
                    ? 'Empty array: return −1, with no element comparisons.'
                    : frame.done
                      ? frame.found
                          ? `Found at index ${frame.index}.`
                          : 'Target absent: return −1.'
                      : 'Ready for the next comparison.'}{' '}
                Comparisons: {frame.comparisons}. Current index: {frame.index ?? 'none'}.
            </p>
            <div className="complexity-controls">
                <button
                    className="button primary"
                    disabled={frame.done}
                    onClick={() => setSteps((value) => value + 1)}
                >
                    Compare next element
                </button>
                <button className="button dark" onClick={() => setSteps(0)}>
                    Reset search
                </button>
            </div>
            <p>
                For n = {size}: best-case element comparisons {size ? 1 : 0}; worst-case element
                comparisons {size}. Loop-control operations are deliberately not counted in this
                model.
            </p>
        </section>
    );
}

function GrowthLab() {
    const [n, setN] = useState(8);
    const samples = Array.from({ length: 20 }, (_, index) => index + 1);
    const x = (value) => 45 + ((value - 1) / 19) * 500;
    const y = (value) => 230 - (Math.log10(1 + value) / Math.log10(1 + 2 ** 20)) * 200;
    return (
        <section aria-labelledby="growth-lab-title">
            <h3 id="growth-lab-title">Compare representative growth functions</h3>
            <p>
                These curves illustrate growth classes, not exact measured runtimes. The vertical
                axis is logarithmic: log₁₀(1 + work). Equal vertical distances represent
                multiplicative changes, not equal numbers of operations. The table gives
                untransformed values.
            </p>
            <label>
                Input size n: {n}
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={n}
                    onChange={(event) => setN(Number(event.target.value))}
                />
            </label>
            <svg
                viewBox="0 0 580 270"
                role="img"
                aria-labelledby="growth-chart-title growth-chart-desc"
            >
                <title id="growth-chart-title">Six growth functions, input sizes 1 to 20</title>
                <desc id="growth-chart-desc">
                    The exponential curve increases most rapidly. Exact values at the selected input
                    are listed below. Dashed line patterns distinguish curves without relying on
                    colour.
                </desc>
                <path d="M45 25 V230 H550" fill="none" stroke="currentColor" />
                {[0, 2, 4, 6].map((tick) => (
                    <text
                        key={tick}
                        x="5"
                        y={230 - (tick / Math.log10(1 + 2 ** 20)) * 200}
                        fill="currentColor"
                        fontSize="11"
                    >
                        {tick}
                    </text>
                ))}
                {growthFunctions.map((item, index) => (
                    <polyline
                        key={item.label}
                        fill="none"
                        stroke="var(--color-primary-hover)"
                        strokeWidth="2"
                        strokeDasharray={index ? `${index * 3} ${index + 2}` : undefined}
                        points={samples
                            .map((value) => `${x(value)},${y(item.evaluate(value))}`)
                            .join(' ')}
                    />
                ))}
                <path
                    d={`M${x(n)} 25 V230`}
                    stroke="var(--color-secondary)"
                    strokeDasharray="3 3"
                />
                <text x="45" y="255" fill="currentColor">
                    n = 1
                </text>
                <text x="500" y="255" fill="currentColor">
                    n = 20
                </text>
            </svg>
            <table>
                <caption>Representative values at n = {n}</caption>
                <thead>
                    <tr>
                        <th scope="col">Function (curve pattern)</th>
                        <th scope="col">Work units</th>
                    </tr>
                </thead>
                <tbody>
                    {growthFunctions.map((item, index) => (
                        <tr key={item.label}>
                            <th scope="row">
                                {item.label} (
                                {index ? `dash ${index * 3}, gap ${index + 2}` : 'solid'})
                            </th>
                            <td>{Number(item.evaluate(n).toFixed(3)).toLocaleString('en-US')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p>
                At n = 1, log₂ n is zero; asymptotic classification does not require representative
                functions to match actual instruction counts on every small input.
            </p>
        </section>
    );
}

function BoundsLab() {
    const [n, setN] = useState(1);
    const bounds = linearBounds(n);
    const rows = [0, 1, 2, 5, 10];
    const x = (value) => 45 + (value / 12) * 500;
    const y = (value) => 230 - (value / 120) * 200;
    return (
        <section aria-labelledby="bounds-lab-title">
            <h3 id="bounds-lab-title">Find the threshold for 3n + 7</h3>
            <p>
                With c₁ = 3 and c₂ = 10, the bounds hold for every integer n ≥ n₀ = 1. Moving n to
                zero demonstrates why this chosen pair does not work there. Empty input is still
                valid for linear search.
            </p>
            <label>
                Input size n: {n}
                <input
                    type="range"
                    min="0"
                    max="12"
                    value={n}
                    onChange={(event) => setN(Number(event.target.value))}
                />
            </label>
            <svg viewBox="0 0 580 270" role="img" aria-labelledby="bounds-chart-title">
                <title id="bounds-chart-title">3n, 3n plus 7, and 10n; threshold n equals 1</title>
                <path d="M45 25 V230 H550" fill="none" stroke="currentColor" />
                {[
                    { value: (v) => 3 * v, dash: '2 4' },
                    { value: (v) => 3 * v + 7, dash: undefined },
                    { value: (v) => 10 * v, dash: '9 4' }
                ].map((line, index) => (
                    <path
                        key={index}
                        d={`M${x(0)} ${y(line.value(0))} L${x(12)} ${y(line.value(12))}`}
                        stroke="var(--color-primary-hover)"
                        strokeWidth="2"
                        strokeDasharray={line.dash}
                    />
                ))}
                <path
                    d={`M${x(1)} 25 V230`}
                    stroke="var(--color-secondary)"
                    strokeDasharray="3 3"
                />
                <text x={x(1) + 4} y="20" fill="currentColor">
                    n₀ = 1
                </text>
                <text x="45" y="255" fill="currentColor">
                    n = 0
                </text>
                <text x="500" y="255" fill="currentColor">
                    n = 12
                </text>
            </svg>
            <p role="status">
                {bounds.lower} ≤ {bounds.work} ≤ {bounds.upper}:{' '}
                {bounds.holds ? 'holds' : 'does not hold'}. This is an illustrative operation-count
                function, not an exact count of the search implementation.
            </p>
            <table>
                <caption>Lower bound (dotted), model (solid), upper bound (dashed)</caption>
                <thead>
                    <tr>
                        <th scope="col">n</th>
                        <th scope="col">3n</th>
                        <th scope="col">3n + 7</th>
                        <th scope="col">10n</th>
                        <th scope="col">Bounds hold?</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((value) => {
                        const row = linearBounds(value);
                        return (
                            <tr key={value}>
                                <th scope="row">{value}</th>
                                <td>{row.lower}</td>
                                <td>{row.work}</td>
                                <td>{row.upper}</td>
                                <td>{row.holds ? 'Yes' : 'No'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </section>
    );
}

export function ComplexityLab() {
    return (
        <div className="complexity-lab">
            <SearchLab />
            <GrowthLab />
            <BoundsLab />
        </div>
    );
}
