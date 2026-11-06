import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const css = await readFile(new URL('../frontend/src/styles/tokens.css', import.meta.url), 'utf8');
const palette = (text) => Object.fromEntries([...text.matchAll(/--(color-[\w-]+):\s*(#[\da-f]+);/gi)].map((match) => [match[1], match[2]]));
const dark = palette(css.split(':root[data-theme="light"]')[0]);
const light = { ...dark, ...palette(css.split(':root[data-theme="light"]')[1] || '') };
const luminance = (hex) => {
  const [r, g, b] = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
};
const contrast = (tokens, one, two) => { const a = luminance(tokens[one]); const b = luminance(tokens[two]); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
test('dark and light normal text, links, statuses and action labels meet AA', () => {
  for (const tokens of [dark, light]) {
  for (const background of ['color-background', 'color-surface', 'color-code']) {
    for (const foreground of ['color-text-primary', 'color-text-secondary', 'color-text-muted', 'color-primary-hover', 'color-success', 'color-warning', 'color-error']) {
      assert.ok(contrast(tokens, foreground, background) >= 4.5, `${foreground} on ${background} fails normal-text contrast`);
    }
  }
  assert.ok(contrast(tokens, 'color-on-primary', 'color-primary-action') >= 4.5);
  assert.ok(contrast(tokens, 'color-background', 'color-primary-hover') >= 4.5);
  assert.ok(contrast(tokens, 'color-control-border', 'color-surface') >= 3);
  }
});
test('component styles consume tokens rather than separate hexadecimal palettes', async () => {
  for (const file of ['app.css', 'reading.css', 'roadmap.css', 'theme.css', 'preferences.css', 'settings.css', 'practice.css']) {
    assert.doesNotMatch(await readFile(new URL(`../frontend/src/styles/${file}`, import.meta.url), 'utf8'), /#[\da-f]{3,8}\b/i);
  }
});
