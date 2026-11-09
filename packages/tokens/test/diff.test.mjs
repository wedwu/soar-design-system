import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diffFigma, diffUpstream } from '../src/diff.mjs';
import { build } from '../src/build.mjs';

const exportJson = JSON.parse(readFileSync(new URL('../figma/export.json', import.meta.url), 'utf8'));
const upstream = {
  tokens: JSON.parse(readFileSync(new URL('../upstream/webawesome.tokens.json', import.meta.url), 'utf8')),
  parts: JSON.parse(readFileSync(new URL('../upstream/webawesome.parts.json', import.meta.url), 'utf8')),
};
const clone = (x) => structuredClone(x);
const findVar = (exp, name) => Object.values(exp.meta.variables).find((v) => v.name === name);

test('a Figma rename of a mapped variable is blocking, not silent', () => {
  const next = clone(exportJson);
  findVar(next, 'color/brand/fill-loud').name = 'color/brand/fill-strong';
  const d = diffFigma(exportJson, next);
  assert.equal(d.renamed.length, 1);
  assert.match(d.blocking[0], /--wa-color-brand-fill-loud/);
  assert.throws(() => build({ exportJson: next, upstreamLayers: upstream.tokens.layers }), /color\/brand\/fill-loud/);
});

test('a Figma value change is reported with the WA properties it feeds', () => {
  const next = clone(exportJson);
  const v = findVar(next, 'space/m');
  v.valuesByMode[Object.keys(v.valuesByMode)[0]] = 18;
  const d = diffFigma(exportJson, next);
  assert.deepEqual(d.blocking, []);
  assert.equal(d.changed[0].to, '1.125rem');
  assert.deepEqual(d.changed[0].feeds, ['--wa-space-m']);
});

test('a new upstream property must be classified before merge', () => {
  const next = clone(upstream);
  next.tokens.version = '9.9.9';
  next.tokens.properties['--wa-color-brand-glow'] = { source: 'theme', light: 'var(--wa-color-brand-70)' };
  const d = diffUpstream(upstream, next);
  assert.equal(d.added[0].cls, 'unclassified');
  assert.equal(d.blocking.length, 1);
});

test('removing an owned upstream property is blocking; removing an inherited one is not', () => {
  const next = clone(upstream);
  delete next.tokens.properties['--wa-space-m'];
  delete next.tokens.properties['--wa-tooltip-arrow-size'];
  const d = diffUpstream(upstream, next);
  assert.equal(d.removed.length, 2);
  assert.equal(d.blocking.length, 1);
  assert.match(d.blocking[0], /--wa-space-m/);
});

test('upstream default changes on inherited properties are flagged as visual changes', () => {
  const next = clone(upstream);
  next.tokens.properties['--wa-panel-border-radius'].base = 'var(--wa-border-radius-m)';
  const d = diffUpstream(upstream, next);
  assert.equal(d.changed[0].cls, 'inherited');
  assert.deepEqual(d.blocking, []);
});
