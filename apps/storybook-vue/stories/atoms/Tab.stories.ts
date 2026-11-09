// wa-tab-group, wa-tab and wa-tab-panel in Vue, loaded from the CDN. The pieces live side by side:
//   Tab.data.json  the example content
//   Tab.mdx        the docs page
// The templates use <wa-tab-group>, <wa-tab> and <wa-tab-panel> directly,
// exactly as a CDN page would. Nothing here imports Web Awesome or Soar: the
// CDN <script> tags in .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed, onMounted, ref } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Tab.data.json';

// Tabs always sit inside a group, which owns which tab is active and where the
// tabs go, so the controls configure <wa-tab-group>.
const ATTRS = ['active', 'placement', 'activation', 'without-scroll-controls'];

/** The tabs and panels inside the group, for the "Show code" panel. */
const tabsSource = [
  ...data.tabs.map((t) => `<wa-tab panel="${t.panel}"${t.disabled ? ' disabled' : ''}>${t.text}</wa-tab>`),
  '',
  ...data.tabs.map((t) => `<wa-tab-panel name="${t.panel}">${t.content}</wa-tab-panel>`),
].join('\n');

type TabGroup = HTMLElement & { active: string; updateComplete: Promise<unknown> };

/**
 * Re-applies `active` once the group is on the page. When <wa-tab-group> is
 * created after the CDN script has already defined it (every example after the
 * first on a docs page), it reads `active` before its tabs and panels are in
 * place and shows no panel. Setting it again afterwards fixes that.
 */
async function reapplyActive(group: TabGroup) {
  await customElements.whenDefined('wa-tab-group');
  await group.updateComplete;
  const active = group.active;
  group.active = '';
  await group.updateComplete;
  group.active = active;
}

/** Actions panel: the group's events (from Web Awesome's manifest), with the panel's name. */
const groupEvents = () =>
  Object.fromEntries(
    waEventNames('wa-tab-group').map((name) => [name, (e: Event) => action(name)({ name: (e as CustomEvent<{ name: string }>).detail?.name })]),
  );

const meta = {
  title: 'Atoms/Tab',
  // No `component`: these are custom elements, not Vue components.
  // No 'autodocs': Tab.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-tab-group', ATTRS),
  args: { ...controlArgs('wa-tab-group', ATTRS), active: data.active },
  parameters: {
    // "Show code" shows the real markup for the current controls. Without it,
    // Storybook would invent a Vue component name from the title (<Tab .../>).
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-tab-group', args, ATTRS, tabsSource),
      },
    },
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup() {
      const group = ref<TabGroup>();
      onMounted(() => group.value && reapplyActive(group.value));
      return { group, attrs: computed(() => waAttrs(args, ATTRS)), tabs: data.tabs, events: groupEvents() };
    },
    template: `
      <wa-tab-group ref="group" v-bind="attrs" v-on="events">
        <wa-tab v-for="t in tabs" :key="t.panel" :panel="t.panel" :disabled="t.disabled || undefined">{{ t.text }}</wa-tab>
        <wa-tab-panel v-for="t in tabs" :key="t.panel + '-panel'" :name="t.panel">{{ t.content }}</wa-tab-panel>
      </wa-tab-group>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Start: Story = { name: 'Placement: start', args: { placement: 'start' } };

export const Bottom: Story = { name: 'Placement: bottom', args: { placement: 'bottom' } };
