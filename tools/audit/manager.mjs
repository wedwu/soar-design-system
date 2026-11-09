#!/usr/bin/env node
// Component audit manager.
//
//   npm run audit:components                   every check (a11y needs a built Storybook + installed browser)
//   npm run check:ownership                    fast: everything except a11y (no browser)
//   node tools/audit/manager.mjs --only tokens,wa-deps
//   node tools/audit/manager.mjs --require a11y   fail if a11y can't run (CI)
//
// Discovers every component, runs each applicable check, and writes:
//   reports/audit.json   full results (also copied into storybook-static/audit/
//                        so the Storybook "Component Audit" page can show them)
//   reports/audit.md     summary for the CI job summary / PR
// Exits 1 if any check reports an error (registered exceptions don't count).

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContext, storyPrefix } from './context.mjs';
import { toMarkdown } from './report.mjs';
import system from './checks/system.mjs';
import tokens from './checks/tokens.mjs';
import waDeps from './checks/wa-deps.mjs';
import upstream from './checks/upstream.mjs';
import a11y from './checks/a11y.mjs';
import exceptions from './checks/exceptions.mjs';
import docs from './checks/docs.mjs';
import tests from './checks/tests.mjs';
import { pathToFileURL } from 'node:url';

/** Column order on the scorecard. Docs and tests only ever warn: they never block. */
export const CHECKS = [system, tokens, waDeps, upstream, a11y, exceptions, docs, tests];

const SEVERITY = { error: 3, warn: 2, excepted: 1, info: 0 };

/** pass | warn | fail | skipped | n/a for one cell. */
function statusOf(findings, skipped) {
  if (skipped) return 'skipped';
  if (findings.some((f) => f.level === 'error')) return 'fail';
  if (findings.some((f) => f.level === 'warn')) return 'warn';
  return 'pass';
}

export async function runAudit({ only, skip = [], require = [], log = () => {} } = {}) {
  const ctx = loadContext();
  const selected = CHECKS.filter((c) => (!only || only.includes(c.id)) && !skip.includes(c.id));

  // Rows: every component, plus the token system and the documentation pages.
  const rows = [
    ...ctx.components.map((c) => ({
      id: c.id,
      tag: c.tag,
      name: c.name,
      layer: c.layer,
      owner: c.owner,
      docs: c.storyTitle ? `${storyPrefix(c.storyTitle)}--docs` : null,
      results: {},
    })),
    { id: 'system', tag: null, name: 'Token system', layer: 'system', owner: 'soar', docs: 'guides-figma-generation--docs', results: {} },
    { id: 'docs', tag: null, name: 'Docs pages & other stories', layer: 'system', owner: 'soar', docs: 'introduction--docs', results: {} },
  ];
  const rowById = new Map(rows.map((r) => [r.id, r]));
  const checkMeta = [];

  for (const check of CHECKS) {
    const ran = selected.includes(check);
    const meta = { id: check.id, title: check.title, description: check.description, ran };
    checkMeta.push(meta);
    if (!ran) {
      for (const row of rows) row.results[check.id] = { status: 'skipped', findings: [], note: 'Not run (--only/--skip).' };
      continue;
    }
    const started = Date.now();
    log(`→ ${check.title}`);

    if (check.scope === 'system') {
      const out = await check.run(ctx);
      const findings = Array.isArray(out) ? out : (out.findings ?? []);
      meta.meta = out.meta;
      if (out.skipped) {
        meta.skipped = out.skipped;
        meta.details = out.details;
        const required = require.includes(check.id);
        for (const row of rows) {
          row.results[check.id] = required
            ? { status: 'fail', findings: [{ level: 'error', rule: 'not-run', message: `Required check couldn't run: ${out.skipped}` }] }
            : { status: 'skipped', findings: [], note: out.skipped };
        }
      } else {
        // System-scope checks attribute findings to components; the rest go to the "system" row.
        const byRow = new Map(rows.map((r) => [r.id, []]));
        for (const f of findings) byRow.get(rowById.has(f.component) ? f.component : check.id === 'a11y' ? 'docs' : 'system').push(f);
        for (const row of rows) {
          const fs = byRow.get(row.id);
          const applies = check.id === 'system' ? row.id === 'system' : check.id === 'a11y' ? row.id !== 'system' : true;
          row.results[check.id] = applies || fs.length ? { status: statusOf(fs), findings: fs } : { status: 'n/a', findings: [] };
        }
      }
    } else {
      for (const row of rows) {
        const component = ctx.components.find((c) => c.id === row.id);
        if (!component || !check.appliesTo.includes(component.layer)) {
          row.results[check.id] = { status: 'n/a', findings: [] };
          continue;
        }
        const fs = await check.run(component, ctx);
        const skippedNote = fs.find((f) => f.level === 'skipped');
        row.results[check.id] = skippedNote
          ? { status: 'skipped', findings: [], note: skippedNote.message }
          : { status: statusOf(fs), findings: fs };
      }
    }
    meta.ms = Date.now() - started;
  }

  for (const row of rows) {
    const statuses = Object.values(row.results).map((r) => r.status);
    row.status = statuses.includes('fail') ? 'fail' : statuses.includes('warn') ? 'warn' : 'pass';
  }

  const all = rows.flatMap((r) => Object.values(r.results).flatMap((x) => x.findings));
  const report = {
    generatedAt: new Date().toISOString(),
    webAwesome: ctx.upstream.version,
    checks: checkMeta,
    summary: {
      components: ctx.components.length,
      failing: rows.filter((r) => r.status === 'fail').length,
      warning: rows.filter((r) => r.status === 'warn').length,
      errors: all.filter((f) => f.level === 'error').length,
      warnings: all.filter((f) => f.level === 'warn').length,
      excepted: all.filter((f) => f.level === 'excepted').length,
    },
    rows,
    exceptions: ctx.registry.exceptions ?? [],
  };
  return report;
}

export function writeReport(report) {
  const dir = join(ROOT, 'reports');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(dir, 'audit.md'), toMarkdown(report));
  // Publish into the built Storybook so its "Component Audit" page can load it.
  const sb = join(ROOT, 'apps/storybook/storybook-static');
  if (existsSync(sb)) {
    mkdirSync(join(sb, 'audit'), { recursive: true });
    copyFileSync(join(dir, 'audit.json'), join(sb, 'audit', 'audit.json'));
  }
}

function printSummary(report) {
  const icon = { pass: '✓', warn: '!', fail: '✗', skipped: '–', 'n/a': ' ' };
  const ids = report.checks.map((c) => c.id);
  const width = Math.max(...report.rows.map((r) => r.name.length));
  // Wide enough for the longest check id or status ("✓ skipped"), plus a gap.
  const col = Math.max(...ids.map((id) => id.length), '– skipped'.length) + 2;
  console.log(`\n${'Component'.padEnd(width)}  ${ids.map((id) => id.padEnd(col)).join('')}`);
  for (const row of report.rows) {
    console.log(`${row.name.padEnd(width)}  ${ids.map((id) => `${icon[row.results[id].status]} ${row.results[id].status}`.padEnd(col)).join('')}`);
  }
  const findings = report.rows.flatMap((r) =>
    Object.entries(r.results).flatMap(([check, res]) => res.findings.filter((f) => f.level === 'error' || f.level === 'warn').map((f) => ({ ...f, check, row: r.name }))),
  );
  findings.sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level]);
  if (findings.length) console.log('');
  for (const f of findings) console.log(`${f.level === 'error' ? 'error' : 'warn '} [${f.check}/${f.rule}] ${f.row}: ${f.message}${f.file ? `  (${f.file})` : ''}`);
  for (const c of report.checks.filter((c) => c.skipped)) console.log(`skip  [${c.id}] ${c.skipped}`);
  const s = report.summary;
  console.log(`\naudit: ${s.errors} error(s), ${s.warnings} warning(s), ${s.excepted} excepted · ${s.components} components · WA ${report.webAwesome}`);
}

// Run as a script (not imported). Compare URLs, not strings: works on Windows too.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const list = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1].split(',') : undefined);
  const report = await runAudit({ only: list('--only'), skip: list('--skip') ?? [], require: list('--require') ?? [], log: (m) => console.log(m) });
  writeReport(report);
  printSummary(report);
  process.exitCode = report.summary.errors ? 1 : 0;
}
