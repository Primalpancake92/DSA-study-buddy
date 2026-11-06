import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const css = await readFile(new URL('../frontend/src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--(color-[\w-]+):\s*(#[\da-f]+);/gi)].map((match) => [match[1], match[2]]));
const luminance = (hex) => {
  const [r, g, b] = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
};
const contrast = (one, two) => { const a = luminance(tokens[one]); const b = luminance(tokens[two]); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
test('Midnight Indigo normal text, links, statuses and action labels meet AA', () => {
  for (const background of ['color-background', 'color-surface', 'color-code']) {
    for (const foreground of ['color-text-primary', 'color-text-secondary', 'color-text-muted', 'color-primary-hover', 'color-success', 'color-warning', 'color-error']) {
      assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background} fails normal-text contrast`);
    }
  }
  assert.ok(contrast('color-on-primary', 'color-primary-action') >= 4.5);
  assert.ok(contrast('color-background', 'color-primary-hover') >= 4.5);
  assert.ok(contrast('color-control-border', 'color-surface') >= 3);
});
test('component styles consume tokens rather than separate hexadecimal palettes', async () => {
  for (const file of ['app.css', 'reading.css', 'roadmap.css', 'theme.css']) {
    assert.doesNotMatch(await readFile(new URL(`../frontend/src/styles/${file}`, import.meta.url), 'utf8'), /#[\da-f]{3,8}\b/i);
  }
});
