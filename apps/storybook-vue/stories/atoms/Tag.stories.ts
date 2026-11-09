// wa-tag in Vue, loaded from the CDN. The pieces live side by side:
//   Tag.data.json  the example content
//   Tag.mdx        the docs page
// The templates use <wa-tag> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed, ref } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Tag.data.json';

const ATTRS = ['variant', 'appearance', 'size', 'pill', 'with-remove'];

/** Actions panel: the tag's events (from Web Awesome's manifest), with its text. */
const tagEvents = () =>
  Object.fromEntries(waEventNames('wa-tag').map((name) => [name, (e: Event) => action(name)((e.currentTarget as HTMLElement).textContent?.trim())]));

const row = 'display: flex; flex-wrap: wrap; gap: var(--wa-space-xs); align-items: center';

const meta = {
  title: 'Atoms/Tag',
  // No `component`: wa-tag is a custom element, not a Vue component.
  // No 'autodocs': Tag.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // tag's content, which isn't an attribute.
  argTypes: {
    ...waArgTypes('wa-tag', ATTRS),
    text: { control: 'text', description: "The tag's content.", table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-tag', ATTRS), text: data.text },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ args, attrs: computed(() => waAttrs(args, ATTRS)), events: tagEvents() }),
    template: `<wa-tag v-bind="attrs" v-on="events">{{ args.text }}</wa-tag>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-tag> markup, following the
// controls. Without it, Storybook would invent a Vue component name from the
// title (<Tag .../>).
const source = (code: (args: Args) => string) => ({ docs: { source: { language: 'html', transform: (_code: string, { args }: { args: Args }) => code(args) } } });

export const Playground: Story = {
  parameters: source((args) => waSource('wa-tag', args, ATTRS, String(args.text ?? ''))),
};

// The fixed-example stories apply the controls to every tag; the controls an
// example sets itself (its variant, its text...) are hidden.

/** A tag with the named attributes written out in full (waSource would drop Web Awesome's defaults). */
const fullSource = (tag: Args, written: string[]) =>
  waSource('wa-tag', tag, ATTRS.filter((name) => !written.includes(name)), String(tag.text)).replace(
    '<wa-tag',
    `<wa-tag ${written.map((name) => `${name}="${String(tag[name])}"`).join(' ')}`,
  );

const variantRows = (args: Args) =>
  data.appearances.map((appearance) => withControls(args, data.variants.map((variant) => ({ variant, appearance, text: variant }))));

export const Variants: Story = {
  argTypes: hideControls('variant', 'appearance', 'text'),
  parameters: source((args) => variantRows(args).map((tags) => tags.map((t) => fullSource(t, ['variant', 'appearance'])).join('\n')).join('\n\n')),
  render: (args) => ({
    setup: () => ({ rows: computed(() => variantRows(args).map((tags) => tags.map((t) => ({ text: t.text, attrs: waAttrs(t, ATTRS) })))), row, events: tagEvents() }),
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <div v-for="(tags, r) in rows" :key="r" :style="row">
          <wa-tag v-for="t in tags" :key="t.text" v-bind="t.attrs" v-on="events">{{ t.text }}</wa-tag>
        </div>
      </div>`,
  }),
};

const sizeTags = (args: Args) => withControls(args, data.sizes.map((size) => ({ size, text: size })));

export const Sizes: Story = {
  argTypes: hideControls('size', 'text'),
  parameters: source((args) => sizeTags(args).map((t) => fullSource(t, ['size'])).join('\n')),
  render: (args) => ({
    setup: () => ({ tags: computed(() => sizeTags(args).map((t) => ({ text: t.text, attrs: waAttrs(t, ATTRS) }))), row, events: tagEvents() }),
    template: `<div :style="row"><wa-tag v-for="t in tags" :key="t.text" v-bind="t.attrs" v-on="events">{{ t.text }}</wa-tag></div>`,
  }),
};

export const Removable: Story = {
  // with-remove stays on: removing tags is what this story shows.
  argTypes: hideControls('with-remove', 'text'),
  args: { 'with-remove': true, pill: true },
  parameters: source((args) => data.removable.map((text) => waSource('wa-tag', args, ATTRS, text)).join('\n')),
  render: (args) => ({
    setup() {
      // `with-remove` only shows the button and fires wa-remove; removing the
      // tag is up to the app. Here it's dropped from the list.
      const tags = ref([...data.removable]);
      const remove = (tag: string) => {
        action('wa-remove')(tag);
        tags.value = tags.value.filter((t) => t !== tag);
      };
      return { tags, remove, row, attrs: computed(() => waAttrs(args, ATTRS)) };
    },
    template: `
      <div :style="row">
        <wa-tag v-for="tag in tags" :key="tag" v-bind="attrs" @wa-remove="remove(tag)">{{ tag }}</wa-tag>
      </div>`,
  }),
};
