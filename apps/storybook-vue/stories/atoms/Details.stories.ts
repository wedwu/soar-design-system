// wa-details in Vue, loaded from the CDN. The pieces live side by side:
//   Details.data.json  the example content
//   Details.mdx        the docs page
// The templates use <wa-details> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Details.data.json';

const ATTRS = ['open', 'summary', 'name', 'disabled', 'appearance', 'icon-placement'];

/**
 * Actions panel: every event wa-details fires (from Web Awesome's manifest),
 * with which section it was. Only each element's own events are logged, not
 * the same events bubbling up from elements inside it.
 */
const detailsEvents = () =>
  Object.fromEntries(
    waEventNames('wa-details').map((name) => [
      name,
      (e: Event) => e.target === e.currentTarget && action(name)({ summary: (e.currentTarget as HTMLElement).getAttribute('summary') }),
    ]),
  );

const meta = {
  title: 'Atoms/Details',
  // No `component`: wa-details is a custom element, not a Vue component.
  // No 'autodocs': Details.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-details', ATTRS),
  args: { ...controlArgs('wa-details', ATTRS), summary: data.summary },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), content: data.content, events: detailsEvents() }),
    template: `<wa-details v-bind="attrs" v-on="events">{{ content }}</wa-details>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// "Show code" shows the real <wa-details> markup. Without it, Storybook would
// invent a Vue component name from the title (<Details .../>).
const followsControls = {
  docs: {
    source: {
      language: 'html',
      transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-details', args, ATTRS, data.content),
    },
  },
};

export const Playground: Story = { parameters: followsControls };

export const Open: Story = { args: { open: true }, parameters: followsControls };

// The fixed-example stories apply the controls to every section; the controls
// an example sets itself (its summary, which one is open...) are hidden.

const groupItems = (args: Args) =>
  withControls(args, data.group.items.map((item) => ({ name: data.group.name, summary: item.summary, open: !!item.open, content: item.content })));

export const Grouped: Story = {
  name: 'Grouped (one open at a time)',
  argTypes: hideControls('open', 'summary', 'name'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) => groupItems(args).map((item) => waSource('wa-details', item, ATTRS, item.content)).join('\n'),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ items: computed(() => groupItems(args).map((item) => ({ ...item, attrs: waAttrs(item, ATTRS) }))), events: detailsEvents() }),
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <wa-details v-for="item in items" :key="item.summary" v-bind="item.attrs" v-on="events">{{ item.content }}</wa-details>
      </div>`,
  }),
};

const appearanceItems = (args: Args) =>
  withControls(args, data.appearances.map((appearance) => ({ appearance, summary: `appearance="${appearance}"` })));

export const Appearances: Story = {
  argTypes: hideControls('appearance', 'summary'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        // appearance is written out in full: waSource would drop appearance="outlined", Web Awesome's default.
        transform: (_code: string, { args }: { args: Args }) =>
          appearanceItems(args)
            .map((item) =>
              waSource('wa-details', item, ATTRS.filter((name) => name !== 'appearance'), 'Content').replace('<wa-details', `<wa-details appearance="${item.appearance}"`),
            )
            .join('\n'),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ items: computed(() => appearanceItems(args).map((item) => ({ appearance: item.appearance, attrs: waAttrs(item, ATTRS) }))), events: detailsEvents() }),
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <wa-details v-for="item in items" :key="item.appearance" v-bind="item.attrs" v-on="events">Content</wa-details>
      </div>`,
  }),
};
