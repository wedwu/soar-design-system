// Extracts the public API of every Web Awesome element from the *installed*
// package's custom-elements.json into src/wa-api.json (gitignored).
//
// Atom stories build their controls and API tables from this file (src/wa.ts,
// src/catalog.ts), so atom docs always describe the Web Awesome version we
// actually ship, and change automatically when `npm run upstream:bump` moves
// the pin. The full manifest is ~2 MB; this keeps only what the docs need.
//
// The Vue Storybook builds the same JSON from the manifest on the CDN with
// extractWaApi() and serves it in place of src/wa-api.json.
//
//   node apps/storybook/scripts/wa-api.mjs      (run before `dev` and `build`)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Inherited from every element, or only meaningful for SSR/internals.
const SKIP_ATTRS = new Set(['dir', 'lang', 'did-ssr', 'title']);
const isSsrOnly = (d = '') => /Only required for SSR/.test(d);

/** { version, elements } for every wa-* element in a parsed custom-elements.json. */
export function extractWaApi(manifest, version) {
  const elements = {};
  for (const mod of manifest.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.tagName?.startsWith('wa-')) continue;
      const props = (decl.members ?? [])
        .filter((m) => m.kind === 'field' && !m.static && !m.privacy && m.attribute && !SKIP_ATTRS.has(m.attribute))
        .filter((m) => !isSsrOnly(m.description))
        .map((m) => ({
          attr: m.attribute,
          prop: m.name,
          type: m.type?.text?.replace(/\s+/g, ' ').trim(),
          default: m.default,
          description: m.description,
        }));
      elements[decl.tagName] = {
        description: decl.summary || decl.description || '',
        props,
        slots: (decl.slots ?? []).map(({ name, description }) => ({ name, description })),
        events: (decl.events ?? []).filter((e) => e.name).map(({ name, description }) => ({ name, description })),
        cssProperties: (decl.cssProperties ?? []).map(({ name, description, default: d }) => ({ name, description, default: d })),
        cssParts: (decl.cssParts ?? []).map(({ name, description }) => ({ name, description })),
      };
    }
  }
  return { version, elements };
}

/** The API of the Web Awesome package installed for the main Storybook. */
export function installedWaApi() {
  const require = createRequire(import.meta.url);
  const manifest = JSON.parse(readFileSync(require.resolve('@awesome.me/webawesome/dist/custom-elements.json'), 'utf8'));
  const { version } = JSON.parse(readFileSync(require.resolve('@awesome.me/webawesome/package.json'), 'utf8'));
  return extractWaApi(manifest, version);
}

// Run as a script (not imported). Compare URLs, not strings: works on Windows too.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const api = installedWaApi();
  const out = join(dirname(fileURLToPath(import.meta.url)), '../src/wa-api.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(api) + '\n');
  console.log(`wa-api: ${Object.keys(api.elements).length} Web Awesome ${api.version} elements`);
}
