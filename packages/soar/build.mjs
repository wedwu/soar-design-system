// Builds @soar-awesome/soar: the ONE package apps install.
//
// Our packages are never published to a registry; apps install a tarball
// instead (`npm run cdn:stage` packs it). A tarball can't pull in sibling
// @soar-awesome/* packages, so this package carries the built output of
// theme, components and tokens inside it:
//
//   @soar-awesome/theme/soar.css          → @soar-awesome/soar/theme/soar.css
//   @soar-awesome/components/ax-field.js    → @soar-awesome/soar/components/ax-field.js
//   @soar-awesome/tokens                    → @soar-awesome/soar/tokens
//
// Third-party dependencies (Lit, Web Awesome) stay ordinary dependencies and
// install from the public registry as usual.
//
// `exports`, `dependencies` and `peerDependencies` are derived from the source
// packages. The build fails if package.json is out of date; fix it with
//   node packages/soar/build.mjs --write

import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const SCOPE = '@soar-awesome/';

/**
 * name: subpath in this package. root: the source package's build folder.
 * skip: source exports that are repo tooling, not runtime API.
 */
export const SOURCES = [
  { name: 'theme', dir: 'packages/theme', root: 'dist' },
  { name: 'components', dir: 'packages/components', root: 'dist' },
  { name: 'tokens', dir: 'packages/tokens', root: 'build', skip: ['./upstream/*', './figma/*', './src/*'] },
];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** `./dist/x.js` in the theme package → `./dist/theme/x.js` here. */
export function moveTarget(target, { name, root }) {
  const rel = target.replace(/^\.\//, '');
  const inside = rel.startsWith(`${root}/`) ? rel.slice(root.length + 1) : rel;
  return `./dist/${name}/${inside}`;
}

/** `.` → `./theme`, `./ax-field.js` → `./components/ax-field.js`. */
export function moveKey(key, { name }) {
  return key === '.' ? `./${name}` : `./${name}/${key.replace(/^\.\//, '')}`;
}

function mapLeaves(value, fn) {
  if (typeof value === 'string') return fn(value);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapLeaves(v, fn)]));
}

function leaves(value) {
  return typeof value === 'string' ? [value] : Object.values(value).flatMap(leaves);
}

/** What package.json should say, given the source packages' manifests. */
export function expectedManifest(sources) {
  const exports = {};
  const deps = { dependencies: {}, peerDependencies: {} };
  const problems = [];

  for (const source of sources) {
    const { pkg } = source;
    for (const [key, target] of Object.entries(pkg.exports ?? {})) {
      if (key === './package.json' || source.skip?.includes(key)) continue;
      exports[moveKey(key, source)] = mapLeaves(target, (t) => moveTarget(t, source));
    }
    for (const field of Object.keys(deps)) {
      for (const [dep, range] of Object.entries(pkg[field] ?? {})) {
        if (dep.startsWith(SCOPE)) continue; // carried inside this package
        const seen = deps[field][dep];
        if (seen && seen !== range) problems.push(`${field} "${dep}": ${pkg.name} wants ${range}, another package wants ${seen}`);
        deps[field][dep] = range;
      }
    }
  }
  exports['./package.json'] = './package.json';
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  return { exports, dependencies: sorted(deps.dependencies), peerDependencies: sorted(deps.peerDependencies), problems };
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function build({ write }) {
  const manifestFile = join(HERE, 'package.json');
  const manifest = readJson(manifestFile);
  const sources = SOURCES.map((s) => ({ ...s, pkg: readJson(join(ROOT, s.dir, 'package.json')) }));
  const errors = [];

  for (const { pkg } of sources) {
    if (pkg.version !== manifest.version) errors.push(`${pkg.name} is ${pkg.version} but ${manifest.name} is ${manifest.version} (they're versioned together)`);
  }

  // 1. package.json matches the sources.
  const expected = expectedManifest(sources);
  errors.push(...expected.problems);
  const stale = ['exports', 'dependencies', 'peerDependencies'].filter(
    (field) => JSON.stringify(manifest[field] ?? {}) !== JSON.stringify(expected[field]),
  );
  if (stale.length && write) {
    for (const field of stale) manifest[field] = expected[field];
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`soar: updated ${stale.join(', ')} in packages/soar/package.json`);
  } else if (stale.length) {
    errors.push(`packages/soar/package.json is out of date (${stale.join(', ')}). Run: node packages/soar/build.mjs --write`);
  }
  if (errors.length) throw new Error(`soar:\n  - ${errors.join('\n  - ')}`);

  // 2. Copy each source package's build output, plus any exported file outside it.
  const out = join(HERE, 'dist');
  rmSync(out, { recursive: true, force: true });
  for (const source of sources) {
    const from = join(ROOT, source.dir);
    if (!existsSync(join(from, source.root))) throw new Error(`soar: ${source.dir}/${source.root} missing. Build ${source.pkg.name} first.`);
    cpSync(join(from, source.root), join(out, source.name), { recursive: true });
    for (const target of leaves(source.pkg.exports ?? {})) {
      const rel = target.replace(/^\.\//, '');
      if (!rel.startsWith(`${source.root}/`) && !rel.includes('*') && rel !== 'package.json') {
        cpSync(join(from, rel), join(out, source.name, rel));
      }
    }
  }

  // 3. Every export resolves, and nothing still imports a sibling package.
  const missing = leaves(manifest.exports)
    .filter((t) => t !== './package.json')
    .map((t) => (t.includes('*') ? dirname(t) : t))
    .filter((t) => !existsSync(join(HERE, t)));
  if (manifest.customElements && !existsSync(join(HERE, manifest.customElements))) missing.push(manifest.customElements);
  const crossImports = walk(out)
    .filter((f) => /\.(js|d\.ts)$/.test(f))
    .filter((f) => new RegExp(`(from\\s*|import\\(\\s*)['"]${SCOPE}`).test(readFileSync(f, 'utf8')));
  if (missing.length || crossImports.length) {
    throw new Error(
      [
        ...missing.map((t) => `export target ${t} was not built`),
        ...crossImports.map((f) => `${f} imports ${SCOPE}*, which won't exist in an app (import a relative path instead)`),
      ].join('\n'),
    );
  }

  console.log(`soar: bundled ${sources.map((s) => s.name).join(', ')} into packages/soar/dist`);
}

// Run as a script (not imported). Compare URLs, not strings: works on Windows too.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build({ write: process.argv.includes('--write') });
}
