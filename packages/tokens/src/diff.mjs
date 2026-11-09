// Change reports for the two things that move underneath us.
//
//   diffFigma(old, new)       two figma/export.json payloads
//   diffUpstream(old, new)    two upstream snapshots (tokens + parts)
//
// Both return structured results plus a `blocking` list. Blocking means "a
// human has to make a decision before this can merge"; it never means
// "something got overwritten", because nothing is overwritten implicitly.
//
// CLI: src/diff-cli.mjs. This module is browser-safe (no node: imports), so
// the Storybook "Figma Generation" page runs the same diff.
import { normalize } from './normalize.mjs';
import { classify, owned } from './classify.mjs';

export function diffFigma(oldExport, newExport) {
  const before = new Map(normalize(oldExport).map((t) => [t.id, t]));
  const after = new Map(normalize(newExport).map((t) => [t.id, t]));
  const feeds = new Map();
  for (const [wa, name] of Object.entries(owned)) feeds.set(name, [...(feeds.get(name) ?? []), wa]);

  const added = [];
  const removed = [];
  const renamed = [];
  const changed = [];
  const blocking = [];

  for (const [id, t] of after) {
    const prev = before.get(id);
    if (!prev) {
      added.push(t);
      continue;
    }
    if (prev.name !== t.name) {
      renamed.push({ from: prev.name, to: t.name, feeds: feeds.get(prev.name) ?? [] });
      // Figma IDs survive renames; our alias map is keyed by name. Surface it
      // instead of letting the WA property silently fall back to upstream.
      if (feeds.has(prev.name)) blocking.push(`Renamed "${prev.name}" -> "${t.name}" is referenced by alias-map.mjs (${feeds.get(prev.name).join(', ')}). Update the map.`);
    }
    for (const mode of new Set([...Object.keys(prev.values), ...Object.keys(t.values)])) {
      if (prev.values[mode] !== t.values[mode]) {
        changed.push({ name: t.name, mode, from: prev.values[mode], to: t.values[mode], feeds: feeds.get(t.name) ?? [] });
      }
    }
  }
  for (const [id, t] of before) {
    if (after.has(id)) continue;
    removed.push({ ...t, feeds: feeds.get(t.name) ?? [] });
    if (feeds.has(t.name)) blocking.push(`Deleted "${t.name}" is referenced by alias-map.mjs (${feeds.get(t.name).join(', ')}).`);
  }

  return { added, removed, renamed, changed, blocking };
}

export function diffUpstream(oldSnap, newSnap) {
  const o = oldSnap.tokens.properties;
  const n = newSnap.tokens.properties;
  const added = [];
  const removed = [];
  const changed = [];
  const blocking = [];

  for (const prop of Object.keys(n)) {
    if (!(prop in o)) {
      const cls = classify(prop);
      added.push({ prop, cls, value: n[prop] });
      if (cls === 'unclassified') blocking.push(`New upstream property ${prop} must be classified (alias-map.mjs or inherited.json).`);
      continue;
    }
    for (const scheme of new Set([...Object.keys(o[prop]), ...Object.keys(n[prop])])) {
      if (scheme === 'source') continue;
      if (o[prop][scheme] !== n[prop][scheme]) {
        changed.push({ prop, scheme, cls: classify(prop), from: o[prop][scheme], to: n[prop][scheme] });
      }
    }
  }
  for (const prop of Object.keys(o)) {
    if (prop in n) continue;
    const cls = classify(prop);
    removed.push({ prop, cls });
    if (cls === 'owned') blocking.push(`Owned property ${prop} was removed upstream; our Figma value no longer reaches any component.`);
  }

  const layersChanged = JSON.stringify(oldSnap.tokens.layers) !== JSON.stringify(newSnap.tokens.layers);
  if (layersChanged) blocking.push(`WA cascade layers changed: ${oldSnap.tokens.layers.join(', ')} -> ${newSnap.tokens.layers.join(', ')}`);

  const parts = { added: [], removed: [] };
  const oe = oldSnap.parts.elements;
  const ne = newSnap.parts.elements;
  for (const tag of new Set([...Object.keys(oe), ...Object.keys(ne)])) {
    const before = new Set(oe[tag]?.parts ?? []);
    const after = new Set(ne[tag]?.parts ?? []);
    for (const p of after) if (!before.has(p)) parts.added.push(`${tag}::part(${p})`);
    for (const p of before) if (!after.has(p)) parts.removed.push(`${tag}::part(${p})`);
  }
  // Whether a removed part is *used* is the audit's job (it reads parts.css).

  return {
    from: oldSnap.tokens.version,
    to: newSnap.tokens.version,
    added,
    removed,
    changed,
    layersChanged,
    parts,
    blocking,
  };
}

export function figmaReport(d) {
  const lines = ['## Figma token changes', ''];
  if (d.blocking.length) lines.push('### Blocking', ...d.blocking.map((b) => `- ${b}`), '');
  if (d.changed.length) {
    lines.push('### Changed values', '', '| Variable | Mode | Before | After | Feeds WA |', '|---|---|---|---|---|');
    for (const c of d.changed) lines.push(`| \`${c.name}\` | ${c.mode} | \`${c.from}\` | \`${c.to}\` | ${c.feeds.map((f) => `\`${f}\``).join(' ') || '-'} |`);
    lines.push('');
  }
  if (d.renamed.length) lines.push('### Renamed', ...d.renamed.map((r) => `- \`${r.from}\` -> \`${r.to}\``), '');
  if (d.added.length) lines.push('### Added (not yet mapped)', ...d.added.map((t) => `- \`${t.name}\` (${t.type})`), '');
  if (d.removed.length) lines.push('### Removed', ...d.removed.map((t) => `- \`${t.name}\``), '');
  if (lines.length === 2) lines.push('No changes.');
  return lines.join('\n') + '\n';
}

export function upstreamReport(d) {
  const lines = [`## Web Awesome ${d.from} -> ${d.to}`, ''];
  if (d.blocking.length) lines.push('### Blocking', ...d.blocking.map((b) => `- ${b}`), '');
  const byCls = (cls) => d.changed.filter((c) => c.cls.startsWith(cls));
  const ownedChanges = byCls('owned');
  const inheritedChanges = byCls('inherited');
  if (ownedChanges.length) {
    lines.push('### Upstream default changed on properties we own (no visual effect, our value still wins)');
    for (const c of ownedChanges) lines.push(`- \`${c.prop}\` [${c.scheme}]: \`${c.from}\` -> \`${c.to}\``);
    lines.push('');
  }
  if (inheritedChanges.length) {
    lines.push('### Upstream default changed on inherited properties (WILL change our visuals; check Chromatic)');
    for (const c of inheritedChanges) lines.push(`- \`${c.prop}\` [${c.scheme}]: \`${c.from}\` -> \`${c.to}\``);
    lines.push('');
  }
  if (d.added.length) lines.push('### New properties', ...d.added.map((a) => `- \`${a.prop}\` (${a.cls})`), '');
  if (d.removed.length) lines.push('### Removed properties', ...d.removed.map((r) => `- \`${r.prop}\` (${r.cls})`), '');
  if (d.parts.added.length || d.parts.removed.length) {
    lines.push('### Shadow parts');
    lines.push(...d.parts.removed.map((p) => `- removed \`${p}\``), ...d.parts.added.map((p) => `- added \`${p}\``), '');
  }
  if (lines.length === 2) lines.push('No token or part changes.');
  return lines.join('\n') + '\n';
}
