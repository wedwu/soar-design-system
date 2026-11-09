// Everything the checks need, loaded once: token data, Web Awesome snapshots,
// hand-authored CSS, the exception registry, and the list of components.
//
// Components are DISCOVERED, never hand-listed:
//   atoms      apps/storybook/stories/atoms/*.stories.ts  (title + atomMeta('wa-x'))
//   molecules  packages/components/src/molecules/<name>/<name>.ts
//   organisms  packages/components/src/organisms/<name>/<name>.ts

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../../packages/tokens/src/normalize.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const json = (p) => JSON.parse(read(p));
export const exists = (p) => existsSync(join(ROOT, p));

export function walk(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const p = join(abs, name);
    return statSync(p).isDirectory() ? walk(relative(ROOT, p)) : [relative(ROOT, p)];
  });
}

/** Template-literal CSS from a Lit `*.styles.ts` file. */
export const litCss = (src) => [...src.matchAll(/css`([\s\S]*?)`/g)].map((m) => m[1]).join('\n');

const STORYBOOK = 'apps/storybook';
const RELATED = json(`${STORYBOOK}/src/wa-related.json`);

export function discoverComponents() {
  const components = [];

  // Atoms: Web Awesome components documented as Soar atoms.
  for (const file of walk(`${STORYBOOK}/stories/atoms`).filter((f) => f.endsWith('.stories.ts'))) {
    const src = read(file);
    const tag = src.match(/atomMeta\('(wa-[\w-]+)'/)?.[1];
    const title = src.match(/^\s*title:\s*'([^']+)'/m)?.[1];
    if (!tag || !title) continue; // e.g. Dropdown Limitations: a docs page, not a component
    components.push({
      id: tag,
      tag,
      tags: [tag, ...(RELATED[tag] ?? [])],
      name: title.split('/').pop(),
      layer: 'atom',
      owner: 'web-awesome',
      storyFile: file,
      storyTitle: title,
    });
  }

  // Molecules and organisms: Soar's own elements.
  for (const layer of ['molecules', 'organisms']) {
    const base = `packages/components/src/${layer}`;
    if (!exists(base)) continue;
    for (const dir of readdirSync(join(ROOT, base))) {
      const sourceFile = `${base}/${dir}/${dir}.ts`;
      if (!exists(sourceFile)) continue;
      const story = walk(`${STORYBOOK}/stories/${layer}`)
        .filter((f) => f.endsWith('.stories.ts'))
        .map((f) => ({ f, src: read(f) }))
        .find(({ src }) => new RegExp(`component:\\s*'${dir}'`).test(src));
      components.push({
        id: dir,
        tag: dir,
        tags: [dir],
        name: story?.src.match(/^\s*title:\s*'([^']+)'/m)?.[1].split('/').pop() ?? dir,
        layer: layer.slice(0, -1),
        owner: 'soar',
        sourceFile,
        stylesFile: exists(`${base}/${dir}/${dir}.styles.ts`) ? `${base}/${dir}/${dir}.styles.ts` : undefined,
        testFile: exists(`${base}/${dir}/${dir}.test.ts`) ? `${base}/${dir}/${dir}.test.ts` : undefined,
        storyFile: story?.f,
        storyTitle: story?.src.match(/^\s*title:\s*'([^']+)'/m)?.[1],
      });
    }
  }

  return components.sort((a, b) => order(a.layer) - order(b.layer) || a.name.localeCompare(b.name));
}

const order = (layer) => ['atom', 'molecule', 'organism'].indexOf(layer);

/** Storybook's id for a title ("Atoms/ButtonGroup" -> "atoms-buttongroup"). */
export const storyPrefix = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function loadContext() {
  const upstream = json('packages/tokens/upstream/webawesome.tokens.json');
  const parts = json('packages/tokens/upstream/webawesome.parts.json');
  const figma = normalize(json('packages/tokens/figma/export.json'));

  // Hand-authored CSS. parts.css is shared; each rule is attributed to the
  // components its selector names (see checks/tokens.mjs).
  const partsCss = { file: 'packages/theme/src/parts.css', css: read('packages/theme/src/parts.css') };
  const components = discoverComponents();
  for (const c of components) {
    if (c.stylesFile) c.styles = { file: c.stylesFile, css: litCss(read(c.stylesFile)) };
  }

  const registry = json('tools/audit/exceptions.json');
  const sbIndexPath = `${STORYBOOK}/storybook-static/index.json`;
  const storybookIndex = exists(sbIndexPath) ? json(sbIndexPath) : null;

  return {
    upstream,
    parts,
    figma,
    figmaVars: new Set(figma.map((t) => t.cssVar)),
    upstreamProps: new Set(Object.keys(upstream.properties)),
    componentCssProps: new Set(Object.values(parts.elements).flatMap((e) => e.cssProperties)),
    partsCss,
    components,
    registry,
    storybookIndex,
    today: new Date().toISOString().slice(0, 10),
  };
}
