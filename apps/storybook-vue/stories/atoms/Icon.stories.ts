// wa-icon in Vue, loaded from the CDN. The pieces live side by side:
//   Icon.data.json  the example content
//   Icon.mdx        the docs page
// The templates use <wa-icon> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Icon.data.json';

const ATTRS = ['name', 'label', 'family', 'variant', 'rotate', 'flip', 'auto-width'];

/** Actions panel: wa-load (the icon arrived) and wa-error (it didn't), with the icon's name. */
const iconEvents = () =>
  Object.fromEntries(waEventNames('wa-icon').map((name) => [name, (e: Event) => action(name)({ name: (e.currentTarget as HTMLElement).getAttribute('name') })]));

const row = 'display: flex; flex-wrap: wrap; gap: var(--wa-space-m); align-items: center';

const meta = {
  title: 'Atoms/Icon',
  // No `component`: wa-icon is a custom element, not a Vue component.
  // No 'autodocs': Icon.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `font-size`,
  // which is how icons are sized.
  argTypes: {
    ...waArgTypes('wa-icon', ATTRS),
    'font-size': { control: 'text', description: 'Icons scale with font-size.', table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-icon', ATTRS), name: data.name, 'font-size': data.fontSize },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ args, attrs: computed(() => waAttrs(args, ATTRS)), events: iconEvents() }),
    template: `<wa-icon v-bind="attrs" v-on="events" :style="{ fontSize: args['font-size'] }"></wa-icon>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-icon> markup. Without it,
// Storybook would invent a Vue component name from the title (<Icon .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
          waSource('wa-icon', args, ATTRS).replace('<wa-icon', `<wa-icon style="font-size: ${String(args['font-size'])}"`),
      },
    },
  },
};

// The fixed-example stories apply the controls to every icon; the controls an
// example sets itself (its name, its rotation...) are hidden.

/** An icon's markup with its font-size, for the "Show code" panel. */
const iconSource = (icon: Args) => waSource('wa-icon', icon, ATTRS).replace('<wa-icon', `<wa-icon style="font-size: ${String(icon['font-size'])}"`);
const source = (icons: (args: Args) => Args[]) => ({
  docs: { source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => icons(args).map(iconSource).join('\n') } },
});

/** A row of icons, each with its attributes and font-size. */
const iconRow = (icons: (args: Args) => Args[]) => (args: Args) => ({
  setup: () => ({
    icons: computed(() => icons(args).map((icon, i) => ({ key: i, attrs: waAttrs(icon, ATTRS), style: { fontSize: icon['font-size'] } }))),
    row,
    events: iconEvents(),
  }),
  template: `
    <div :style="row">
      <wa-icon v-for="icon in icons" :key="icon.key" v-bind="icon.attrs" :style="icon.style" v-on="events"></wa-icon>
    </div>`,
});

const commonIcons = (args: Args) => withControls(args, data.common.map((name) => ({ name, label: name })));

export const Common: Story = {
  argTypes: hideControls('name', 'label'),
  args: { 'font-size': '1.5rem' },
  parameters: source(commonIcons),
  render: iconRow(commonIcons),
};

const variantIcons = (args: Args) => withControls(args, data.variants.map((icon) => ({ family: '', variant: '', ...icon })));

export const Variants: Story = {
  argTypes: hideControls('name', 'variant', 'family', 'label'),
  parameters: source(variantIcons),
  render: iconRow(variantIcons),
};

const sizedIcons = (args: Args) => withControls(args, data.sizes.map((size) => ({ 'font-size': size })));

export const Sizing: Story = {
  argTypes: hideControls('font-size'),
  args: { name: data.sizingIcon },
  parameters: source(sizedIcons),
  render: iconRow(sizedIcons),
};

const transformedIcons = (args: Args) => withControls(args, data.transforms.map((icon) => ({ rotate: 0, flip: '', ...icon })));

export const RotateAndFlip: Story = {
  name: 'Rotate and flip',
  argTypes: hideControls('name', 'rotate', 'flip', 'label'),
  parameters: source(transformedIcons),
  render: iconRow(transformedIcons),
};
