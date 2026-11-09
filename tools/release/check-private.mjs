// Our packages never go to npmjs or any other registry. Apps install the
// @soar-awesome/soar tarball from our own static host instead
// (`npm run cdn:stage` packs it).
//
//   node tools/release/check-private.mjs      (CI, on every PR)
//
// Fails if any workspace package could be published: `"private": true` is what
// makes `npm publish` refuse, and a `publishConfig` or registry line means
// someone is setting publishing up again.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const errors = [];

const root = readJson(join(ROOT, 'package.json'));
const manifests = [join(ROOT, 'package.json')];
for (const pattern of root.workspaces ?? []) {
  const base = join(ROOT, pattern.replace(/\/\*$/, ''));
  if (!existsSync(base)) continue;
  for (const dir of readdirSync(base)) {
    const file = join(base, dir, 'package.json');
    if (existsSync(file)) manifests.push(file);
  }
}

for (const file of manifests) {
  const pkg = readJson(file);
  if (pkg.private !== true) errors.push(`${pkg.name}: needs "private": true`);
  if (pkg.publishConfig) errors.push(`${pkg.name}: remove publishConfig`);
}

const npmrc = join(ROOT, '.npmrc');
if (existsSync(npmrc) && /registry\s*=/.test(readFileSync(npmrc, 'utf8'))) {
  errors.push('.npmrc sets a registry. Our packages are shipped as tarballs, not published.');
}

if (errors.length) {
  console.error(`check-private: our packages must never be published to a registry.\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check-private: all ${manifests.length} packages are private`);
