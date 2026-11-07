import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ComplexityLab } from './ComplexityLab.jsx';

it('renders labelled, keyboard-operable search, growth and bounds controls', () => {
    const html = renderToStaticMarkup(<ComplexityLab />);
    expect(html).toContain('Step through linear search');
    expect(html).toContain('Compare next element');
    expect(html).toContain('Best case (first)');
    expect(html).toContain('Worst case (absent)');
    expect(html).toContain('Reset search');
    expect(html).toContain('representative growth functions');
    expect(html).toContain('logarithmic');
    expect(html).toContain('n₀ = 1');
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html.match(/type="range"/g)).toHaveLength(3);
    expect(html).toContain('<caption>Representative values at n = 8</caption>');
    expect(html).not.toMatch(/NaN|Infinity/);
});
