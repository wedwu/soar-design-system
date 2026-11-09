// wa-tree and wa-tree-item in Vue, loaded from the CDN. The pieces live side by side:
//   Tree.data.json  the example content
//   Tree.mdx        the docs page
// The templates use <wa-tree> and <wa-tree-item> directly, exactly as a CDN page
// would. Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed, defineComponent, onMounted, ref, type PropType } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Tree.data.json';

const ATTRS = ['selection'];

type Item = { text: string; icon?: string; expanded?: boolean; selected?: boolean; disabled?: boolean; children?: Item[] };

/**
 * <wa-tree-item> elements for a nested list, rendering itself for children.
 * A local Vue helper only: each item is still a plain <wa-tree-item>.
 */
const TreeItems = defineComponent({
  name: 'TreeItems',
  props: { items: { type: Array as PropType<Item[]>, required: true } },
  template: `
    <wa-tree-item
      v-for="item in items"
      :key="item.text"
      :expanded="item.expanded || undefined"
      :data-expanded="item.expanded || undefined"
      :selected="item.selected || undefined"
      :disabled="item.disabled || undefined"
    >
      <wa-icon v-if="item.icon" :name="item.icon"></wa-icon>
      {{ item.text }}
      <TreeItems v-if="item.children" :items="item.children" />
    </wa-tree-item>`,
});

/**
 * Re-applies `expanded` to nested items once the tree has started up. Web
 * Awesome 3.14.0 drops `expanded` from every item below the top level at
 * startup (plain HTML too), so "Projects" would start collapsed. The template
 * marks the items that should start open with data-expanded.
 */
async function reapplyExpanded(tree: HTMLElement) {
  await customElements.whenDefined('wa-tree-item');
  const items = [...tree.querySelectorAll<HTMLElement & { expanded: boolean; updateComplete: Promise<unknown> }>('wa-tree-item[data-expanded]')];
  await Promise.all(items.map((item) => item.updateComplete));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  for (const item of items) item.expanded = true;
}

/** Shared setup for every story's tree: re-applies `expanded` after mounting. */
function useTree() {
  const tree = ref<HTMLElement>();
  onMounted(() => tree.value && reapplyExpanded(tree.value));
  return tree;
}

/** The same items as markup, for the "Show code" panel. */
function itemsSource(items: Item[], depth = 0): string {
  const pad = '  '.repeat(depth);
  return items
    .map((item) => {
      const attrs = `${item.expanded ? ' expanded' : ''}${item.selected ? ' selected' : ''}${item.disabled ? ' disabled' : ''}`;
      const label = `${item.icon ? `<wa-icon name="${item.icon}"></wa-icon> ` : ''}${item.text}`;
      if (!item.children) return `${pad}<wa-tree-item${attrs}>${label}</wa-tree-item>`;
      return `${pad}<wa-tree-item${attrs}>\n${pad}  ${label}\n${itemsSource(item.children, depth + 1)}\n${pad}</wa-tree-item>`;
    })
    .join('\n');
}

/** An item's own label: its text, not its children's. */
const ownLabel = (item: Element) =>
  [...item.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent?.trim())
    .join('');

/** Actions panel: the tree's events (from Web Awesome's manifest), with the selected items. */
const treeEvents = () =>
  Object.fromEntries(
    waEventNames('wa-tree').map((name) => [
      name,
      (e: Event) => action(name)({ selection: (e as CustomEvent<{ selection: Element[] }>).detail?.selection?.map(ownLabel) }),
    ]),
  );

const meta = {
  title: 'Atoms/Tree',
  // No `component`: these are custom elements, not Vue components.
  // No 'autodocs': Tree.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-tree', ATTRS),
  args: controlArgs('wa-tree', ATTRS),
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    components: { TreeItems },
    setup: () => ({ tree: useTree(), attrs: computed(() => waAttrs(args, ATTRS)), items: data.items as Item[], events: treeEvents() }),
    template: `<wa-tree ref="tree" v-bind="attrs" v-on="events" style="max-width: 20rem"><TreeItems :items="items" /></wa-tree>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// "Show code" shows the real markup for the current controls. Without it,
// Storybook would invent a Vue component name from the title (<Tree .../>).
const followsControls = {
  docs: {
    source: {
      language: 'html',
      transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-tree', args, ATTRS, itemsSource(data.items as Item[])),
    },
  },
};

export const Playground: Story = { parameters: followsControls };

export const Multiple: Story = {
  name: 'Multiple selection',
  args: { selection: 'multiple' },
  parameters: followsControls,
};

export const WithIcons: Story = {
  name: 'With icons',
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
          waSource('wa-tree', args, ATTRS, itemsSource(data.withIcons as Item[])).replace('<wa-tree', '<wa-tree style="--indent-guide-width: var(--wa-border-width-s)"'),
      },
    },
  },
  render: (args) => ({
    components: { TreeItems },
    setup: () => ({ tree: useTree(), attrs: computed(() => waAttrs(args, ATTRS)), items: data.withIcons as Item[], events: treeEvents() }),
    template: `
      <wa-tree ref="tree" v-bind="attrs" v-on="events" style="max-width: 20rem; --indent-guide-width: var(--wa-border-width-s)">
        <TreeItems :items="items" />
      </wa-tree>`,
  }),
};
