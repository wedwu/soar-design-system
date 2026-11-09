// wa-skeleton in Vue, loaded from the CDN. The pieces live side by side:
//   Skeleton.data.json  the example content
//   Skeleton.mdx        the docs page
// The templates use <wa-skeleton> directly, exactly as a CDN page would.
// Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { controlArgs, noControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waSource } from '../../../storybook/src/wa';
import data from './Skeleton.data.json';

const ATTRS = ['effect'];

const column = 'display: grid; gap: var(--wa-space-s); max-width: 24rem';

const meta = {
  title: 'Atoms/Skeleton',
  // No `component`: wa-skeleton is a custom element, not a Vue component.
  // No 'autodocs': Skeleton.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-skeleton', ATTRS),
  args: controlArgs('wa-skeleton', ATTRS),
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)) }),
    template: `<wa-skeleton v-bind="attrs" style="max-width: 24rem"></wa-skeleton>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-skeleton> markup. Without it,
// Storybook would invent a Vue component name from the title (<Skeleton .../>).
const html = (code: string) => ({ docs: { source: { language: 'html', code } } });

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-skeleton', args, ATTRS),
      },
    },
  },
};

// Effects shows every value of the one control side by side, so it has no
// Controls panel.
export const Effects: Story = {
  // Written out in full: waSource would drop effect="none", Web Awesome's default.
  parameters: { ...noControls, ...html(data.effects.map((effect) => `<wa-skeleton effect="${effect}"></wa-skeleton>`).join('\n')) },
  render: () => ({
    setup: () => ({ effects: data.effects, column }),
    template: `
      <div :style="column">
        <wa-skeleton v-for="effect in effects" :key="effect" :effect="effect"></wa-skeleton>
      </div>`,
  }),
};

/** One placeholder shape, for the "Show code" panel. */
const shapeSource = (args: Record<string, unknown>, style: string) => waSource('wa-skeleton', args, ATTRS).replace('<wa-skeleton', `<wa-skeleton${style ? ` style="${style}"` : ''}`);

export const CardPlaceholder: Story = {
  name: 'Card placeholder',
  args: { effect: data.card.effect },
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
          [
            '<div style="display: flex; gap: var(--wa-space-s); align-items: center">',
            `  ${shapeSource(args, data.card.avatar)}`,
            `  ${shapeSource(args, data.card.name)}`,
            '</div>',
            ...data.card.lines.map((style) => shapeSource(args, style)),
          ].join('\n'),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), card: data.card, column }),
    template: `
      <div :style="column">
        <div style="display: flex; gap: var(--wa-space-s); align-items: center">
          <wa-skeleton v-bind="attrs" :style="card.avatar"></wa-skeleton>
          <wa-skeleton v-bind="attrs" :style="card.name"></wa-skeleton>
        </div>
        <wa-skeleton v-for="(style, i) in card.lines" :key="i" v-bind="attrs" :style="style || undefined"></wa-skeleton>
      </div>`,
  }),
};
