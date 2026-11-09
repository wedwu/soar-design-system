// wa-breadcrumb and wa-breadcrumb-item in Vue, loaded from the CDN. The pieces live side by side:
//   Breadcrumb.data.json  the example content
//   Breadcrumb.mdx        the docs page
// The templates use <wa-breadcrumb> and <wa-breadcrumb-item> directly, exactly
// as a CDN page would. Nothing here imports Web Awesome or Soar: the CDN
// <script> tags in .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waSource } from '../../../storybook/src/wa';
import data from './Breadcrumb.data.json';

const ATTRS = ['label'];

type Item = { text?: string; href?: string; icon?: string; iconLabel?: string; startIcon?: string };

/** One <wa-breadcrumb-item>, for the "Show code" panel. */
function itemSource(item: Item) {
  const href = item.href ? ` href="${item.href}"` : '';
  const start = item.startIcon ? `<wa-icon slot="start" name="${item.startIcon}"></wa-icon>` : '';
  const icon = item.icon ? `<wa-icon name="${item.icon}" label="${item.iconLabel}"></wa-icon>` : '';
  return `<wa-breadcrumb-item${href}>${start}${icon}${item.text ?? ''}</wa-breadcrumb-item>`;
}

const itemsSource = (items: Item[], separator = '') =>
  [...(separator ? [`<wa-icon slot="separator" name="${separator}"></wa-icon>`] : []), ...items.map(itemSource)].join('\n');

// The breadcrumb items: shared by every story's template.
const itemsTemplate = `
  <wa-breadcrumb-item v-for="item in items" :key="item.text ?? item.icon" :href="item.href">
    <wa-icon v-if="item.startIcon" slot="start" :name="item.startIcon"></wa-icon>
    <wa-icon v-if="item.icon" :name="item.icon" :label="item.iconLabel"></wa-icon>
    {{ item.text }}
  </wa-breadcrumb-item>`;

const meta = {
  title: 'Atoms/Breadcrumb',
  // No `component`: these are custom elements, not Vue components.
  // No 'autodocs': Breadcrumb.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-breadcrumb', ATTRS),
  args: { ...controlArgs('wa-breadcrumb', ATTRS), label: data.label },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), items: data.items }),
    template: `<wa-breadcrumb v-bind="attrs">${itemsTemplate}</wa-breadcrumb>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real markup. Without it, Storybook would
// invent a Vue component name from the title (<Breadcrumb .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-breadcrumb', args, ATTRS, itemsSource(data.items)),
      },
    },
  },
};

export const CustomSeparator: Story = {
  name: 'Custom separator',
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-breadcrumb', args, ATTRS, itemsSource(data.items, data.separatorIcon)),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), items: data.items, separator: data.separatorIcon }),
    template: `
      <wa-breadcrumb v-bind="attrs">
        <wa-icon slot="separator" :name="separator"></wa-icon>
        ${itemsTemplate}
      </wa-breadcrumb>`,
  }),
};

export const WithIcons: Story = {
  name: 'With icons',
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-breadcrumb', args, ATTRS, itemsSource(data.withIcons)),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), items: data.withIcons }),
    template: `<wa-breadcrumb v-bind="attrs">${itemsTemplate}</wa-breadcrumb>`,
  }),
};
