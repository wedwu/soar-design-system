// System-wide token rules: not about any one component, but every component
// depends on them. Ported from the original ownership audit.
import { read } from '../context.mjs';
import { classify, owned, inheritedExact } from '../../../packages/tokens/src/classify.mjs';
import { appFacing } from '../../../packages/tokens/src/alias-map.mjs';
import { AX_LAYERS } from '../../../packages/tokens/src/build.mjs';
import { auditSources, unattributedPartsRules } from './tokens.mjs';

export default {
  id: 'system',
  title: 'Token system',
  description: 'Every Web Awesome property is owned or inherited, owned properties and alias targets exist, layer order matches.',
  scope: 'system',
  run(ctx) {
    const f = [];
    const { upstream, upstreamProps, figma } = ctx;
    const figmaByName = new Map(figma.map((t) => [t.name, t]));

    for (const prop of upstreamProps) {
      if (classify(prop) === 'unclassified') f.push({ level: 'error', rule: 'classification', message: `${prop} is neither owned (alias-map.mjs) nor inherited (inherited.json)` });
    }
    for (const prop of Object.keys(owned)) {
      if (inheritedExact.has(prop)) f.push({ level: 'error', rule: 'classification', message: `${prop} is listed as both owned and inherited` });
      if (!upstreamProps.has(prop)) f.push({ level: 'error', rule: 'stale-ownership', message: `${prop} is owned but no longer exists in WA ${upstream.version}; the Figma value would reach nothing` });
    }
    for (const prop of inheritedExact) {
      if (!upstreamProps.has(prop)) f.push({ level: 'warn', rule: 'stale-inherited', message: `${prop} is in inherited.json but not in WA ${upstream.version}` });
    }
    for (const [prop, name] of Object.entries(owned)) {
      if (!figmaByName.has(name)) f.push({ level: 'error', rule: 'alias-target', message: `${prop} -> "${name}" but no such Figma variable (renamed or deleted?)` });
    }

    const declared = (read('packages/theme/src/tokens.css').match(/@layer\s+([^{;]+);/)?.[1] ?? '').split(',').map((s) => s.trim());
    const expected = [...upstream.layers, ...AX_LAYERS];
    if (declared.join() !== expected.join()) {
      f.push({ level: 'error', rule: 'layer-order', message: `theme declares @layer ${declared.join(', ')}; expected ${expected.join(', ')}. Run npm run tokens.` });
    }

    // parts.css rules for elements no documented component covers (e.g. the
    // ax-control-info rules for wa-checkbox-group) still follow the token rules.
    f.push(...auditSources(unattributedPartsRules(ctx), ctx));

    const consumed = new Set(Object.values(owned));
    const allCss = [ctx.partsCss.css, ...ctx.components.map((c) => c.styles?.css ?? '')].join('\n');
    for (const t of figma) {
      if (appFacing.some((re) => re.test(t.name))) continue;
      const aliased = figma.some((o) => Object.values(o.values).some((v) => v.includes(`var(${t.cssVar})`)));
      if (!consumed.has(t.name) && !aliased && !allCss.includes(t.cssVar)) {
        f.push({ level: 'warn', rule: 'orphan', message: `Figma variable "${t.name}" (${t.cssVar}) isn't mapped to WA or used by any component` });
      }
    }
    return f;
  },
};
