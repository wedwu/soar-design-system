// wa-switch in Vue, loaded from the CDN. The pieces live side by side:
//   Switch.data.json  the example content
//   Switch.mdx        the docs page
// The templates use <wa-switch> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Switch.data.json';

const ATTRS = ['checked', 'disabled', 'required', 'size', 'hint', 'name', 'value'];

/** Actions panel: the switch's events (from Web Awesome's manifest), with whether it's on. */
const switchEvents = () =>
  Object.fromEntries(
    waEventNames('wa-switch').map((name) => [name, (e: Event) => action(name)({ checked: (e.currentTarget as HTMLInputElement).checked })]),
  );

const column = 'display: grid; gap: var(--wa-space-s)';

const meta = {
  title: 'Atoms/Switch',
  // No `component`: wa-switch is a custom element, not a Vue component.
  // No 'autodocs': Switch.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // label, which is the switch's content rather than an attribute.
  argTypes: {
    ...waArgTypes('wa-switch', ATTRS),
    text: { control: 'text', description: "The label (the switch's content).", table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-switch', ATTRS), text: data.text },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => {
    // Flipping the switch updates the checked control too.
    const [, updateArgs] = useArgs();
    return {
      setup: () => ({
        args,
        attrs: computed(() => waAttrs(args, ATTRS)),
        events: switchEvents(),
        onChange: (e: Event) => updateArgs({ checked: (e.currentTarget as HTMLInputElement).checked }),
      }),
      template: `<wa-switch v-bind="attrs" v-on="events" @change="onChange">{{ args.text }}</wa-switch>`,
    };
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-switch> markup, following the
// controls. Without it, Storybook would invent a Vue component name from the
// title (<Switch .../>).
const source = (code: (args: Args) => string) => ({ docs: { source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => code(args) } } });
const one = (args: Args) => waSource('wa-switch', args, ATTRS, String(args.text ?? ''));

export const Playground: Story = { parameters: source(one) };

// The fixed-example stories apply the controls to every switch; the controls an
// example sets itself (on or off, its label...) are hidden.

const stateSwitches = (args: Args) => withControls(args, data.states);

export const States: Story = {
  argTypes: hideControls('checked', 'disabled', 'text'),
  parameters: source((args) => stateSwitches(args).map(one).join('\n')),
  render: (args) => ({
    setup: () => ({ states: computed(() => stateSwitches(args).map((s) => ({ text: s.text, attrs: waAttrs(s, ATTRS) }))), column, events: switchEvents() }),
    template: `
      <div :style="column">
        <wa-switch v-for="s in states" :key="s.text" v-bind="s.attrs" v-on="events">{{ s.text }}</wa-switch>
      </div>`,
  }),
};

// Uses the Playground render, so every control works; it just starts with a hint.
export const WithHint: Story = {
  name: 'With hint',
  args: { hint: data.hint },
  parameters: source(one),
};

const sizeSwitches = (args: Args) => withControls(args, data.sizes.map((size) => ({ size, text: size })));

export const Sizes: Story = {
  argTypes: hideControls('size', 'text'),
  args: { checked: true },
  parameters: source((args) =>
    sizeSwitches(args)
      // size is written out in full: waSource would drop size="m", Web Awesome's default.
      .map((s) => waSource('wa-switch', s, ATTRS.filter((name) => name !== 'size'), s.text).replace('<wa-switch', `<wa-switch size="${s.size}"`))
      .join('\n'),
  ),
  render: (args) => ({
    setup: () => ({ sizes: computed(() => sizeSwitches(args).map((s) => ({ text: s.text, attrs: waAttrs(s, ATTRS) }))), column, events: switchEvents() }),
    template: `
      <div :style="column">
        <wa-switch v-for="s in sizes" :key="s.text" v-bind="s.attrs" v-on="events">{{ s.text }}</wa-switch>
      </div>`,
  }),
};
