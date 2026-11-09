// Helpers for documenting Web Awesome atoms. The only copy: both Storybooks use it.
//   apps/storybook       (Lit)  imports it as '../../src/wa'
//   apps/storybook-vue   (Vue)  imports it as '../../../storybook/src/wa'
//
// Atoms are owned by Web Awesome, so their controls and API tables come from
// WA's own manifest (see scripts/wa-api.mjs), never hand-maintained here.
// ./wa-api.json is generated from the installed package before `dev` and
// `build`. The Vue Storybook swaps it for the same JSON built from the
// manifest on the CDN (apps/storybook-vue/.storybook/main.ts).
// Stories only add examples and Soar-specific notes.
//
// waElement and atomMeta build Lit/web-components stories; the Vue Storybook
// writes templates instead and uses waArgTypes, waDefaults and waSource.

import type { ArgTypes, Meta } from '@storybook/web-components-vite';
import { render as litRender, type TemplateResult } from 'lit';
import api from './wa-api.json';

type Api = typeof api.elements;
export type WaTag = keyof Api & `wa-${string}`;

interface Prop {
  attr: string;
  prop: string;
  type?: string;
  default?: string;
  description?: string;
}

const elements = api.elements as unknown as Record<string, {
  description: string;
  props: Prop[];
  slots: { name: string; description?: string }[];
  events: { name: string; description?: string }[];
  cssProperties: { name: string; description?: string; default?: string }[];
  cssParts: { name: string; description?: string }[];
}>;

export const WA_VERSION = api.version;

/** "'a' | 'b' | undefined" -> ['a', 'b']; anything else -> undefined */
function literalOptions(type = '') {
  const parts = type.split('|').map((s) => s.trim()).filter((s) => s && s !== 'undefined' && s !== 'null');
  if (!parts.length || !parts.every((p) => /^'[^']*'$/.test(p))) return undefined;
  return parts.map((p) => p.slice(1, -1));
}

const unquote = (v?: string) => (v && /^'.*'$/.test(v) ? v.slice(1, -1) : v);

/**
 * Storybook argTypes for a WA element, generated from its manifest.
 *
 * Without `attrs`: the full API (attributes, slots, events, CSS properties,
 * parts), as waElement understands every one of those arg names.
 * With `attrs`: only those attributes, for stories that pass args straight to
 * the element (Vue's `v-bind="args"`), where a `--css-prop` or `on:event`
 * arg would become a bogus attribute.
 */
export function waArgTypes(tag: WaTag, attrs?: string[]): ArgTypes {
  const el = elements[tag];
  if (!el) throw new Error(`${tag} is not in Web Awesome ${WA_VERSION}`);
  const argTypes: ArgTypes = {};

  for (const p of el.props) {
    if (attrs && !attrs.includes(p.attr)) continue;
    const options = literalOptions(p.type);
    const t = (p.type ?? '').replace(/\s*\|\s*(undefined|null)/g, '');
    argTypes[p.attr] = {
      name: p.attr,
      description: p.description,
      table: { category: 'attributes', type: { summary: p.type }, defaultValue: { summary: p.default } },
      control: options ? { type: 'select' } : t === 'boolean' ? 'boolean' : t === 'number' ? 'number' : t === 'string' ? 'text' : false,
      ...(options ? { options } : {}),
    };
  }
  if (attrs) return argTypes;

  for (const s of el.slots) {
    argTypes[`slot:${s.name || 'default'}`] = {
      name: s.name || '(default)',
      description: s.description,
      control: false,
      table: { category: 'slots' },
    };
  }
  for (const e of el.events) {
    argTypes[`on:${e.name}`] = { name: e.name, description: e.description, action: e.name, table: { category: 'events' } };
  }
  for (const c of el.cssProperties) {
    argTypes[c.name] = {
      name: c.name,
      description: c.description,
      control: 'text',
      table: { category: 'css custom properties', defaultValue: { summary: c.default } },
    };
  }
  for (const p of el.cssParts) {
    argTypes[`part:${p.name}`] = {
      name: p.name,
      description: p.description,
      control: false,
      table: { category: 'css parts', type: { summary: `::part(${p.name})` } },
    };
  }
  return argTypes;
}

/** Default arg values straight from the manifest (only for enum/boolean/number props). */
export function waDefaults(tag: WaTag, only?: string[]) {
  const args: Record<string, unknown> = {};
  for (const p of elements[tag].props) {
    if (only && !only.includes(p.attr)) continue;
    if (p.default === undefined || p.default === 'null') continue;
    const v = unquote(p.default);
    args[p.attr] = v === 'true' ? true : v === 'false' ? false : /^-?\d+(\.\d+)?$/.test(v!) ? Number(v) : v;
  }
  return args;
}

/**
 * The events a WA element fires, from its manifest (e.g. wa-show, wa-after-hide).
 * waElement wires these to the Actions panel through `on:<event>` argTypes;
 * template-based stories (Vue) bind them with `v-on` instead.
 */
export function waEventNames(tag: WaTag): string[] {
  return elements[tag].events.map((e) => e.name);
}

/**
 * Story args → attributes for `v-bind` on a WA element in a template (Vue).
 * Booleans that are off, and empty values, are left out: before the CDN script
 * has upgraded the element, Vue writes attributes, and `disabled="false"` or
 * `checked="false"` would still count as on.
 */
export function waAttrs(args: Record<string, unknown>, attrs: string[]) {
  return Object.fromEntries(
    attrs.filter((name) => args[name] !== false && args[name] != null && args[name] !== '').map((name) => [name, args[name]]),
  );
}

const escapeAttr = (v: unknown) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const indent = (text: string) => text.split('\n').map((line) => (line ? `  ${line}` : line)).join('\n');

/**
 * Markup for a WA element from story args, for the docs "Show code" panel.
 * Needed where stories write templates rather than build elements (the Vue
 * Storybook): there Storybook would otherwise invent a component name from
 * the story title (<Drawer .../>). Attributes that are off, empty, or at
 * Web Awesome's default are left out.
 */
export function waSource(tag: WaTag, args: Record<string, unknown>, attrs: string[], inner = '') {
  const defaults = waDefaults(tag, attrs);
  const attributes = attrs
    .map((name) => {
      const value = args[name];
      if (value === false || value == null || value === '' || value === defaults[name]) return '';
      return value === true ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`;
    })
    .join('');
  const content = inner.trim();
  if (!content.includes('\n') && !content.startsWith('<')) return `<${tag}${attributes}>${content}</${tag}>`; // text label, one line
  return `<${tag}${attributes}>\n${indent(content)}\n</${tag}>`;
}

/**
 * Standard meta for an atom: upstream-generated API + an ownership banner.
 * `soar` describes what Soar changes about it (or says it's untouched).
 *
 * `title` and `tags` must be written literally in each story file's default
 * export (Storybook's indexer reads them statically), so they aren't set here:
 *   export default { title: 'Atoms/Badge', tags: ['autodocs', 'upstream'], ...atomMeta(...) }
 */
export function atomMeta(
  tag: WaTag,
  opts: {
    soar: string;
    extra?: string;
    args?: Record<string, unknown>;
    /** For overlays (dialog, drawer): render docs examples in their own iframe at this height. */
    iframeHeight?: number;
  },
): Meta {
  const name = tag.replace(/^wa-/, '');
  return {
    argTypes: waArgTypes(tag),
    args: opts.args ?? {},
    parameters: {
      // Read by the Guides pages (src/catalog.ts) to list documented atoms.
      waTag: tag,
      ...(opts.iframeHeight ? { layout: 'fullscreen' } : {}),
      docs: {
        ...(opts.iframeHeight ? { story: { inline: false, iframeHeight: opts.iframeHeight } } : {}),
        description: {
          component: [
            `**Owned by Web Awesome ${WA_VERSION}. Themed by Soar.** ${elements[tag].description}`,
            `**Soar:** ${opts.soar}`,
            opts.extra,
            `API reference: [webawesome.com/docs/components/${name}](https://webawesome.com/docs/components/${name}). The tables below are generated from Web Awesome's manifest.`,
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      },
    },
  };
}

/**
 * Create a WA element from story args: attributes, `--css-props` as inline
 * style, and `on:event` actions as listeners. `content` fills the light DOM.
 */
export function waElement(tag: WaTag, args: Record<string, unknown>, content?: string | TemplateResult): HTMLElement {
  const el = document.createElement(tag);
  const props = new Map(elements[tag].props.map((p) => [p.attr, p]));
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === '') continue;
    if (key.startsWith('on:') && typeof value === 'function') {
      el.addEventListener(key.slice(3), value as EventListener);
    } else if (key.startsWith('--')) {
      el.style.setProperty(key, String(value));
    } else if (props.has(key)) {
      if (typeof value === 'boolean') el.toggleAttribute(key, value);
      else el.setAttribute(key, String(value));
    }
  }
  if (typeof content === 'string') el.innerHTML = content;
  else if (content) litRender(content, el);
  return el;
}
