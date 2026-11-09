// wa-button-group in Vue, loaded from the CDN. The pieces live side by side:
//   ButtonGroup.data.json  the example content
//   ButtonGroup.mdx        the docs page
// The templates use <wa-button-group> directly, exactly as a CDN page would.
// Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waSource } from '../../../storybook/src/wa';
import data from './ButtonGroup.data.json';

const ATTRS = ['label', 'orientation'];

/** Actions panel: which button was clicked. wa-button-group itself fires no events. */
const onClick = (name: string) => action('click')(name);

const buttonsSource = data.buttons.map((b) => `<wa-button appearance="filled">${b}</wa-button>`).join('\n');

const meta = {
  title: 'Atoms/ButtonGroup',
  // No `component`: wa-button-group is a custom element, not a Vue component.
  // No 'autodocs': ButtonGroup.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-button-group', ATTRS),
  args: { ...controlArgs('wa-button-group', ATTRS), label: data.label },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), buttons: data.buttons, onClick }),
    template: `
      <wa-button-group v-bind="attrs">
        <wa-button v-for="b in buttons" :key="b" appearance="filled" @click="onClick(b)">{{ b }}</wa-button>
      </wa-button-group>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// "Show code" shows the real markup for the current controls. Without it,
// Storybook would invent a Vue component name from the title (<ButtonGroup .../>).
const followsControls = {
  docs: {
    source: {
      language: 'html',
      transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-button-group', args, ATTRS, buttonsSource),
    },
  },
};

export const Playground: Story = { parameters: followsControls };

export const Vertical: Story = { args: { orientation: 'vertical', label: data.vertical.label }, parameters: followsControls };

export const IconToolbar: Story = {
  name: 'Icon toolbar',
  args: { label: data.toolbar.label },
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource(
          'wa-button-group',
          args,
          ATTRS,
          data.toolbar.buttons.map((b) => `<wa-button appearance="outlined"><wa-icon name="${b.icon}" label="${b.label}"></wa-icon></wa-button>`).join('\n'),
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), toolbar: data.toolbar, onClick }),
    template: `
      <wa-button-group v-bind="attrs">
        <wa-button v-for="b in toolbar.buttons" :key="b.icon" appearance="outlined" @click="onClick(b.label)">
          <wa-icon :name="b.icon" :label="b.label"></wa-icon>
        </wa-button>
      </wa-button-group>`,
  }),
};

export const SplitButton: Story = {
  name: 'Split button',
  args: { label: data.split.label },
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource(
          'wa-button-group',
          args,
          ATTRS,
          [
            `<wa-button variant="brand">${data.split.main}</wa-button>`,
            '<wa-dropdown placement="bottom-end">',
            `  <wa-button slot="trigger" variant="brand"><wa-icon name="chevron-down" label="${data.split.menuLabel}"></wa-icon></wa-button>`,
            ...data.split.items.map((i) => `  <wa-dropdown-item value="${i.value}">${i.text}</wa-dropdown-item>`),
            '</wa-dropdown>',
          ].join('\n'),
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({
      attrs: computed(() => waAttrs(args, ATTRS)),
      split: data.split,
      onClick,
      // The menu's choice: wa-select's detail.item.value.
      onSelect: (e: CustomEvent<{ item: { value: string } }>) => action('wa-select')({ value: e.detail.item.value }),
    }),
    // min-height leaves room for the open menu inside the story.
    template: `
      <div style="min-height: 9rem">
        <wa-button-group v-bind="attrs">
          <wa-button variant="brand" @click="onClick(split.main)">{{ split.main }}</wa-button>
          <wa-dropdown placement="bottom-end" @wa-select="onSelect">
            <wa-button slot="trigger" variant="brand"><wa-icon name="chevron-down" :label="split.menuLabel"></wa-icon></wa-button>
            <wa-dropdown-item v-for="i in split.items" :key="i.value" :value="i.value">{{ i.text }}</wa-dropdown-item>
          </wa-dropdown>
        </wa-button-group>
      </div>`,
  }),
};
