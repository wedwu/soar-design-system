/// <reference types="vite/client" />
// Data for the Guides pages. Everything here is derived, never hand-listed:
//   - which atoms are documented: from the atom story files themselves
//   - their slots and parts: from Web Awesome's manifest (wa-api.json)
//   - which parts Soar restyles: from the theme's parts.css
//   - our molecules and organisms: from our custom-elements manifest
// so adding a story, bumping Web Awesome or editing parts.css updates the pages.

import api from './wa-api.json';
import ours from '@soar-awesome/components/custom-elements.json';
import partsCss from '@soar-awesome/theme/parts.css?raw';

interface WaElement {
  description: string;
  slots: { name: string; description?: string }[];
  cssParts: { name: string; description?: string }[];
}

export const WA_VERSION: string = api.version;
export const waElements = api.elements as unknown as Record<string, WaElement>;

/** Storybook's id for a docs page, from its title ("Atoms/ButtonGroup" -> "atoms-buttongroup--docs"). */
export function docsId(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}--docs`;
}

/** Link that works in `storybook dev`, a static build, and under a sub-path. */
export const docsHref = (title: string) => `./?path=/docs/${docsId(title)}`;

// Child elements documented on their parent's page. Shared with tools/audit,
// so the docs and the component audit agree on what each atom covers.
import related from './wa-related.json';
const RELATED = related as Record<string, string[]>;

type StoryModule = { default: { title: string; parameters?: { waTag?: string } } };
const modules = import.meta.glob<StoryModule>('../stories/atoms/*.stories.ts', { eager: true });

export interface Atom {
  title: string;
  name: string;
  tag: string;
  tags: string[];
  href: string;
  description: string;
}

export const atoms: Atom[] = Object.values(modules)
  .map((m) => m.default)
  .filter((meta) => meta.parameters?.waTag)
  .map((meta) => {
    const tag = meta.parameters!.waTag!;
    return {
      title: meta.title,
      name: meta.title.split('/').pop()!,
      tag,
      tags: [tag, ...(RELATED[tag] ?? [])],
      href: docsHref(meta.title),
      description: waElements[tag]?.description ?? '',
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const documented = new Set(atoms.flatMap((a) => a.tags));

/** WA elements we ship (they're in the package) but haven't documented as atoms yet. */
export const undocumented = Object.keys(waElements)
  .filter((tag) => !documented.has(tag))
  .sort()
  .map((tag) => ({ tag, description: waElements[tag].description }));

// Our molecule/organism stories, keyed by the element they document.
type OurStory = { default: { title: string; component?: string } };
const ourStories = import.meta.glob<OurStory>(['../stories/molecules/*.stories.ts', '../stories/organisms/*.stories.ts'], { eager: true });
const ourDocs = new Map(Object.values(ourStories).map((m) => [m.default.component, docsHref(m.default.title)]));

/** Soar molecules and organisms, with their layer taken from the source path. */
export const soarComponents = (ours as { modules: { path: string; declarations?: { tagName?: string; description?: string; summary?: string }[] }[] }).modules
  .flatMap((mod) =>
    (mod.declarations ?? [])
      .filter((d) => d.tagName)
      .map((d) => ({
        tag: d.tagName!,
        layer: mod.path.includes('/organisms/') ? 'Organism' : 'Molecule',
        href: ourDocs.get(d.tagName!),
        description: (d.summary || d.description || '').split('\n\n')[0].replace(/\n/g, ' '),
      })),
  )
  .sort((a, b) => a.layer.localeCompare(b.layer) || a.tag.localeCompare(b.tag));

/** "wa-card::part(header)" pairs that Soar's parts.css styles. */
export const soarStyledParts = new Set(
  [...partsCss.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(wa-[\w-]+)(?:\[[^\]]*\]|:[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?)*::part\(([\w-]+)\)/g)].map(
    ([, tag, part]) => `${tag}::part(${part})`,
  ),
);
