// What a --wa-* property actually renders as, per color scheme.
//
// Owned properties resolve through our Figma tokens; inherited ones resolve
// through Web Awesome's snapshot defaults, which may in turn reference owned
// properties (e.g. WA's `--wa-color-warning-fill-loud: var(--wa-color-warning-50)`
// where warning-50 is ours). Tests use this to check what users see, not just
// what Figma intends.

import { normalize } from './normalize.mjs';
import { owned } from './alias-map.mjs';

const NAMED = { white: '#ffffff', black: '#000000', transparent: '#00000000' };

export function createResolver({ exportJson, upstream }) {
  const tokens = normalize(exportJson);
  const byName = new Map(tokens.map((t) => [t.name, t]));
  const byVar = new Map(tokens.map((t) => [t.cssVar, t]));
  const props = upstream.properties;

  function axValue(token, mode) {
    let t = token;
    let v = t.values[mode] ?? t.values.base;
    for (let i = 0; v.startsWith('var(--ax-'); i++) {
      if (i > 20) throw new Error(`alias loop at ${token.name}`);
      t = byVar.get(v.slice(4, -1));
      v = t.values[mode] ?? t.values.base;
    }
    return v;
  }

  /** Rendered value of a --wa-* property in 'light' or 'dark'. */
  function wa(prop, mode) {
    if (prop in owned) return axValue(byName.get(owned[prop]), mode);
    const def = props[prop];
    if (!def) throw new Error(`${prop} is not in the Web Awesome snapshot`);
    const v = (def[mode] ?? def.base ?? '').trim();
    const ref = /^var\((--wa-[\w-]+)\)$/.exec(v);
    if (ref) return wa(ref[1], mode);
    return NAMED[v] ?? v;
  }

  return { wa, tokens };
}

export function luminance(hex) {
  if (!/^#[0-9a-f]{6}/i.test(hex)) throw new Error(`can't compute luminance of "${hex}"`);
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
