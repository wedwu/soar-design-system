// Reads an installed @awesome.me/webawesome package and produces the two
// snapshots we diff upstream releases against:
//
//   packages/tokens/upstream/webawesome.tokens.json  every --wa-* custom property
//                                                     and its default per scheme
//   packages/tokens/upstream/webawesome.parts.json   every element's ::part() names
//                                                     and component CSS properties
//
// Usage: node tools/upstream-bump/extract.mjs [path/to/webawesome] [--out dir]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseRules, parseLayerOrder } from '../lib/css.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUT = join(ROOT, 'packages/tokens/upstream');

// The default theme and the stylesheets it pulls variables from. Alternate
// WA themes (awesome, shoelace) are not part of our contract.
const SOURCES = {
  theme: 'dist/styles/themes/default.css',
  palette: 'dist/styles/color/palettes/default.css',
  'variant:brand': 'dist/styles/color/variants/brand.css',
  'variant:neutral': 'dist/styles/color/variants/neutral.css',
  'variant:success': 'dist/styles/color/variants/success.css',
  'variant:warning': 'dist/styles/color/variants/warning.css',
  'variant:danger': 'dist/styles/color/variants/danger.css',
};

export function locateWebAwesome(from = join(ROOT, 'packages/theme')) {
  const require = createRequire(join(from, 'package.json'));
  return dirname(require.resolve('@awesome.me/webawesome/package.json'));
}

export function extract(pkgDir) {
  const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  const properties = {};

  for (const [source, rel] of Object.entries(SOURCES)) {
    const rules = parseRules(readFileSync(join(pkgDir, rel), 'utf8'));
    for (const rule of rules) {
      // Variant files define every brand/neutral/... hue option; only the
      // :root default is what ships when you load the stylesheet as-is.
      if (source.startsWith('variant:') && !rule.selector.includes(':root')) continue;
      if (source === 'palette' && !rule.selector.includes(':root')) continue;

      const scheme = schemeOf(rule);
      for (const { prop, value } of rule.declarations) {
        if (!prop.startsWith('--wa-')) continue;
        properties[prop] ??= { source };
        properties[prop][scheme] = value;
      }
    }
  }

  const tokens = {
    package: pkg.name,
    version: pkg.version,
    layers: parseLayerOrder(readFileSync(join(pkgDir, 'dist/styles/layers.css'), 'utf8')),
    properties: sortObject(properties),
  };

  const manifest = JSON.parse(readFileSync(join(pkgDir, 'dist/custom-elements.json'), 'utf8'));
  const elements = {};
  for (const mod of manifest.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.tagName) continue;
      elements[decl.tagName] = {
        parts: (decl.cssParts ?? []).map((p) => p.name).sort(),
        cssProperties: (decl.cssProperties ?? []).map((p) => p.name).sort(),
        cssStates: (decl.cssStates ?? []).map((p) => p.name).sort(),
      };
    }
  }
  const parts = { package: pkg.name, version: pkg.version, elements: sortObject(elements) };

  return { tokens, parts };
}

// WA's default theme has three kinds of rule: light colors (color-scheme:
// light), dark colors (color-scheme: dark) and scheme-independent values.
function schemeOf(rule) {
  const cs = rule.declarations.find((d) => d.prop === 'color-scheme')?.value;
  if (cs === 'light') return 'light';
  if (cs === 'dark') return 'dark';
  return 'base';
}

function sortObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

export function writeSnapshots({ tokens, parts }, outDir = DEFAULT_OUT) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'webawesome.tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
  writeFileSync(join(outDir, 'webawesome.parts.json'), JSON.stringify(parts, null, 2) + '\n');
}

// Run as a script (not imported). Compare URLs, not strings: works on Windows too.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const out = outIdx >= 0 ? resolve(args[outIdx + 1]) : DEFAULT_OUT;
  const pkgDir = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : locateWebAwesome();
  const snap = extract(pkgDir);
  writeSnapshots(snap, out);
  console.log(
    `Extracted ${Object.keys(snap.tokens.properties).length} properties and ` +
      `${Object.keys(snap.parts.elements).length} elements from ${snap.tokens.package}@${snap.tokens.version}`,
  );
}
