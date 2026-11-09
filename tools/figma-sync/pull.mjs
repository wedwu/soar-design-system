// Pull Figma variables into packages/tokens/figma/export.json.
//
//   FIGMA_TOKEN=... FIGMA_FILE_KEY=... node tools/figma-sync/pull.mjs
//   node tools/figma-sync/pull.mjs --from-file ~/Downloads/variables.json
//   node tools/figma-sync/pull.mjs --push-code-syntax
//
// The Variables REST API needs a Figma Enterprise seat with the
// file_variables:read scope (and file_variables:write for --push-code-syntax).
// On other plans, export the same JSON shape with a plugin and use --from-file.
//
// The file is written canonically (sorted keys, volatile fields dropped) so a
// sync with no design change produces no diff. A report of what changed and
// which WA properties are affected goes to reports/figma-diff.md, which the
// figma-sync workflow posts as the PR body.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { diffFigma, figmaReport } from '../../packages/tokens/src/diff.mjs';
import { canonicalize } from '../../packages/tokens/src/canonicalize.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPORT = join(ROOT, 'packages/tokens/figma/export.json');
const REL = 'packages/tokens/figma/export.json';
const API = 'https://api.figma.com/v1';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

export { canonicalize };

async function fetchVariables() {
  const token = process.env.FIGMA_TOKEN;
  const file = process.env.FIGMA_FILE_KEY;
  if (!token || !file) throw new Error('Set FIGMA_TOKEN and FIGMA_FILE_KEY, or pass --from-file <path>.');
  const res = await fetch(`${API}/files/${file}/variables/local`, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  return res.json();
}

function previousExport() {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${REL}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

// Writes our CSS names into Figma's Dev Mode code syntax, so designers and
// engineers see `var(--ax-color-brand-50)` when inspecting a frame.
async function pushCodeSyntax() {
  const mapping = JSON.parse(readFileSync(join(ROOT, 'packages/tokens/build/figma/code-syntax.json'), 'utf8'));
  const res = await fetch(`${API}/files/${process.env.FIGMA_FILE_KEY}/variables`, {
    method: 'POST',
    headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables: mapping.map(({ id, codeSyntax }) => ({ action: 'UPDATE', id, codeSyntax })) }),
  });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  console.log(`Pushed code syntax for ${mapping.length} variables.`);
}

// Compare URLs, not strings: works on Windows too.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain && flag('--push-code-syntax')) {
  await pushCodeSyntax();
} else if (isMain) {
  const raw = opt('--from-file') ? JSON.parse(readFileSync(resolve(opt('--from-file')), 'utf8')) : await fetchVariables();
  const next = canonicalize(raw);
  writeFileSync(EXPORT, JSON.stringify(next, null, 2) + '\n');

  const prev = previousExport();
  const report = prev ? figmaReport(diffFigma(prev, next)) : '## Figma token changes\n\nInitial import.\n';
  mkdirSync(join(ROOT, 'reports'), { recursive: true });
  writeFileSync(join(ROOT, 'reports/figma-diff.md'), report);
  process.stdout.write(report);
}
