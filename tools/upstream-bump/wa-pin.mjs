// The Web Awesome version pin.
//
// npm has no "catalog", so the exact version is written in every workspace
// package that depends on Web Awesome, plus root `overrides` (which forces any
// transitive copy to the same version). This module keeps those in lockstep:
//   findPins()       every place the version is written
//   checkPins()      problems if they disagree (run by `npm run upstream:check`)
//   setPins(version) rewrite them all (run by `npm run upstream:bump -- --to x.y.z`)
//
// peerDependencies (the range consumers must satisfy, e.g. ~3.14.0) are not
// pins; bump.mjs widens those after re-snapshotting.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE = '@awesome.me/webawesome';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

function workspaceManifests() {
  const root = readJson(join(ROOT, 'package.json'));
  const files = [];
  for (const pattern of root.workspaces ?? []) {
    const base = join(ROOT, pattern.replace(/\/\*$/, ''));
    if (!existsSync(base)) continue;
    for (const dir of readdirSync(base)) {
      const file = join(base, dir, 'package.json');
      if (existsSync(file)) files.push(file);
    }
  }
  return files;
}

/** [{ file, field, version }] for root overrides and every dependencies/devDependencies entry. */
export function findPins() {
  const pins = [];
  const rootFile = join(ROOT, 'package.json');
  const root = readJson(rootFile);
  if (root.overrides?.[PACKAGE]) pins.push({ file: rootFile, field: 'overrides', version: root.overrides[PACKAGE] });
  for (const file of workspaceManifests()) {
    const pkg = readJson(file);
    for (const field of ['dependencies', 'devDependencies']) {
      if (pkg[field]?.[PACKAGE]) pins.push({ file, field, version: pkg[field][PACKAGE] });
    }
  }
  return pins;
}

/** Human-readable problems; empty when every pin is the same exact version. */
export function checkPins() {
  const pins = findPins();
  const problems = [];
  if (!pins.some((p) => p.field === 'overrides')) problems.push(`root package.json has no overrides["${PACKAGE}"]`);
  const exact = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
  for (const p of pins) {
    if (!exact.test(p.version)) problems.push(`${rel(p.file)} ${p.field}: "${p.version}" must be an exact version, not a range`);
  }
  const versions = [...new Set(pins.map((p) => p.version))];
  if (versions.length > 1) {
    problems.push(`Web Awesome is pinned to different versions: ${pins.map((p) => `${rel(p.file)} (${p.field}) ${p.version}`).join(', ')}`);
  }
  return { problems, version: versions[0] };
}

/** Rewrite every pin to `version`. Returns the files changed. */
export function setPins(version) {
  const changed = new Set();
  for (const { file, field } of findPins()) {
    const pkg = readJson(file);
    if (pkg[field][PACKAGE] !== version) {
      pkg[field][PACKAGE] = version;
      writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
      changed.add(rel(file));
    }
  }
  return [...changed];
}

const rel = (file) => relative(ROOT, file).split('\\').join('/');
