// wa-button in Vue, loaded from the CDN. The pieces live side by side:
//   Button.data.json  the example content
//   Button.mdx        the docs page
// The templates use <wa-button> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Button.data.json';

const ATTRS = ['variant', 'appearance', 'size', 'pill', 'with-caret', 'disabled', 'loading'];

type IconButton = { text?: string; variant?: string; appearance?: string; start?: string; end?: string; icon?: string; iconLabel?: string };

/** Actions panel: clicks, plus every event wa-button fires (from Web Awesome's manifest). */
const buttonEvents = () => ({
  click: (e: Event) => action('click')((e.currentTarget as HTMLElement).textContent?.trim() || (e.currentTarget as HTMLElement).querySelector('wa-icon')?.getAttribute('label')),
  ...Object.fromEntries(waEventNames('wa-button').map((name) => [name, (e: Event) => e.target === e.currentTarget && action(name)(e)])),
});

const meta = {
  title: 'Atoms/Button',
  // No `component`: wa-button is a custom element, not a Vue component.
  // No 'autodocs': Button.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // button's label, which is its content rather than an attribute.
  argTypes: {
    ...waArgTypes('wa-button', ATTRS),
    text: { control: 'text', description: "The button's label (its content).", table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-button', ATTRS), variant: 'brand', text: data.text },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ args, attrs: computed(() => waAttrs(args, ATTRS)), events: buttonEvents() }),
    template: `<wa-button v-bind="attrs" v-on="events">{{ args.text }}</wa-button>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-button> markup, following the
// controls. Without it, Storybook would invent a Vue component name from the
// title (<Button .../>).
const source = (code: (args: Args) => string) => ({ docs: { source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => code(args) } } });
const row = 'display: flex; flex-wrap: wrap; gap: var(--wa-space-s); align-items: center';

// The fixed-example stories apply the controls to every button; the controls
// an example sets itself (its variant, its label...) are hidden.

export const Playground: Story = {
  parameters: source((args) => waSource('wa-button', args, ATTRS, String(args.text ?? ''))),
};

/** One row per appearance, one button per variant, each labelled with its variant. */
const variantRows = (args: Args) =>
  data.appearances.map((appearance) => withControls(args, data.variants.map((variant) => ({ variant, appearance, text: variant }))));

export const Variants: Story = {
  argTypes: hideControls('variant', 'appearance', 'text'),
  parameters: source((args) =>
    variantRows(args)
      // Written out in full: waSource would drop Web Awesome's defaults.
      .map((buttons) =>
        buttons
          .map((b) => waSource('wa-button', b, ATTRS.filter((name) => name !== 'variant' && name !== 'appearance'), b.text).replace('<wa-button', `<wa-button variant="${b.variant}" appearance="${b.appearance}"`))
          .join('\n'),
      )
      .join('\n\n'),
  ),
  render: (args) => ({
    setup: () => ({
      rows: computed(() => variantRows(args).map((buttons) => buttons.map((b) => ({ text: b.text, attrs: waAttrs(b, ATTRS) })))),
      row,
      events: buttonEvents(),
    }),
    template: `
      <div style="display: grid; gap: var(--wa-space-m)">
        <div v-for="(buttons, r) in rows" :key="r" :style="row">
          <wa-button v-for="b in buttons" :key="b.text" v-bind="b.attrs" v-on="events">{{ b.text }}</wa-button>
        </div>
      </div>`,
  }),
};

const sizeButtons = (args: Args) => withControls(args, data.sizes.map((size) => ({ size, text: size })));

export const Sizes: Story = {
  argTypes: hideControls('size', 'text'),
  parameters: source((args) =>
    sizeButtons(args)
      // size is written out in full: waSource would drop size="m", Web Awesome's default.
      .map((b) => waSource('wa-button', b, ATTRS.filter((name) => name !== 'size'), b.text).replace('<wa-button', `<wa-button size="${b.size}"`))
      .join('\n'),
  ),
  render: (args) => ({
    setup: () => ({ buttons: computed(() => sizeButtons(args).map((b) => ({ text: b.text, attrs: waAttrs(b, ATTRS) }))), row, events: buttonEvents() }),
    template: `
      <div :style="row">
        <wa-button v-for="b in buttons" :key="b.text" v-bind="b.attrs" v-on="events">{{ b.text }}</wa-button>
      </div>`,
  }),
};

// Each state sets its own variant, so "With caret" is written as neutral.
const stateButtons = (args: Args) => withControls(args, data.states.map((s) => ({ variant: 'neutral', disabled: false, loading: false, 'with-caret': false, pill: false, ...s })));

export const States: Story = {
  argTypes: hideControls('variant', 'disabled', 'loading', 'with-caret', 'pill', 'text'),
  parameters: source((args) => stateButtons(args).map((b) => waSource('wa-button', b, ATTRS, b.text)).join('\n')),
  render: (args) => ({
    setup: () => ({ buttons: computed(() => stateButtons(args).map((b) => ({ text: b.text, attrs: waAttrs(b, ATTRS) }))), row, events: buttonEvents() }),
    template: `
      <div :style="row">
        <wa-button v-for="b in buttons" :key="b.text" v-bind="b.attrs" v-on="events">{{ b.text }}</wa-button>
      </div>`,
  }),
};

// Each button sets its own variant and appearance; the ones that don't use Web Awesome's defaults.
const iconButtons = (args: Args) =>
  withControls(args, (data.withIcons as IconButton[]).map((b) => ({ variant: 'neutral', appearance: 'accent', ...b, text: b.text ?? '' })));

/** The icons inside a button, for the "Show code" panel. */
const iconsSource = (b: IconButton) =>
  [
    b.start ? `<wa-icon slot="start" name="${b.start}"></wa-icon>` : '',
    b.icon ? `<wa-icon name="${b.icon}" label="${b.iconLabel}"></wa-icon>` : '',
    b.text ?? '',
    b.end ? `<wa-icon slot="end" name="${b.end}"></wa-icon>` : '',
  ].join('');

export const WithIcons: Story = {
  name: 'With icons',
  argTypes: hideControls('variant', 'appearance', 'text'),
  parameters: source((args) => iconButtons(args).map((b) => waSource('wa-button', b, ATTRS, iconsSource(b))).join('\n')),
  render: (args) => ({
    setup: () => ({ buttons: computed(() => iconButtons(args).map((b) => ({ ...b, attrs: waAttrs(b, ATTRS) }))), row, events: buttonEvents() }),
    template: `
      <div :style="row">
        <wa-button v-for="b in buttons" :key="b.text || b.icon" v-bind="b.attrs" v-on="events">
          <wa-icon v-if="b.start" slot="start" :name="b.start"></wa-icon>
          <wa-icon v-if="b.icon" :name="b.icon" :label="b.iconLabel"></wa-icon>
          {{ b.text }}
          <wa-icon v-if="b.end" slot="end" :name="b.end"></wa-icon>
        </wa-button>
      </div>`,
  }),
};
