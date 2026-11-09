// Design lint on what users actually see. Colors are resolved the way the
// browser will: owned --wa-* properties through Figma, inherited ones through
// Web Awesome's defaults. A Figma sync or WA upgrade that breaks contrast
// fails CI here, before it reaches a component.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createResolver, contrast, luminance } from '../src/effective.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const { wa } = createResolver({ exportJson: read('../figma/export.json'), upstream: read('../upstream/webawesome.tokens.json') });

const AA = 4.5;
const MODES = ['light', 'dark'];
const VARIANTS = ['brand', 'neutral', 'success', 'warning', 'danger'];

// Text on every variant fill, at every emphasis: what badges, buttons, tags,
// callouts and the rest render.
for (const mode of MODES) {
  for (const v of VARIANTS) {
    for (const level of ['loud', 'normal', 'quiet']) {
      const fg = `--wa-color-${v}-on-${level}`;
      const bg = `--wa-color-${v}-fill-${level}`;
      test(`${fg} on ${bg} (${mode}) meets WCAG AA`, () => {
        const ratio = contrast(wa(fg, mode), wa(bg, mode));
        assert.ok(ratio >= AA, `${wa(fg, mode)} on ${wa(bg, mode)} is ${ratio.toFixed(2)}:1, needs ${AA}:1`);
      });
    }
  }
}

// Body text on surfaces.
for (const mode of MODES) {
  for (const fg of ['--wa-color-text-normal', '--wa-color-text-quiet', '--wa-color-text-link']) {
    for (const bg of ['--wa-color-surface-default', '--wa-color-surface-raised']) {
      test(`${fg} on ${bg} (${mode}) meets WCAG AA`, () => {
        const ratio = contrast(wa(fg, mode), wa(bg, mode));
        assert.ok(ratio >= AA, `${ratio.toFixed(2)}:1 < ${AA}:1`);
      });
    }
  }
}

test('color ramps get darker at every step', () => {
  const steps = ['95', '90', '80', '70', '60', '50', '40', '30', '20', '10', '05'];
  for (const hue of VARIANTS) {
    const l = steps.map((s) => luminance(wa(`--wa-color-${hue}-${s}`, 'light')));
    for (let i = 1; i < l.length; i++) assert.ok(l[i] < l[i - 1], `${hue}-${steps[i]} is not darker than ${hue}-${steps[i - 1]}`);
  }
});
