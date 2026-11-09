/// <reference types="vite/client" />
// Data for the Guides pages. Everything here is derived, never hand-listed:
//   - which atoms are documented: from this Storybook's atom pages
//     (each <Name>.data.json names its Web Awesome page, e.g. "radio-group")
//   - descriptions: from Web Awesome's manifest on the CDN (wa-api.json, which
//     this Storybook's .storybook/main.ts serves from the CDN's copy)
//   - child elements per atom: the shared apps/storybook/src/wa-related.json
//   - Soar Awesome's molecules and organisms: from the components manifest
// so adding an atom page or upgrading Web Awesome updates the guide.

import api from '../../storybook/src/wa-api.json';
import related from '../../storybook/src/wa-related.json';
import ours from '../../../packages/components/custom-elements.json';

interface WaElement {
  description: string;
}

export const WA_VERSION: string = api.version;
const waElements = api.elements as unknown as Record<string, WaElement>;
const RELATED = related as Record<string, string[]>;

/** Storybook's id for a docs page, from its title ("Atoms/ButtonGroup" -> "atoms-buttongroup--docs"). */
const docsId = (title: string) => `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}--docs`;

/** Link that works in `storybook dev`, a static build, and under a sub-path. */
const docsHref = (title: string) => `./?path=/docs/${docsId(title)}`;

type StoryModule = { default: { title: string } };
type DataModule = { default: { design?: { webAwesomeDocs?: string } } };
const stories = import.meta.glob<StoryModule>('../stories/atoms/*.stories.ts', { eager: true });
const data = import.meta.glob<DataModule>('../stories/atoms/*.data.json', { eager: true });

export interface Atom {
  name: string;
  tag: string;
  tags: string[];
  href: string;
  description: string;
}

/** The atoms documented in this Storybook: one per <Name>.stories.ts + <Name>.data.json pair. */
export const atoms: Atom[] = Object.entries(stories)
  .map(([path, mod]) => {
    const slug = data[path.replace('.stories.ts', '.data.json')]?.default.design?.webAwesomeDocs;
    if (!slug) return undefined;
    const tag = `wa-${slug}`;
    return {
      name: mod.default.title.split('/').pop()!,
      tag,
      tags: [tag, ...(RELATED[tag] ?? [])],
      href: docsHref(mod.default.title),
      description: waElements[tag]?.description ?? '',
    };
  })
  .filter((atom): atom is Atom => !!atom)
  .sort((a, b) => a.name.localeCompare(b.name));

const documented = new Set(atoms.flatMap((a) => a.tags));

/** Web Awesome elements on the CDN that aren't documented as atoms here yet. */
export const undocumented = Object.keys(waElements)
  .filter((tag) => !documented.has(tag))
  .sort()
  .map((tag) => ({ tag, description: waElements[tag].description }));

/** Soar Awesome's molecules and organisms, with their layer taken from the source path. */
export const soarComponents = (ours as { modules: { path: string; declarations?: { tagName?: string; description?: string; summary?: string }[] }[] }).modules
  .flatMap((mod) =>
    (mod.declarations ?? [])
      .filter((d) => d.tagName)
      .map((d) => ({
        tag: d.tagName!,
        layer: mod.path.includes('/organisms/') ? 'Organism' : 'Molecule',
        description: (d.summary || d.description || '').split('\n\n')[0].replace(/\n/g, ' '),
      })),
  )
  .sort((a, b) => a.layer.localeCompare(b.layer) || a.tag.localeCompare(b.tag));
