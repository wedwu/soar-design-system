// wa-spinner in Vue, loaded from the CDN. The pieces live side by side:
//   Spinner.data.json  the example content
//   Spinner.mdx        the docs page
// The templates use <wa-spinner> directly, exactly as a CDN page would.
// Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { noControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import data from './Spinner.data.json';

const meta = {
  title: 'Atoms/Spinner',
  // No `component`: wa-spinner is a custom element, not a Vue component.
  // No 'autodocs': Spinner.mdx is the docs page.
  tags: ['upstream'],
  // wa-spinner has no attributes: it's sized with font-size and styled with
  // CSS custom properties. The one control sets font-size.
  argTypes: {
    'font-size': { control: 'text', description: 'The spinner scales with font-size.', table: { category: 'story' } },
  },
  args: { 'font-size': data.fontSize },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ args }),
    template: `<wa-spinner :style="{ fontSize: args['font-size'] }"></wa-spinner>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-spinner> markup. Without it,
// Storybook would invent a Vue component name from the title (<Spinner .../>).
const html = (code: string) => ({ docs: { source: { language: 'html', code } } });

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the control.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => `<wa-spinner style="font-size: ${String(args['font-size'])}"></wa-spinner>`,
      },
    },
  },
};

// Sizes shows several font-sizes side by side, so it has no Controls panel.
export const Sizes: Story = {
  parameters: { ...noControls, ...html(data.sizes.map((size) => `<wa-spinner style="font-size: ${size}"></wa-spinner>`).join('\n')) },
  render: () => ({
    setup: () => ({ sizes: data.sizes }),
    template: `
      <div style="display: flex; gap: var(--wa-space-m); align-items: center">
        <wa-spinner v-for="size in sizes" :key="size" :style="{ fontSize: size }"></wa-spinner>
      </div>`,
  }),
};

export const TrackWidth: Story = {
  name: 'Track width',
  argTypes: {
    'track-width': { control: 'text', description: 'The ring\'s thickness: the `--track-width` CSS custom property.', table: { category: 'story' } },
  },
  args: { 'font-size': data.trackWidth.fontSize, 'track-width': data.trackWidth.trackWidth },
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
          `<wa-spinner style="font-size: ${String(args['font-size'])}; --track-width: ${String(args['track-width'])}"></wa-spinner>`,
      },
    },
  },
  render: (args: Record<string, unknown>) => ({
    setup: () => ({ style: computed(() => ({ fontSize: args['font-size'], '--track-width': args['track-width'] })) }),
    template: `<wa-spinner :style="style"></wa-spinner>`,
  }),
};
