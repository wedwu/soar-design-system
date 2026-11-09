// The CDN bundle loads only the Web Awesome elements a component declares, so
// what it declares, imports and renders must be the same set.
import { read } from '../context.mjs';

export default {
  id: 'wa-deps',
  title: 'WA dependencies',
  description: 'waDependencies, Web Awesome imports and <wa-*> tags in templates are the same set (the CDN loads only what is declared).',
  appliesTo: ['molecule', 'organism'],
  run(component, ctx) {
    const src = read(component.sourceFile);
    const declared = new Set((src.match(/waDependencies\s*=\s*\[([^\]]*)\]/)?.[1] ?? '').match(/wa-[\w-]+/g) ?? []);
    const imported = new Set([...src.matchAll(/webawesome\/dist\/components\/([\w-]+)\//g)].map((m) => `wa-${m[1]}`));
    const rendered = new Set([...src.matchAll(/<(wa-[\w-]+)/g)].map((m) => m[1]));
    const fmt = (s) => [...s].sort().join(', ') || '(none)';
    const f = [];
    if (fmt(declared) !== fmt(imported) || fmt(imported) !== fmt(rendered)) {
      f.push({
        level: 'error',
        rule: 'wa-dependencies',
        file: component.sourceFile,
        message: `waDependencies [${fmt(declared)}], imports [${fmt(imported)}], renders [${fmt(rendered)}] must match`,
      });
    }
    for (const tag of declared) {
      if (!ctx.parts.elements[tag]) {
        f.push({ level: 'error', rule: 'upstream', file: component.sourceFile, message: `depends on <${tag}>, which doesn't exist in WA ${ctx.upstream.version}` });
      }
    }
    return f;
  },
};
