// Browser-safe (no node: imports): the Storybook "Figma Generation" page runs it.
import { owned, inheritedPatterns } from './alias-map.mjs';
import inheritedList from './inherited.json' with { type: 'json' };

export const inheritedExact = new Set(inheritedList.properties);

/** 'owned' | 'inherited' | 'inherited:pattern' | 'unclassified' */
export function classify(prop) {
  if (prop in owned) return 'owned';
  if (inheritedExact.has(prop)) return 'inherited';
  if (inheritedPatterns.some((re) => re.test(prop))) return 'inherited:pattern';
  return 'unclassified';
}

export { owned, inheritedPatterns };
