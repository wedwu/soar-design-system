import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize } from '../src/normalize.mjs';

const tokens = normalize(JSON.parse(readFileSync(new URL('../figma/export.json', import.meta.url), 'utf8')));
const value = (name) => tokens.find((t) => t.name === name)?.values.base;

test('breakpoints are all rem, so they scale consistently with browser zoom', () => {
  const bps = tokens.filter((t) => t.name.startsWith('breakpoint/'));
  assert.ok(bps.length > 0);
  for (const t of bps) assert.match(t.values.base, /^\d+(\.\d+)?rem$/, `${t.name} = ${t.values.base}`);
  assert.equal(value('breakpoint/lg'), '64rem');
});

test('only the 9999 "fully rounded" sentinel stays in px', () => {
  assert.equal(value('radius/pill'), '9999px');
  assert.equal(value('space/5xl'), '5rem');
});
