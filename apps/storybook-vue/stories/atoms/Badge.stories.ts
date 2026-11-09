// wa-badge in Vue, loaded from the CDN. The pieces live side by side:
//   Badge.data.json  the example content
//   Badge.mdx        the docs page
// The templates use <wa-badge> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waSource } from '../../../storybook/src/wa';
import data from './Badge.data.json';

const ATTRS = ['variant', 'appearance', 'pill', 'attention'];

const meta = {
  title: 'Atoms/Badge',
  // No `component`: wa-badge is a custom element, not a Vue component.
  // No 'autodocs': Badge.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // badge's content, which isn't an attribute.
  argTypes: {
    ...waArgTypes('wa-badge', ATTRS),
    text: { control: 'text', description: "The badge's content.", table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-badge', ATTRS), text: data.text },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ args, attrs: computed(() => waAttrs(args, ATTRS)) }),
    template: `<wa-badge v-bind="attrs">{{ args.text }}</wa-badge>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-badge> markup, following the
// controls. Without it, Storybook would invent a Vue component name from the
// title (<Badge .../>).
const source = (code: (args: Args) => string) => ({ docs: { source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => code(args) } } });

// The fixed-example stories apply the controls to every badge; the controls
// an example sets itself (its variant, its text...) are hidden.

export const Playground: Story = {
  parameters: source((args) => waSource('wa-badge', args, ATTRS, String(args.text ?? ''))),
};

/** One row per appearance, one badge per variant, each labelled with its variant. */
const variantRows = (args: Args) =>
  data.appearances.map((appearance) => withControls(args, data.variants.map((variant) => ({ variant, appearance, text: variant }))));

export const Variants: Story = {
  argTypes: hideControls('variant', 'appearance', 'text'),
  parameters: source((args) =>
    variantRows(args)
      // Written out in full: waSource would drop Web Awesome's defaults.
      .map((row) => row.map((b) => waSource('wa-badge', b, ['pill', 'attention'], b.text).replace('<wa-badge', `<wa-badge variant="${b.variant}" appearance="${b.appearance}"`)).join('\n'))
      .join('\n\n'),
  ),
  render: (args) => ({
    setup: () => ({ rows: computed(() => variantRows(args).map((row) => row.map((b) => ({ text: b.text, attrs: waAttrs(b, ATTRS) })))) }),
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <div v-for="(row, r) in rows" :key="r" style="display: flex; gap: var(--wa-space-xs); flex-wrap: wrap">
          <wa-badge v-for="b in row" :key="b.text" v-bind="b.attrs">{{ b.text }}</wa-badge>
        </div>
      </div>`,
  }),
};

const pillBadges = (args: Args) => withControls(args, data.variants.map((variant) => ({ variant, text: variant })));

export const Pill: Story = {
  argTypes: hideControls('variant', 'text'),
  args: { pill: true },
  parameters: source((args) => pillBadges(args).map((b) => waSource('wa-badge', b, ATTRS, b.text)).join('\n')),
  render: (args) => ({
    setup: () => ({ badges: computed(() => pillBadges(args).map((b) => ({ text: b.text, attrs: waAttrs(b, ATTRS) }))) }),
    template: `
      <div style="display: flex; gap: var(--wa-space-xs); flex-wrap: wrap">
        <wa-badge v-for="b in badges" :key="b.text" v-bind="b.attrs">{{ b.text }}</wa-badge>
      </div>`,
  }),
};

const attentionBadges = (args: Args) => withControls(args, data.attention.map((b) => ({ button: b.button, variant: b.variant, attention: b.attention, text: b.count })));

export const Attention: Story = {
  argTypes: hideControls('variant', 'attention', 'text'),
  args: { pill: true },
  parameters: source((args) =>
    attentionBadges(args)
      .map((b) => `<wa-button appearance="outlined">\n  ${b.button}\n  ${waSource('wa-badge', b, ATTRS, b.text).replace('<wa-badge', '<wa-badge slot="end"')}\n</wa-button>`)
      .join('\n'),
  ),
  render: (args) => ({
    setup: () => ({ badges: computed(() => attentionBadges(args).map((b) => ({ button: b.button, text: b.text, attrs: waAttrs(b, ATTRS) }))) }),
    template: `
      <div style="display: flex; gap: var(--wa-space-s)">
        <wa-button v-for="b in badges" :key="b.button" appearance="outlined">
          {{ b.button }}
          <wa-badge slot="end" v-bind="b.attrs">{{ b.text }}</wa-badge>
        </wa-button>
      </div>`,
  }),
};

/** Icons in the badge's start and end slots, before and after the text. */
const decoratedBadges = (args: Args) =>
  withControls(args, data.decorations.map((b) => ({ variant: b.variant, text: b.text, start: b.start ?? '', end: b.end ?? '' })));

const decorationSource = (b: Args & { start: string; end: string; text: string }) => {
  const inner = [
    b.start && `<wa-icon slot="start" name="${b.start}"></wa-icon>`,
    b.text,
    b.end && `<wa-icon slot="end" name="${b.end}"></wa-icon>`,
  ].filter(Boolean);
  return waSource('wa-badge', b, ATTRS, inner.join('\n'));
};

export const Decorations: Story = {
  argTypes: hideControls('variant', 'text'),
  parameters: source((args) => decoratedBadges(args).map(decorationSource).join('\n')),
  render: (args) => ({
    setup: () => ({
      badges: computed(() => decoratedBadges(args).map((b) => ({ text: b.text, start: b.start, end: b.end, attrs: waAttrs(b, ATTRS) }))),
    }),
    template: `
      <div style="display: flex; gap: var(--wa-space-xs); flex-wrap: wrap">
        <wa-badge v-for="b in badges" :key="b.text" v-bind="b.attrs">
          <wa-icon v-if="b.start" slot="start" :name="b.start"></wa-icon>
          {{ b.text }}
          <wa-icon v-if="b.end" slot="end" :name="b.end"></wa-icon>
        </wa-badge>
      </div>`,
  }),
};
