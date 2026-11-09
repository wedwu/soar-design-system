// THE OWNERSHIP CONTRACT WITH WEB AWESOME.
//
// Every --wa-* custom property in upstream/webawesome.tokens.json must be
// classified exactly once:
//
//   owned      -> listed below. Its value comes from a Figma variable. The
//                 generator writes `--wa-x: var(--ax-y)` in a cascade layer that
//                 sits after every WA layer, so upstream defaults can never win.
//   inherited  -> listed in inherited.json. We take WA's default as-is and the
//                 upstream bump report tells us when that default changes.
//
// `npm run check:ownership` fails on anything unclassified, on owned properties that no
// longer exist upstream (they'd become silent no-ops), and on owned properties
// pointing at Figma variables that no longer exist.
//
// Hand-edited. Reviewed by design-system owners (see .github/CODEOWNERS).

const RAMP_STEPS = ['95', '90', '80', '70', '60', '50', '40', '30', '20', '10', '05'];

/** WA's five color variants are 11-step ramps plus a key color and an "on" color. */
function ramp(hue) {
  const map = {};
  for (const step of RAMP_STEPS) map[`--wa-color-${hue}-${step}`] = `color/${hue}/${step}`;
  map[`--wa-color-${hue}`] = `color/${hue}/50`;
  map[`--wa-color-${hue}-on`] = `color/${hue}/on`;
  return map;
}

export const owned = {
  // Color ramps. Owning these re-skins every WA semantic color we don't
  // explicitly override below (success/warning/danger fills, borders, etc.).
  ...ramp('brand'),
  ...ramp('neutral'),
  ...ramp('success'),
  ...ramp('warning'),
  ...ramp('danger'),

  // Semantic colors design defines per mode.
  '--wa-color-surface-raised': 'color/surface/raised',
  '--wa-color-surface-default': 'color/surface/default',
  '--wa-color-surface-lowered': 'color/surface/lowered',
  '--wa-color-surface-border': 'color/surface/border',
  '--wa-color-text-normal': 'color/text/normal',
  '--wa-color-text-quiet': 'color/text/quiet',
  '--wa-color-text-link': 'color/text/link',
  '--wa-color-focus': 'color/focus',
  '--wa-color-brand-fill-quiet': 'color/brand/fill-quiet',
  '--wa-color-brand-fill-normal': 'color/brand/fill-normal',
  '--wa-color-brand-fill-loud': 'color/brand/fill-loud',
  '--wa-color-brand-border-quiet': 'color/brand/border-quiet',
  '--wa-color-brand-border-normal': 'color/brand/border-normal',
  '--wa-color-brand-border-loud': 'color/brand/border-loud',
  '--wa-color-brand-on-quiet': 'color/brand/on-quiet',
  '--wa-color-brand-on-normal': 'color/brand/on-normal',
  '--wa-color-brand-on-loud': 'color/brand/on-loud',
  // WA's default is white, which fails contrast (3.2:1) on Soar's warning
  // fill. Figma's warning "on" color is dark. Found by test/contrast.test.mjs.
  '--wa-color-warning-on-loud': 'color/warning/on',

  // Space
  '--wa-space-3xs': 'space/3xs',
  '--wa-space-2xs': 'space/2xs',
  '--wa-space-xs': 'space/xs',
  '--wa-space-s': 'space/s',
  '--wa-space-m': 'space/m',
  '--wa-space-l': 'space/l',
  '--wa-space-xl': 'space/xl',
  '--wa-space-2xl': 'space/2xl',
  '--wa-space-3xl': 'space/3xl',
  '--wa-space-4xl': 'space/4xl',
  '--wa-space-5xl': 'space/5xl',

  // Shape
  '--wa-border-radius-s': 'radius/s',
  '--wa-border-radius-m': 'radius/m',
  '--wa-border-radius-l': 'radius/l',
  '--wa-border-radius-pill': 'radius/pill',
  '--wa-border-width-s': 'border-width/s',
  '--wa-border-width-m': 'border-width/m',
  '--wa-border-width-l': 'border-width/l',
  '--wa-focus-ring-width': 'focus/ring-width',

  // Typography. WA derives the whole size scale from --wa-font-size-m by
  // ratio, so Figma only needs to own the base size.
  '--wa-font-family-body': 'font/family/body',
  '--wa-font-family-heading': 'font/family/heading',
  '--wa-font-family-code': 'font/family/code',
  '--wa-font-size-m': 'font/size/base',
  '--wa-font-weight-light': 'font/weight/light',
  '--wa-font-weight-normal': 'font/weight/normal',
  '--wa-font-weight-semibold': 'font/weight/semibold',
  '--wa-font-weight-bold': 'font/weight/bold',
  '--wa-line-height-condensed': 'font/line-height/condensed',
  '--wa-line-height-normal': 'font/line-height/normal',
  '--wa-line-height-expanded': 'font/line-height/expanded',

  // Motion
  '--wa-transition-fast': 'motion/duration/fast',
  '--wa-transition-normal': 'motion/duration/normal',
  '--wa-transition-slow': 'motion/duration/slow',
};

/**
 * Figma variables that apps consume directly rather than through Web Awesome.
 * They aren't mapped to any --wa-* property, and the audit doesn't flag them
 * as unused. Breakpoints: Web Awesome has no breakpoint tokens, and CSS custom
 * properties can't be used in @media, so the build emits dedicated formats.
 */
export const appFacing = [/^breakpoint\//];

/**
 * Inherited properties whose names follow a pattern instead of being listed
 * one by one. Keep this short: anything a pattern matches is accepted without
 * review when upstream adds it. The bump report still lists every new match.
 */
export const inheritedPatterns = [
  // WA's raw hue palette (red, orange, ... pink). We never reference hues
  // directly; we own the brand/neutral/success/warning/danger ramps instead.
  /^--wa-color-(red|orange|yellow|green|cyan|blue|indigo|purple|pink|gray)(-\d\d|-key|-on)?$/,
];
