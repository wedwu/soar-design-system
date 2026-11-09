// Minimal CSS reader used by the token tooling. It understands exactly what we
// need from Web Awesome's stylesheets and our own: nested @layer blocks, rule
// selectors, and custom-property declarations whose values may span lines.
// It is not a general CSS parser and does not try to be.

export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Returns a flat list of rules:
 * { layer: string|null, selector: string, declarations: [{ prop, value }] }
 */
export function parseRules(css) {
  const src = stripComments(css);
  const rules = [];
  walk(src, 0, src.length, null, rules);
  return rules;
}

function walk(src, start, end, layer, out) {
  let i = start;
  let prelude = '';
  while (i < end) {
    const ch = src[i];
    if (ch === ';') {
      prelude = ''; // top-level statement such as @import or @layer a, b;
      i++;
      continue;
    }
    if (ch === '{') {
      const close = matchBrace(src, i);
      const head = prelude.trim();
      if (head.startsWith('@layer')) {
        walk(src, i + 1, close, head.replace('@layer', '').trim() || layer, out);
      } else if (head.startsWith('@')) {
        walk(src, i + 1, close, layer, out); // @media / @supports: keep walking
      } else {
        out.push({ layer, selector: normalizeSelector(head), declarations: parseDeclarations(src.slice(i + 1, close)) });
      }
      prelude = '';
      i = close + 1;
      continue;
    }
    prelude += ch;
    i++;
  }
}

function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return i;
  }
  throw new Error(`Unbalanced braces at offset ${open}`);
}

function normalizeSelector(sel) {
  return sel.replace(/\s+/g, ' ').trim();
}

export function parseDeclarations(body) {
  const decls = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  push(current);
  return decls;

  function push(text) {
    const idx = text.indexOf(':');
    if (idx < 0) return;
    const prop = text.slice(0, idx).trim();
    if (!prop || prop.includes('{') || prop.includes('}')) return;
    decls.push({ prop, value: text.slice(idx + 1).replace(/\s+/g, ' ').trim() });
  }
}

/** First `@layer a, b, c;` statement in a file, as an ordered array. */
export function parseLayerOrder(css) {
  const m = stripComments(css).match(/@layer\s+([^{;]+);/);
  return m ? m[1].split(',').map((s) => s.trim()) : [];
}

/** Every `--x` referenced through var(--x) in a value. */
export function varRefs(value) {
  return [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
}
