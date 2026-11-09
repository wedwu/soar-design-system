// Per-component CSS rules: only tokens, one writer, real references.
//   Soar components: their *.styles.ts
//   Atoms: the parts.css rules whose selectors name the atom (or its children)
import { parseRules, varRefs } from '../../lib/css.mjs';

const LITERAL = [
  [/#[0-9a-f]{3,8}\b/i, 'hex color'],
  [/\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i, 'color function'],
  [/(?<![\w-])-?\d*\.?\d+(px|rem)\b/, 'absolute length'],
];
const ALLOWED_LITERAL = /^(0|1px)$/; // 0, and hairlines

/** wa-card::part(header), wa-card:not([appearance~='accent'])::part(header), ... */
export const PART_SELECTOR = /(wa-[\w-]+)(?:\[[^\]]*\]|:[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?)*::part\(([\w-]+)\)/g;

/** `audit-allow <id>` markers on the same line as a declaration. */
export const ALLOW_MARKER = /audit-allow\s+([\w-]+)/;

/** Rules of a stylesheet that apply to a component, with the source lines. */
export function rulesFor(component, { partsCss }) {
  const sources = [];
  if (component.styles) sources.push({ ...component.styles, rules: parseRules(component.styles.css) });
  const tagPattern = new RegExp(`(^|[\\s,>+~(])(${component.tags.join('|')})(?![\\w-])`);
  const shared = parseRules(partsCss.css).filter((r) => tagPattern.test(r.selector));
  if (shared.length) sources.push({ ...partsCss, rules: shared });
  return sources;
}

/** Check a set of { file, css, rules } sources. Shared with the system check. */
export function auditSources(sources, ctx) {
  const f = [];
  const { figmaVars, upstreamProps, componentCssProps, upstream, parts } = ctx;
  for (const { file, css, rules } of sources) {
    const lines = css.split('\n');
    for (const rule of rules) {
      for (const { prop, value } of rule.declarations) {
        const where = `${rule.selector} { ${prop} }`;
        const line = lines.find((l) => l.replace(/\s+/g, ' ').includes(`${prop}: ${value}`)) ?? '';
        const exception = line.match(ALLOW_MARKER)?.[1];

        if (prop.startsWith('--') && (figmaVars.has(prop) || upstreamProps.has(prop))) {
          f.push({ level: 'error', rule: 'single-writer', file, message: `${where} declares a token property. Token values are written only by the generator.` });
        }
        const scrubbed = value.replace(/var\([^)]*\)/g, '');
        for (const [re, what] of LITERAL) {
          const m = scrubbed.match(re);
          if (!m || ALLOWED_LITERAL.test(m[0])) continue;
          f.push(
            exception
              ? { level: 'excepted', rule: 'no-literals', file, exception, message: `${where}: ${what} "${m[0]}" (allowed by exception "${exception}")` }
              : { level: 'error', rule: 'no-literals', file, message: `${where}: ${what} "${m[0]}". Use a token, or register an exception and mark the line /* audit-allow <id> */.` },
          );
        }
        for (const ref of varRefs(value)) {
          if (ref.startsWith('--wa-') && !upstreamProps.has(ref) && !componentCssProps.has(ref)) {
            f.push({ level: 'error', rule: 'reference', file, message: `${where} uses ${ref}, which doesn't exist in WA ${upstream.version}` });
          }
          if (ref.startsWith('--ax-') && !figmaVars.has(ref) && !new RegExp(`${ref}\\s*:`).test(css)) {
            f.push({ level: 'error', rule: 'reference', file, message: `${where} uses ${ref}, which isn't a Figma token or a property declared in this file` });
          }
        }
      }
      for (const [, tag, part] of rule.selector.matchAll(PART_SELECTOR)) {
        if (!parts.elements[tag]) f.push({ level: 'error', rule: 'reference', file, message: `<${tag}> doesn't exist in WA ${upstream.version}` });
        else if (!parts.elements[tag].parts.includes(part)) f.push({ level: 'error', rule: 'reference', file, message: `${tag}::part(${part}) doesn't exist in WA ${upstream.version}` });
      }
    }
  }
  return f;
}

/** parts.css rules that no discovered component claims (still checked, by the system check). */
export function unattributedPartsRules(ctx) {
  const claimed = new Set(ctx.components.flatMap((c) => rulesFor(c, ctx).filter((s) => s.file === ctx.partsCss.file).flatMap((s) => s.rules.map((r) => r.selector))));
  const rules = parseRules(ctx.partsCss.css).filter((r) => !claimed.has(r.selector));
  return rules.length ? [{ ...ctx.partsCss, rules }] : [];
}

export default {
  id: 'tokens',
  title: 'Tokens only',
  description: 'Component CSS uses tokens (no raw colors or lengths), never sets token properties, and only references tokens and parts that exist.',
  appliesTo: ['atom', 'molecule', 'organism'],
  run(component, ctx) {
    return auditSources(rulesFor(component, ctx), ctx);
  },
};
