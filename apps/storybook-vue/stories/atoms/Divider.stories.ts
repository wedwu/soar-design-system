// wa-divider in Vue, loaded from the CDN. The pieces live side by side:
//   Divider.data.json  the example content
//   Divider.mdx        the docs page
// The templates use <wa-divider> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements, and .storybook/preview.ts tells Vue they're custom elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { controlArgs, noControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waSource } from '../../../storybook/src/wa';
import data from './Divider.data.json';

const ATTRS = ['orientation', 'label-placement'];

const meta = {
  title: 'Atoms/Divider',
  // No `component`: wa-divider is a custom element, not a Vue component.
  // No 'autodocs': Divider.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN. Their names are
  // wa-divider's attribute names, so `v-bind="args"` passes them straight through.
  argTypes: waArgTypes('wa-divider', ATTRS),
  args: controlArgs('wa-divider', ATTRS),
  // Design tab: the Figma frame (when configured) and Web Awesome's docs.
  parameters: { design: designTabs(data.design) },
  render: (args) => ({
    setup: () => ({ args, text: data.playground }),
    template: `
      <div :style="{
        display: 'flex',
        flexDirection: args.orientation === 'vertical' ? 'row' : 'column',
        height: args.orientation === 'vertical' ? '4rem' : 'auto',
        alignItems: args.orientation === 'vertical' ? 'center' : 'stretch',
      }">
        <span>{{ text.before }}</span>
        <wa-divider v-bind="args"></wa-divider>
        <span>{{ text.after }}</span>
      </div>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" panel shows the real <wa-divider> markup. Without
// it, Storybook would invent a Vue component name from the title (<Divider .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-divider', args, ATTRS),
      },
    },
  },
};

// Vertical and With label show the two controls' values side by side, so they
// have no Controls panel; Playground has both controls.

export const Vertical: Story = {
  parameters: {
    ...noControls,
    docs: {
      source: {
        language: 'html',
        code: data.vertical
          .map((item, i) => `${i > 0 ? '<wa-divider orientation="vertical"></wa-divider>\n' : ''}<span>${item}</span>`)
          .join('\n'),
      },
    },
  },
  render: () => ({
    setup: () => ({ items: data.vertical }),
    template: `
      <div style="display: flex; align-items: center; gap: var(--wa-space-s); height: 1.5rem">
        <template v-for="(item, i) in items" :key="item">
          <wa-divider v-if="i > 0" orientation="vertical"></wa-divider>
          <span>{{ item }}</span>
        </template>
      </div>`,
  }),
};

export const WithLabel: Story = {
  parameters: {
    ...noControls,
    docs: {
      source: {
        language: 'html',
        code: data.labels
          .map((d) => waSource('wa-divider', { 'label-placement': 'labelPlacement' in d ? d.labelPlacement : undefined }, ATTRS, d.label))
          .join('\n'),
      },
    },
  },
  render: () => ({
    setup: () => ({ labels: data.labels }),
    template: `
      <div style="display: grid; gap: var(--wa-space-l)">
        <wa-divider
          v-for="d in labels"
          :key="d.label"
          :label-placement="d.labelPlacement"
        >{{ d.label }}</wa-divider>
      </div>`,
  }),
};
