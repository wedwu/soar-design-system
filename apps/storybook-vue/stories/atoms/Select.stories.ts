// wa-select and wa-option in Vue, loaded from the CDN. The pieces live side by side:
//   Select.data.json  the example content
//   Select.mdx        the docs page
// The templates use <wa-select> and <wa-option> directly, exactly as a CDN page
// would. Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Select.data.json';

const ATTRS = ['label', 'hint', 'placeholder', 'size', 'appearance', 'placement', 'multiple', 'with-clear', 'disabled', 'required', 'pill'];

type Option = { value: string; text: string; selected?: boolean; disabled?: boolean };

/** The options inside the select, for the "Show code" panel. */
const optionsSource = (options: Option[]) =>
  options.map((o) => `<wa-option value="${o.value}"${o.selected ? ' selected' : ''}${o.disabled ? ' disabled' : ''}>${o.text}</wa-option>`).join('\n');

/**
 * Actions panel: every event wa-select fires (from Web Awesome's manifest), with
 * its value (an array when `multiple` is on). Open and close events are logged
 * only for the select itself, not for elements inside it.
 */
const selectEvents = () =>
  Object.fromEntries(
    waEventNames('wa-select').map((name) => [
      name,
      (e: Event) => {
        if (/^wa-(after-)?(show|hide)$/.test(name) && e.target !== e.currentTarget) return;
        action(name)({ value: (e.currentTarget as HTMLSelectElement & { value: string | string[] }).value });
      },
    ]),
  );

// The options: shared by every story's template.
const optionsTemplate = `
  <wa-option
    v-for="o in options"
    :key="o.value"
    :value="o.value"
    :selected="o.selected || undefined"
    :disabled="o.disabled || undefined"
  >{{ o.text }}</wa-option>`;

// min-height leaves room for the open listbox inside the story.
const box = 'min-height: 16rem; max-width: 24rem';

const meta = {
  title: 'Atoms/Select',
  // No `component`: these are custom elements, not Vue components.
  // No 'autodocs': Select.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-select', ATTRS),
  args: { ...controlArgs('wa-select', ATTRS), label: data.label, hint: data.hint },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), options: data.options, box, events: selectEvents() }),
    template: `<div :style="box"><wa-select v-bind="attrs" v-on="events">${optionsTemplate}</wa-select></div>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real markup. Without it, Storybook would
// invent a Vue component name from the title (<Select .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-select', args, ATTRS, optionsSource(data.options)),
      },
    },
  },
};

// Every control applies to these stories too; each starts with its own settings.
const followsControls = (options: Option[]) => ({
  docs: {
    source: { language: 'html', transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-select', args, ATTRS, optionsSource(options)) },
  },
});
const renderWith = (options: Option[]) => (args: Record<string, unknown>) => ({
  setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), options, box, events: selectEvents() }),
  template: `<div :style="box"><wa-select v-bind="attrs" v-on="events">${optionsTemplate}</wa-select></div>`,
});

export const Multiple: Story = {
  args: { label: data.multiple.label, hint: '', multiple: true, 'with-clear': true },
  parameters: followsControls(data.multiple.options),
  render: renderWith(data.multiple.options),
};

export const Placeholder: Story = {
  args: { label: data.placeholder.label, hint: '', placeholder: data.placeholder.placeholder },
  parameters: followsControls(data.placeholder.options),
  render: renderWith(data.placeholder.options),
};
