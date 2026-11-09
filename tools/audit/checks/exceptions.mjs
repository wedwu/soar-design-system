// Exceptions are first-class: every allowed finding must be registered in
// tools/audit/exceptions.json with a reason, owner and review date, and every
// marker in the source must point at a registered entry. This keeps
// suppressions from quietly piling up.
import { read, walk } from '../context.mjs';

const REQUIRED = ['id', 'check', 'component', 'reason', 'owner', 'review'];
const CHECKS = new Set(['tokens', 'a11y']);
const CSS_MARKER = /audit-allow\s+([\w-]+)/g;
const STORY_MARKER = /audit-exception:\s*([\w-]+)/g;
const RULE_OFF = /id:\s*'([\w-]+)',\s*enabled:\s*false/g;

export default {
  id: 'exceptions',
  title: 'Exceptions',
  description: 'Every allowed finding is registered with a reason, owner and review date; every marker in the source points at a registered entry.',
  scope: 'system',
  run(ctx) {
    const f = [];
    const entries = ctx.registry.exceptions ?? [];
    const byId = new Map();
    const componentIds = new Set(ctx.components.map((c) => c.id));
    const storyIds = ctx.storybookIndex ? new Set(Object.keys(ctx.storybookIndex.entries)) : null;
    const at = (component) => (componentIds.has(component) ? component : undefined);

    // 1. Each registry entry is complete and current.
    for (const e of entries) {
      const missing = REQUIRED.filter((k) => !e[k]);
      if (missing.length) f.push({ level: 'error', rule: 'incomplete', component: at(e.component), message: `Exception "${e.id ?? '?'}" is missing: ${missing.join(', ')}` });
      if (byId.has(e.id)) f.push({ level: 'error', rule: 'duplicate', message: `Exception id "${e.id}" is registered twice` });
      byId.set(e.id, e);
      if (e.check && !CHECKS.has(e.check)) f.push({ level: 'error', rule: 'unknown-check', component: at(e.component), message: `Exception "${e.id}" names unknown check "${e.check}"` });
      if (e.component && !componentIds.has(e.component)) f.push({ level: 'error', rule: 'unknown-component', message: `Exception "${e.id}" names <${e.component}>, which isn't a documented component` });
      if (e.check === 'a11y' && (!e.story || !e.rules?.length)) f.push({ level: 'error', rule: 'incomplete', component: at(e.component), message: `a11y exception "${e.id}" needs "story" and "rules"` });
      if (e.check === 'a11y' && storyIds && e.story && !storyIds.has(e.story)) f.push({ level: 'warn', rule: 'stale', component: at(e.component), message: `Exception "${e.id}" points at story "${e.story}", which no longer exists` });
      if (e.review && !/^\d{4}-\d{2}-\d{2}$/.test(e.review)) f.push({ level: 'error', rule: 'review-date', component: at(e.component), message: `Exception "${e.id}" review date "${e.review}" isn't YYYY-MM-DD` });
      else if (e.review && e.review < ctx.today) f.push({ level: 'warn', rule: 'expired', component: at(e.component), message: `Exception "${e.id}" was due for review on ${e.review}. Re-review it, then fix or extend it.` });
    }

    // 2. Markers in CSS and stories point at registered entries.
    const referenced = new Set();
    const cssSources = [ctx.partsCss, ...ctx.components.map((c) => c.styles).filter(Boolean)];
    for (const { file, css } of cssSources) {
      for (const [, id] of css.matchAll(CSS_MARKER)) {
        referenced.add(id);
        if (!byId.has(id)) f.push({ level: 'error', rule: 'unregistered', file, message: `"audit-allow ${id}" has no entry in tools/audit/exceptions.json` });
      }
    }
    for (const file of walk('apps/storybook/stories').filter((p) => p.endsWith('.stories.ts'))) {
      const src = read(file);
      for (const [, id] of src.matchAll(STORY_MARKER)) {
        referenced.add(id);
        if (!byId.has(id)) f.push({ level: 'error', rule: 'unregistered', file, message: `"audit-exception: ${id}" has no entry in tools/audit/exceptions.json` });
      }
      // A story that turns off an a11y rule must say which registered exception allows it.
      const lines = src.split('\n');
      for (const [i, line] of lines.entries()) {
        for (const [, rule] of line.matchAll(RULE_OFF)) {
          const context = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
          if (!/audit-exception:\s*[\w-]+/.test(context)) {
            f.push({ level: 'error', rule: 'unmarked-rule-off', file, message: `Turns off a11y rule "${rule}" without an "// audit-exception: <id>" comment on the lines above.` });
          }
        }
      }
    }

    // 3. Token exceptions nobody uses any more are stale.
    for (const e of entries) {
      if (e.check === 'tokens' && !referenced.has(e.id)) {
        f.push({ level: 'warn', rule: 'unused', component: at(e.component), message: `Exception "${e.id}" isn't referenced by any "audit-allow ${e.id}" marker. Remove it.` });
      }
    }
    return f;
  },
};
