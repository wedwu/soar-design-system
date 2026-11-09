// wa-callout in Vue, loaded from the CDN. The pieces live side by side:
//   Callout.data.json  the example content
//   Callout.mdx        the docs page
// The templates use <wa-callout> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waSource } from '../../../storybook/src/wa';
import data from './Callout.data.json';

const ATTRS = ['variant', 'appearance', 'size'];

const icons = data.icons as Record<string, string>;
const iconFor = (variant: unknown) => icons[String(variant)] ?? icons.brand;

/** The icon slot plus the message, for the "Show code" panel. */
const contentSource = (variant: unknown, message: string) => `<wa-icon slot="icon" name="${iconFor(variant)}"></wa-icon>\n${message}`;

const meta = {
  title: 'Atoms/Callout',
  // No `component`: wa-callout is a custom element, not a Vue component.
  // No 'autodocs': Callout.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // message, which is the callout's content rather than an attribute.
  argTypes: {
    ...waArgTypes('wa-callout', ATTRS),
    text: { control: 'text', description: 'The message (the callout\'s content).', table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-callout', ATTRS), text: data.text },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  // The icon follows the variant (info for brand, a check for success, ...).
  render: (args) => ({
    setup: () => ({ args, attrs: computed(() => waAttrs(args, ATTRS)), icon: computed(() => iconFor(args.variant)) }),
    template: `<wa-callout v-bind="attrs"><wa-icon slot="icon" :name="icon"></wa-icon>{{ args.text }}</wa-callout>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-callout> markup. Without it,
// Storybook would invent a Vue component name from the title (<Callout .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
          waSource('wa-callout', args, ATTRS, contentSource(args.variant, String(args.text ?? ''))),
      },
    },
  },
};

// The fixed-example stories apply the controls to every callout; the controls
// an example sets itself (its variant or appearance, its message) are hidden.

/** A callout with its icon and message, for the "Show code" panel. */
const calloutSource = (args: Args, message: string, written: string) =>
  waSource('wa-callout', args, ATTRS.filter((name) => name !== written), contentSource(args.variant, message)).replace(
    '<wa-callout',
    `<wa-callout ${written}="${String(args[written])}"`,
  );

const variantCallouts = (args: Args): Args[] => Object.keys(icons).map((variant) => ({ ...args, variant }));

export const Variants: Story = {
  argTypes: hideControls('variant', 'text'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        // variant is written out in full: waSource would drop variant="brand", Web Awesome's default.
        transform: (_code: string, { args }: { args: Args }) =>
          variantCallouts(args)
            .map((c) => calloutSource(c, `This is a <strong>${String(c.variant)}</strong> callout.`, 'variant'))
            .join('\n'),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ callouts: computed(() => variantCallouts(args).map((c) => ({ variant: c.variant, icon: iconFor(c.variant), attrs: waAttrs(c, ATTRS) }))) }),
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <wa-callout v-for="c in callouts" :key="c.variant" v-bind="c.attrs">
          <wa-icon slot="icon" :name="c.icon"></wa-icon>This is a <strong>{{ c.variant }}</strong> callout.
        </wa-callout>
      </div>`,
  }),
};

const appearanceCallouts = (args: Args): Args[] => data.appearances.map((appearance) => ({ ...args, appearance }));

export const Appearances: Story = {
  argTypes: hideControls('appearance', 'text'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) =>
          appearanceCallouts(args)
            .map((c) => calloutSource(c, `appearance="${String(c.appearance)}"`, 'appearance'))
            .join('\n'),
      },
    },
  },
  render: (args) => ({
    setup: () => ({
      callouts: computed(() => appearanceCallouts(args).map((c) => ({ appearance: c.appearance, icon: iconFor(c.variant), attrs: waAttrs(c, ATTRS) }))),
    }),
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <wa-callout v-for="c in callouts" :key="c.appearance" v-bind="c.attrs">
          <wa-icon slot="icon" :name="c.icon"></wa-icon>appearance="{{ c.appearance }}"
        </wa-callout>
      </div>`,
  }),
};
