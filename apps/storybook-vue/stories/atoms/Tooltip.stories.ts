// wa-tooltip in Vue, loaded from the CDN. The pieces live side by side:
//   Tooltip.data.json  the example content
//   Tooltip.mdx        the docs page
// The templates use <wa-tooltip> directly, exactly as a CDN page would.
// Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { type Args, controlArgs, hideControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Tooltip.data.json';

const ATTRS = ['placement', 'trigger', 'distance', 'without-arrow', 'disabled', 'open'];

// A tooltip finds its target by id (`for`), and every story on the docs page
// shares one document, so each render gets its own id.
let n = 0;
const uid = (prefix: string) => `${prefix}-${++n}`;

/** Actions panel: every event wa-tooltip fires (from Web Awesome's manifest). */
const tooltipEvents = () =>
  Object.fromEntries(waEventNames('wa-tooltip').map((name) => [name, (e: Event) => e.target === e.currentTarget && action(name)(e)]));

/** The target button and its tooltip, for the "Show code" panel. */
const targetSource = (tooltipAttrs: Record<string, unknown>, text: string) =>
  [
    `<wa-button id="copy-link" appearance="outlined"><wa-icon name="${data.target.icon}" label="${data.target.label}"></wa-icon></wa-button>`,
    waSource('wa-tooltip', { ...tooltipAttrs, for: 'copy-link' }, ['for', ...ATTRS], text),
  ].join('\n');

const meta = {
  title: 'Atoms/Tooltip',
  // No `component`: wa-tooltip is a custom element, not a Vue component.
  // No 'autodocs': Tooltip.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // tooltip's content, which isn't an attribute.
  argTypes: {
    ...waArgTypes('wa-tooltip', ATTRS),
    text: { control: 'text', description: "The tooltip's content.", table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-tooltip', ATTRS), text: data.text },
  parameters: {
    // "Show code" shows the real markup for the current controls. Without it,
    // Storybook would invent a Vue component name from the title (<Tooltip .../>).
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => targetSource(args, String(args.text ?? '')),
      },
    },
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ args, attrs: computed(() => waAttrs(args, ATTRS)), id: uid('tooltip-target'), target: data.target, events: tooltipEvents() }),
    template: `
      <div style="padding: var(--wa-space-3xl); display: grid; place-items: center">
        <wa-button :id="id" appearance="outlined"><wa-icon :name="target.icon" :label="target.label"></wa-icon></wa-button>
        <wa-tooltip :for="id" v-bind="attrs" v-on="events">{{ args.text }}</wa-tooltip>
      </div>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Open: Story = { args: { open: true } };

export const ClickTrigger: Story = { name: 'Click trigger', args: { trigger: 'click', text: data.clickText } };

// One tooltip per placement, with the other controls applied to each.
const placementTips = (args: Args): Args[] => data.placements.map((placement) => ({ ...args, placement }));

export const Placements: Story = {
  argTypes: hideControls('placement', 'text'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) =>
          placementTips(args)
            .map((t) => {
              const id = `placement-${String(t.placement)}`;
              return `<wa-button id="${id}">${String(t.placement)}</wa-button>\n${waSource('wa-tooltip', { ...t, for: id }, ['for', ...ATTRS], `placement="${String(t.placement)}"`)}`;
            })
            .join('\n'),
      },
    },
  },
  render: (args) => ({
    setup() {
      const ids = data.placements.map(() => uid('tooltip-placement'));
      const items = computed(() => placementTips(args).map((t, i) => ({ placement: t.placement, id: ids[i], attrs: waAttrs(t, ATTRS) })));
      return { items, events: tooltipEvents() };
    },
    template: `
      <div style="padding: var(--wa-space-3xl); display: flex; gap: var(--wa-space-s); justify-content: center">
        <template v-for="item in items" :key="item.id">
          <wa-button :id="item.id">{{ item.placement }}</wa-button>
          <wa-tooltip :for="item.id" v-bind="item.attrs" v-on="events">placement="{{ item.placement }}"</wa-tooltip>
        </template>
      </div>`,
  }),
};
