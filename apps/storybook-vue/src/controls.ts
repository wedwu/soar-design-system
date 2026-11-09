// Helpers that keep every control in the Controls panel working, on every
// story: the Playground and the fixed-example stories (Variants, Sizes...).

import type { ArgTypes } from '@storybook/vue3-vite';
import { waArgTypes, waDefaults, type WaTag } from '../../storybook/src/wa';

export type Args = Record<string, unknown>;

/**
 * Starting values for every control. waDefaults leaves out the options Web
 * Awesome gives no default (checked, name, value...), and Storybook then shows
 * a "Set boolean" / "Set string" button instead of the control. false and ''
 * still leave the attribute off, in the story and in "Show code".
 */
export function controlArgs(tag: WaTag, attrs: string[]): Args {
  const args: Args = waDefaults(tag, attrs);
  for (const [name, argType] of Object.entries(waArgTypes(tag, attrs))) {
    if (args[name] !== undefined) continue;
    if (argType.control === 'boolean') args[name] = false;
    else if (argType.control === 'text') args[name] = '';
  }
  return args;
}

/**
 * Hides the controls a story sets itself (each example varies them, like the
 * size in a Sizes story), so every control left changes something.
 */
export const hideControls = (...names: string[]): ArgTypes =>
  Object.fromEntries(names.map((name) => [name, { table: { disable: true } }]));

/** For a story where every control is set by its examples: hides the Controls panel. */
export const noControls = { controls: { disable: true } };

/** Each example with the controls underneath: what an example sets wins, the controls fill in the rest. */
export const withControls = <T extends object>(args: Args, examples: T[]): (Args & T)[] =>
  examples.map((example) => ({ ...args, ...example }));
