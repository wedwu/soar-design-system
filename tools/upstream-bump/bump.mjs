// Web Awesome release intake.
//
//   npm run upstream:check                    CI: fail if installed WA != committed snapshot,
//                                             or if the version pins disagree
//   npm run upstream:bump                     re-snapshot the installed WA and report
//   npm run upstream:bump -- --to 3.15.0      set the version pins, install, then bump
//
// What "bump" does, in order:
//   1. (with --to) rewrites every Web Awesome version pin (see wa-pin.mjs), runs npm install
//   2. extracts tokens + parts from the installed package into a temp dir
//   3. diffs them against the committed snapshot -> reports/upstream-diff.md
//   4. writes the new snapshot and widens peerDependencies to ~X.Y.Z
//   5. runs the audit, which fails on anything a human has to decide:
//      unclassified new properties, removed owned properties, removed parts we
//      style, changed layer order
//
// Nothing here edits alias-map.mjs, inherited.json or parts.css. Those are
// decisions, and they show up as hand-written lines in the bump PR.

import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extract, locateWebAwesome, writeSnapshots } from './extract.mjs';
import { checkPins, setPins } from './wa-pin.mjs';
import { diffUpstream, upstreamReport } from '../../packages/tokens/src/diff.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SNAP_DIR = join(ROOT, 'packages/tokens/upstream');
const PEER_PACKAGES = ['packages/theme', 'packages/components', 'packages/cdn', 'packages/soar'];

const args = process.argv.slice(2);
const check = args.includes('--check');
const to = args.includes('--to') ? args[args.indexOf('--to') + 1] : undefined;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const committed = {
  tokens: readJson(join(SNAP_DIR, 'webawesome.tokens.json')),
  parts: readJson(join(SNAP_DIR, 'webawesome.parts.json')),
};

if (to) {
  const changed = setPins(to);
  console.log(`upstream: pinned Web Awesome ${to} in ${changed.length} file(s): ${changed.join(', ') || '(already pinned)'}`);
  // execSync runs through a shell, so it finds npm.cmd on Windows too.
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
}

const installed = extract(locateWebAwesome());

if (check) {
  // npm has no catalog: make sure every package states the same exact version.
  const pins = checkPins();
  if (pins.problems.length) {
    for (const p of pins.problems) console.error(`upstream: ${p}`);
    console.error('upstream: fix with `npm run upstream:bump -- --to <version>`, which rewrites every pin together.');
    process.exitCode = 1;
  } else if (pins.version !== installed.tokens.version) {
    console.error(`upstream: package.json pins Web Awesome ${pins.version}, but ${installed.tokens.version} is installed. Run \`npm install\`.`);
    process.exitCode = 1;
  }

  const same =
    installed.tokens.version === committed.tokens.version &&
    JSON.stringify(installed.tokens) === JSON.stringify(committed.tokens) &&
    JSON.stringify(installed.parts) === JSON.stringify(committed.parts);
  if (same) {
    console.log(`upstream: snapshot matches installed Web Awesome ${installed.tokens.version}`);
  } else {
    const d = diffUpstream(committed, installed);
    process.stdout.write(upstreamReport(d));
    console.error(
      `\nupstream: installed Web Awesome ${installed.tokens.version} doesn't match the committed snapshot ` +
        `(${committed.tokens.version}). Run \`npm run upstream:bump\`, review reports/upstream-diff.md, ` +
        `classify anything new, and commit the result.`,
    );
    process.exitCode = 1;
  }
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'wa-snapshot-'));
  writeSnapshots(installed, tmp);
  const d = diffUpstream(committed, installed);
  const report = upstreamReport(d);
  mkdirSync(join(ROOT, 'reports'), { recursive: true });
  writeFileSync(join(ROOT, 'reports/upstream-diff.md'), report);
  process.stdout.write(report);

  writeSnapshots(installed, SNAP_DIR);
  const range = `~${installed.tokens.version}`;
  for (const dir of PEER_PACKAGES) {
    const file = join(ROOT, dir, 'package.json');
    const pkg = readJson(file);
    if (pkg.peerDependencies?.['@awesome.me/webawesome']) {
      pkg.peerDependencies['@awesome.me/webawesome'] = range;
      writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    }
  }

  console.log(`\nupstream: snapshot updated to ${installed.tokens.version}; peerDependencies set to ${range}. Rebuilding tokens and auditing...\n`);
  execSync('npm run tokens', { cwd: ROOT, stdio: 'inherit' });
  try {
    execFileSync('node', ['tools/audit/manager.mjs', '--skip', 'a11y'], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('\nupstream: audit found decisions to make (above). Resolve them in alias-map.mjs / inherited.json / parts.css, then re-run `npm run check:ownership`.');
    process.exitCode = 1;
  }
}
