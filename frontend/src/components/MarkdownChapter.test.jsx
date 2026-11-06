import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { MarkdownChapter, lessonLink } from './MarkdownChapter.jsx';

const ready = { ready: true, saving: false, completedCheckpoints: [] };
function render(markdown, progress = ready) {
  return renderToStaticMarkup(<StaticRouter location="/app/weeks/1"><MarkdownChapter markdown={markdown} weekId={1} progress={progress} onToggle={() => {}} /></StaticRouter>);
}
const inputs = (html) => html.match(/<input\b[^>]*>/g) || [];

describe('protected Markdown rendering', () => {
  it('renders all sixteen actual chapters with tables, code and keyed checkboxes', () => {
    for (let week = 1; week <= 16; week++) {
      const markdown = readFileSync(new URL(`../../../docs/weekly_content/week-${String(week).padStart(2, '0')}.md`, import.meta.url), 'utf8');
      const html = renderToStaticMarkup(<StaticRouter><MarkdownChapter markdown={markdown} weekId={week} progress={ready} onToggle={() => {}} /></StaticRouter>);
      expect(html).toContain(`Week ${week} - `);
      expect(html).toContain('language-javascript');
      expect(html).toContain('id="weekly-progress-checklist"');
      expect(inputs(html).length).toBe((markdown.match(/<!-- checkpoint:/g) || []).length);
      expect(inputs(html).every((input) => !input.includes('disabled'))).toBe(true);
    }
  });

  it('gives subheadings stable anchors and sends source citations to GitHub', () => {
    expect(render('### A useful invariant\n\nExplanation.')).toContain('id="a-useful-invariant"');
    expect(lessonLink('../../shared/curriculum.js')).toBe('https://github.com/Primalpancake92/DSA-study-buddy/blob/main/shared/curriculum.js');
  });
  it('removes raw executable HTML and unsafe URLs while preserving safe content', () => {
    const html = render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<iframe src="https://example.com"></iframe>\n\n[bad](javascript:alert%281%29) [data](data:text/html,attack) [safe](https://example.com)\n\n**Useful explanation**');
    expect(html).not.toMatch(/<script|<iframe|<img|onerror|href="(?:javascript|data):/i);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('<strong>Useful explanation</strong>');
  });

  it('escapes code and renders diagrams as text without executing them', () => {
    const html = render('```javascript-bug\n<script>globalThis.compromised = true</script>\n```\n\n```text\nA -> B\n```');
    expect(html).toContain('language-javascript-bug');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('language-text');
    expect(globalThis.compromised).toBeUndefined();
  });

  it('rewrites local chapters to stable authenticated routes, preserving anchors', () => {
    for (const link of ['week-02.md#core-theory', './week-02.md#core-theory', 'docs/weekly_content/week-02.md#core-theory']) expect(lessonLink(link)).toBe('/app/weeks/2#core-theory');
    expect(render('[Next](week-02.md#core-theory)')).toContain('href="/app/weeks/2#core-theory"');
    for (const link of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,hello', 'vbscript:msgbox(1)']) expect(lessonLink(link)).toBe('');
    expect(lessonLink('#weekly-summary')).toBe('#weekly-summary');
  });

  it('renders GFM tables and restores checklist state from saved IDs, not Markdown ticks', () => {
    const html = render('| State | Value |\n| --- | --- |\n| head | 0 |\n\n- [ ] Saved <!-- checkpoint:w1-saved -->\n- [x] Not saved <!-- checkpoint:w1-unsaved -->', { ...ready, completedCheckpoints: ['w1-saved'] });
    expect(html).toContain('<table>');
    expect(html).toContain('<td>head</td>');
    expect(inputs(html)).toHaveLength(2);
    expect(inputs(html)[0]).toMatch(/checked=""/);
    expect(inputs(html)[1]).not.toMatch(/checked=""/);
    expect(inputs(html).every((input) => !input.includes('disabled'))).toBe(true);
  });

  it('disables all checkboxes before load and during writes', () => {
    const markdown = '- [ ] Explain <!-- checkpoint:w1-explain -->';
    for (const progress of [{ ...ready, ready: false }, { ...ready, saving: true }]) expect(inputs(render(markdown, progress))[0]).toContain('disabled=""');
  });

  it('disables unkeyed, duplicate, wrong-week and ambiguous checkpoint controls', () => {
    const html = render('- [ ] First <!-- checkpoint:w1-valid -->\n- [ ] Duplicate <!-- checkpoint:w1-valid -->\n- [ ] Other week <!-- checkpoint:w2-other -->\n- [ ] Missing\n- [ ] Ambiguous <!-- checkpoint:w1-one --> <!-- checkpoint:w1-two -->\n- [ ] Oversized <!-- checkpoint:w1-' + 'x'.repeat(121) + ' -->');
    const controls = inputs(html);
    expect(controls).toHaveLength(6);
    expect(controls[0]).not.toContain('disabled');
    expect(controls.slice(1).every((input) => input.includes('disabled=""'))).toBe(true);
  });
});
