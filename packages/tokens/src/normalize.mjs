// Figma Variables export -> flat, mode-aware token list.
//
// Input is the payload of GET /v1/files/:key/variables/local (exactly what
// tools/figma-sync/pull.mjs commits to figma/export.json). Output is the one
// intermediate representation every other step consumes:
//
//   { name: 'color/brand/50', cssVar: '--ax-color-brand-50', id, type,
//     collection, description, values: { base } | { light, dark } }
//
// Values are CSS-ready strings. Aliases stay aliases (var(--ax-...)) so the
// primitive -> semantic chain is visible in devtools and in Storybook.

export const PREFIX = 'ax';

// Figma FLOATs are unitless. Name-prefix rules win over scope rules so a
// designer mis-scoping a variable can't change the emitted unit.
const UNIT_BY_PREFIX = [
  ['motion/duration/', 'ms'],
  ['breakpoint/', 'rem'],
  ['font/weight/', ''],
  ['font/line-height/', ''],
  ['space/', 'rem'],
  ['radius/', 'rem'],
  ['border-width/', 'rem'],
  ['font/size/', 'rem'],
  ['focus/', 'rem'],
];
const UNIT_BY_SCOPE = {
  GAP: 'rem',
  WIDTH_HEIGHT: 'rem',
  CORNER_RADIUS: 'rem',
  STROKE_FLOAT: 'rem',
  FONT_SIZE: 'rem',
  FONT_WEIGHT: '',
  LINE_HEIGHT: '',
  OPACITY: '',
};

const MODE_ALIASES = { light: 'light', dark: 'dark', value: 'base', default: 'base', mode: 'base', 'mode 1': 'base' };

export function cssVarFor(name) {
  return `--${PREFIX}-${name
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')}`;
}

export function normalize(exportJson) {
  const { variableCollections, variables } = exportJson.meta;
  const byId = variables;
  const tokens = [];

  for (const v of Object.values(variables)) {
    if (v.remote) continue; // library variables are owned by another file
    const coll = variableCollections[v.variableCollectionId];
    if (!coll) throw new Error(`Variable ${v.name} references missing collection ${v.variableCollectionId}`);

    const values = {};
    for (const mode of coll.modes) {
      const key = modeKey(mode.name, coll.modes.length);
      const raw = v.valuesByMode[mode.modeId];
      if (raw === undefined) throw new Error(`${v.name} has no value for mode "${mode.name}"`);
      values[key] = toCss(raw, v, byId);
    }

    tokens.push({
      id: v.id,
      name: v.name,
      cssVar: cssVarFor(v.name),
      type: tokenType(v),
      collection: coll.name,
      description: v.description || undefined,
      values,
    });
  }

  assertUniqueCssVars(tokens);
  return tokens.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
}

function modeKey(name, count) {
  const k = MODE_ALIASES[name.toLowerCase()];
  if (k) return k;
  if (count === 1) return 'base';
  throw new Error(
    `Unknown Figma mode "${name}". Add it to MODE_ALIASES in normalize.mjs and give it a selector in build.mjs.`,
  );
}

function tokenType(v) {
  switch (v.resolvedType) {
    case 'COLOR':
      return 'color';
    case 'STRING':
      return v.name.startsWith('font/family/') ? 'fontFamily' : 'string';
    case 'BOOLEAN':
      return 'boolean';
    case 'FLOAT': {
      const unit = unitFor(v);
      if (unit === 'ms') return 'duration';
      if (unit === 'rem' || unit === 'px') return 'dimension';
      if (v.name.startsWith('font/weight/')) return 'fontWeight';
      return 'number';
    }
  }
  throw new Error(`Unsupported resolvedType ${v.resolvedType} on ${v.name}`);
}

function unitFor(v) {
  for (const [prefix, unit] of UNIT_BY_PREFIX) if (v.name.startsWith(prefix)) return unit;
  for (const scope of v.scopes ?? []) if (scope in UNIT_BY_SCOPE) return UNIT_BY_SCOPE[scope];
  return '';
}

function toCss(raw, v, byId) {
  if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
    const target = byId[raw.id];
    if (!target) throw new Error(`${v.name} aliases unknown variable ${raw.id}`);
    return `var(${cssVarFor(target.name)})`;
  }
  switch (v.resolvedType) {
    case 'COLOR':
      return colorToCss(raw);
    case 'FLOAT': {
      const unit = unitFor(v);
      // 9999 is Figma's "fully rounded" sentinel (radius/pill); keep it in px.
      // Everything else, including large breakpoints, converts to rem.
      if (unit === 'rem') return raw >= 9999 ? `${raw}px` : `${trim(raw / 16)}rem`;
      return `${trim(raw)}${unit}`;
    }
    case 'STRING':
      return raw;
    case 'BOOLEAN':
      return raw ? '1' : '0';
  }
}

function colorToCss({ r, g, b, a = 1 }) {
  const hex = [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
  if (a >= 1) return `#${hex}`;
  return `rgb(${[r, g, b].map((c) => Math.round(c * 255)).join(' ')} / ${trim(a)})`;
}

function trim(n) {
  return String(Math.round(n * 10000) / 10000);
}

function assertUniqueCssVars(tokens) {
  const seen = new Map();
  for (const t of tokens) {
    if (seen.has(t.cssVar)) {
      throw new Error(`Figma variables "${seen.get(t.cssVar)}" and "${t.name}" both map to ${t.cssVar}`);
    }
    seen.set(t.cssVar, t.name);
  }
}

/** Mode keys used across the token set, e.g. ['base', 'light', 'dark']. */
export function modesOf(tokens) {
  return [...new Set(tokens.flatMap((t) => Object.keys(t.values)))];
}
