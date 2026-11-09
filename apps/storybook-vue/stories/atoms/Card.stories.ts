// wa-card in Vue, loaded from the CDN. The pieces live side by side:
//   Card.data.json  the example content
//   Card.mdx        the docs page
// The templates use <wa-card> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waSource } from '../../../storybook/src/wa';
import data from './Card.data.json';

const ATTRS = ['appearance', 'orientation'];

/** The header, body and footer inside the card, for the "Show code" panel. */
const contentSource = [
  '<div slot="header" style="display: flex; justify-content: space-between; align-items: center">',
  `  <strong>${data.header.title}</strong>`,
  `  <wa-badge variant="${data.header.badgeVariant}">${data.header.badge}</wa-badge>`,
  '</div>',
  data.body,
  '<div slot="footer" style="display: flex; gap: var(--wa-space-s)">',
  ...data.actions.map(
    (a) => `  <wa-button size="s"${a.appearance ? ` appearance="${a.appearance}"` : ''}${'variant' in a ? ` variant="${a.variant}"` : ''}>${a.text}</wa-button>`,
  ),
  '</div>',
].join('\n');

const meta = {
  title: 'Atoms/Card',
  // No `component`: wa-card is a custom element, not a Vue component.
  // No 'autodocs': Card.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-card', ATTRS),
  args: controlArgs('wa-card', ATTRS),
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), data, onAction: (text: string) => action('footer-action')(text) }),
    template: `
      <wa-card v-bind="attrs" style="max-width: 24rem">
        <div slot="header" style="display: flex; justify-content: space-between; align-items: center">
          <strong>{{ data.header.title }}</strong>
          <wa-badge :variant="data.header.badgeVariant">{{ data.header.badge }}</wa-badge>
        </div>
        {{ data.body }}
        <div slot="footer" style="display: flex; gap: var(--wa-space-s)">
          <wa-button
            v-for="a in data.actions"
            :key="a.text"
            size="s"
            :appearance="a.appearance"
            :variant="a.variant"
            @click="onAction(a.text)"
          >{{ a.text }}</wa-button>
        </div>
      </wa-card>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-card> markup. Without it,
// Storybook would invent a Vue component name from the title (<Card .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-card', args, ATTRS, contentSource),
      },
    },
  },
};

export const BodyOnly: Story = {
  name: 'Body only',
  parameters: {
    docs: { source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => waSource('wa-card', args, ATTRS, data.bodyOnly) } },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), text: data.bodyOnly }),
    template: `<wa-card v-bind="attrs" style="max-width: 24rem">{{ text }}</wa-card>`,
  }),
};

// One card per appearance, with the other controls applied to each.
const appearanceCards = (args: Args): Args[] => data.appearances.map((appearance) => ({ ...args, appearance }));

export const Appearances: Story = {
  argTypes: hideControls('appearance'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        // appearance is written out in full: waSource would drop Web Awesome's default.
        transform: (_code: string, { args }: { args: Args }) =>
          appearanceCards(args)
            .map((c) =>
              waSource('wa-card', c, ATTRS.filter((name) => name !== 'appearance'), `<div slot="header">${String(c.appearance)}</div>\nCard body`).replace(
                '<wa-card',
                `<wa-card appearance="${String(c.appearance)}"`,
              ),
            )
            .join('\n'),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ cards: computed(() => appearanceCards(args).map((c) => ({ appearance: c.appearance, attrs: waAttrs(c, ATTRS) }))) }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: var(--wa-space-m)">
        <wa-card v-for="c in cards" :key="c.appearance" v-bind="c.attrs">
          <div slot="header">{{ c.appearance }}</div>
          Card body
        </wa-card>
      </div>`,
  }),
};
