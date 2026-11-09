// wa-input in Vue, loaded from the CDN. The pieces live side by side:
//   Input.data.json  the example content
//   Input.mdx        the docs page
// The templates use <wa-input> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Input.data.json';

const ATTRS = ['label', 'hint', 'placeholder', 'type', 'size', 'appearance', 'pill', 'with-clear', 'disabled', 'readonly', 'required'];
// The controls plus the attributes only the fixed examples use.
const EXAMPLE_ATTRS = [...ATTRS, 'value', 'password-toggle'];

/** Actions panel: every event wa-input fires (from Web Awesome's manifest), with its value. */
const inputEvents = () =>
  Object.fromEntries(
    waEventNames('wa-input').map((name) => [name, (e: Event) => action(name)({ value: (e.currentTarget as HTMLInputElement).value })]),
  );

const column = 'display: grid; gap: var(--wa-space-m); max-width: 24rem';

const meta = {
  title: 'Atoms/Input',
  // No `component`: wa-input is a custom element, not a Vue component.
  // No 'autodocs': Input.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-input', ATTRS),
  args: { ...controlArgs('wa-input', ATTRS), label: data.label, hint: data.hint, placeholder: data.placeholder },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), events: inputEvents() }),
    template: `<wa-input v-bind="attrs" v-on="events" style="max-width: 24rem"></wa-input>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-input> markup. Without it,
// Storybook would invent a Vue component name from the title (<Input .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-input', args, ATTRS),
      },
    },
  },
};

// The fixed-example stories apply the controls to every input; the controls an
// example sets itself (its label, its type...) are hidden. They start without
// the Playground's hint and placeholder, which belong to its one input.
const source = (inputs: (args: Args) => Args[], inner: (input: Args) => string = () => '') => ({
  docs: {
    source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => inputs(args).map((i) => waSource('wa-input', i, EXAMPLE_ATTRS, inner(i))).join('\n') },
  },
});
const examples = { hint: '', placeholder: '' };

const typeInputs = (args: Args) => withControls(args, data.types);

export const Types: Story = {
  argTypes: hideControls('type', 'label', 'placeholder', 'with-clear'),
  args: examples,
  parameters: source(typeInputs),
  render: (args) => ({
    setup: () => ({ inputs: computed(() => typeInputs(args).map((t) => waAttrs(t, EXAMPLE_ATTRS))), column, events: inputEvents() }),
    template: `
      <div :style="column">
        <wa-input v-for="attrs in inputs" :key="attrs.label" v-bind="attrs" v-on="events"></wa-input>
      </div>`,
  }),
};

type IconInput = { label: string; placeholder?: string; startIcon?: string; startText?: string };
const iconInputs = (args: Args) => withControls(args, (data.withIcons as IconInput[]).map((i) => ({ placeholder: '', ...i })));

export const WithIcons: Story = {
  name: 'With icons',
  argTypes: hideControls('label', 'placeholder'),
  args: examples,
  parameters: source(iconInputs, (i) => (i.startIcon ? `<wa-icon slot="start" name="${String(i.startIcon)}"></wa-icon>` : `<span slot="start">${String(i.startText)}</span>`)),
  render: (args) => ({
    setup: () => ({ inputs: computed(() => iconInputs(args).map((i) => ({ ...i, attrs: waAttrs(i, EXAMPLE_ATTRS) }))), column, events: inputEvents() }),
    template: `
      <div :style="column">
        <wa-input v-for="i in inputs" :key="i.label" v-bind="i.attrs" v-on="events">
          <wa-icon v-if="i.startIcon" slot="start" :name="i.startIcon"></wa-icon>
          <span v-if="i.startText" slot="start">{{ i.startText }}</span>
        </wa-input>
      </div>`,
  }),
};

const stateInputs = (args: Args) => withControls(args, data.states.map((s) => ({ required: false, disabled: false, readonly: false, ...s })));

export const States: Story = {
  argTypes: hideControls('label', 'required', 'disabled', 'readonly'),
  args: examples,
  parameters: source(stateInputs),
  render: (args) => ({
    setup: () => ({ inputs: computed(() => stateInputs(args).map((s) => waAttrs(s, EXAMPLE_ATTRS))), column, events: inputEvents() }),
    template: `
      <div :style="column">
        <wa-input v-for="attrs in inputs" :key="attrs.label" v-bind="attrs" v-on="events"></wa-input>
      </div>`,
  }),
};
