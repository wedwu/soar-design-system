// Canonical form of a Figma Variables payload: volatile fields dropped, remote
// (library) variables removed, keys sorted. A sync with no design change then
// produces no diff. Browser-safe: used by tools/figma-sync/pull.mjs and the
// Storybook "Figma Generation" page.

// Fields Figma may change without any design change.
const VOLATILE = new Set(['key', 'remote', 'subscribed_id', 'deletedButReferenced']);

export function canonicalize(payload) {
  const strip = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !VOLATILE.has(k)));
  const sortKeys = (v) =>
    Array.isArray(v)
      ? v.map(sortKeys)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
        : v;
  const { variableCollections, variables } = payload.meta;
  // Drop anything published from other library files: not ours to own.
  const localVars = Object.fromEntries(Object.entries(variables).filter(([, v]) => !v.remote).map(([id, v]) => [id, strip(v)]));
  const localColls = Object.fromEntries(
    Object.entries(variableCollections)
      .filter(([, c]) => !c.remote)
      .map(([id, c]) => [id, { ...strip(c), variableIds: [...c.variableIds].sort() }]),
  );
  return sortKeys({ meta: { variableCollections: localColls, variables: localVars } });
}
