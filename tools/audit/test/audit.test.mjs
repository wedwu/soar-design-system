import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContext } from '../context.mjs';
import { parseRules } from '../../lib/css.mjs';
import { auditSources } from '../checks/tokens.mjs';
import exceptions from '../checks/exceptions.mjs';
import { ownerOf } from '../checks/a11y.mjs';
import { runAudit } from '../manager.mjs';

const ctx = loadContext();
const source = (css) => [{ file: 'test.css', css, rules: parseRules(css) }];

test('the repo passes the fast audit (everything except the browser check)', async () => {
  const report = await runAudit({ skip: ['a11y'] });
  const errors = report.rows.flatMap((r) => Object.values(r.results).flatMap((x) => x.findings.filter((f) => f.level === 'error')));
  assert.deepEqual(errors, []);
  assert.ok(report.summary.components >= 27);
});

test('discovers atoms, molecules and organisms without a hand-kept list', () => {
  const byLayer = Object.groupBy(ctx.components, (c) => c.layer);
  assert.ok(byLayer.atom.length >= 24);
  assert.ok(byLayer.molecule.some((c) => c.tag === 'ax-control-info'));
  assert.ok(byLayer.organism.some((c) => c.tag === 'ax-data-table'));
  assert.deepEqual(ctx.components.find((c) => c.tag === 'wa-tab-group').tags, ['wa-tab-group', 'wa-tab', 'wa-tab-panel']);
});

test('tokens: raw values, token writes and unknown parts are errors', () => {
  const f = auditSources(source(`wa-card::part(headr) { color: #ff0000; --wa-space-m: 2rem; margin: var(--wa-spacee-m); }`), ctx);
  const rules = f.filter((x) => x.level === 'error').map((x) => x.rule).sort();
  assert.deepEqual(rules, ['no-literals', 'no-literals', 'reference', 'reference', 'single-writer']);
});

test('tokens: a registered audit-allow marker turns a raw value into an exception', () => {
  const f = auditSources(source(`wa-drawer { --size: 30rem; /* audit-allow drawer-width-no-token */ }`), ctx);
  assert.equal(f.length, 1);
  assert.equal(f[0].level, 'excepted');
  assert.equal(f[0].exception, 'drawer-width-no-token');
});

test('tokens: an allowance covers only its own line', () => {
  const f = auditSources(source(`wa-card::part(body) { padding: 12px; }\nwa-badge::part(base) { padding: 3px; /* audit-allow some-id */ }`), ctx);
  assert.deepEqual(f.map((x) => x.level).sort(), ['error', 'excepted']);
});

test('exceptions: incomplete, unknown, expired and unregistered entries are reported', () => {
  const f = exceptions.run({
    ...ctx,
    today: '2030-01-01',
    registry: {
      exceptions: [
        { id: 'no-reason', check: 'tokens', component: 'wa-drawer', owner: '@x', review: '2031-01-01' },
        { id: 'expired', check: 'tokens', component: 'wa-drawer', reason: 'r', owner: '@x', review: '2029-12-31' },
        { id: 'bad-check', check: 'colors', component: 'wa-drawer', reason: 'r', owner: '@x', review: '2031-01-01' },
      ],
    },
    partsCss: { file: 'parts.css', css: 'wa-x { width: 1rem; /* audit-allow not-registered */ }' },
  });
  const rules = new Set(f.map((x) => x.rule));
  for (const r of ['incomplete', 'expired', 'unknown-check', 'unregistered']) assert.ok(rules.has(r), `expected ${r}`);
});

test('a11y: stories are attributed to the most specific component title', () => {
  const owner = (title) => ownerOf({ title }, ctx.components);
  assert.equal(owner('Atoms/Dropdown'), 'wa-dropdown');
  assert.equal(owner('Atoms/Dropdown Limitations'), 'wa-dropdown');
  assert.equal(owner('Molecules/Control Info'), 'ax-control-info');
  assert.equal(owner('Guides/Slots'), 'docs');
});
