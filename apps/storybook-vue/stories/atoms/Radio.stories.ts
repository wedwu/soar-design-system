// wa-radio-group and wa-radio in Vue, loaded from the CDN. The pieces live side by side:
//   Radio.data.json  the example content
//   Radio.mdx        the docs page
// The templates use <wa-radio-group> and <wa-radio> directly, exactly as a CDN
// page would. Nothing here imports Web Awesome or Soar: the CDN <script> tags
// in .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Radio.data.json';

// Radios always sit inside a group, which owns the label, value, validation and
// form participation, so the controls configure <wa-radio-group>.
const ATTRS = ['label', 'hint', 'name', 'value', 'orientation', 'size', 'disabled', 'required'];

type Option = { value: string; text: string; disabled?: boolean };

/** The radios inside the group, for the "Show code" panel. */
const optionsSource = (options: Option[], appearance?: string) =>
  options
    .map((o) => `<wa-radio${appearance ? ` appearance="${appearance}"` : ''} value="${o.value}"${o.disabled ? ' disabled' : ''}>${o.text}</wa-radio>`)
    .join('\n');

/** Actions panel: the group's events (from Web Awesome's manifest), with its value. */
const groupEvents = () =>
  Object.fromEntries(
    waEventNames('wa-radio-group').map((name) => [name, (e: Event) => action(name)({ value: (e.currentTarget as HTMLInputElement).value })]),
  );

const meta = {
  title: 'Atoms/Radio',
  // No `component`: these are custom elements, not Vue components.
  // No 'autodocs': Radio.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-radio-group', ATTRS),
  args: { ...controlArgs('wa-radio-group', ATTRS), ...data.group },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup() {
      const attrs = computed(() => waAttrs(args, ATTRS));
      return { attrs, options: data.options, events: groupEvents() };
    },
    template: `
      <wa-radio-group v-bind="attrs" v-on="events">
        <wa-radio
          v-for="o in options"
          :key="o.value"
          :value="o.value"
          :disabled="o.disabled || undefined"
        >{{ o.text }}</wa-radio>
      </wa-radio-group>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// "Show code" shows the real markup for the current controls. Without it,
// Storybook would invent a Vue component name from the title (<Radio .../>).
const followsControls = {
  docs: {
    source: {
      language: 'html',
      transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
        waSource('wa-radio-group', args, ATTRS, optionsSource(data.options)),
    },
  },
};

export const Playground: Story = { parameters: followsControls };

export const Horizontal: Story = { args: { orientation: 'horizontal' }, parameters: followsControls };

// Every control applies; the story starts with its own group's label, name and value.
const { options: buttonOptions, ...buttonGroup } = data.buttons;

export const ButtonAppearance: Story = {
  name: 'Button appearance',
  args: { ...buttonGroup, hint: '', orientation: 'horizontal' },
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-radio-group', args, ATTRS, optionsSource(buttonOptions, 'button')),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), options: buttonOptions, events: groupEvents() }),
    template: `
      <wa-radio-group v-bind="attrs" v-on="events">
        <wa-radio v-for="o in options" :key="o.value" appearance="button" :value="o.value">{{ o.text }}</wa-radio>
      </wa-radio-group>`,
  }),
};
