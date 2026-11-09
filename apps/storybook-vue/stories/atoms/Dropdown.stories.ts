// wa-dropdown and wa-dropdown-item in Vue, loaded from the CDN. The pieces live side by side:
//   Dropdown.data.json  the example content
//   Dropdown.mdx        the docs page
// The templates use <wa-dropdown> and <wa-dropdown-item> directly, exactly as a
// CDN page would. Nothing here imports Web Awesome or Soar: the CDN <script>
// tags in .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed, ref } from 'vue';
import { type Args, controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Dropdown.data.json';

const ATTRS = ['placement', 'size', 'distance', 'skidding'];

type Item = { value?: string; text?: string; icon?: string; details?: string; disabled?: boolean; variant?: string; checked?: boolean; divider?: boolean };

/**
 * Actions panel: every event wa-dropdown fires (from Web Awesome's manifest).
 * wa-select is logged with the chosen item's value, which is what an app reads;
 * the others only for the dropdown itself, not for elements inside it.
 */
const dropdownEvents = () =>
  Object.fromEntries(
    waEventNames('wa-dropdown').map((name) => [
      name,
      (e: Event) => {
        if (name === 'wa-select') action(name)({ value: (e as CustomEvent<{ item: { value: string } }>).detail.item.value });
        else if (e.target === e.currentTarget) action(name)(e);
      },
    ]),
  );

/** One item (or divider), for the "Show code" panel. */
function itemSource(item: Item, extra = '') {
  if (item.divider) return '<wa-divider></wa-divider>';
  const attrs = [
    extra,
    item.variant ? ` variant="${item.variant}"` : '',
    ` value="${item.value}"`,
    item.checked ? ' checked' : '',
    item.disabled ? ' disabled' : '',
  ].join('');
  const icon = item.icon ? `<wa-icon slot="icon" name="${item.icon}"></wa-icon>` : '';
  const details = item.details ? `<span slot="details">${item.details}</span>` : '';
  return `<wa-dropdown-item${attrs}>${icon}${item.text}${details}</wa-dropdown-item>`;
}

const triggerSource = (text: string) => `<wa-button slot="trigger" appearance="filled" with-caret>${text}</wa-button>`;

const meta = {
  title: 'Atoms/Dropdown',
  // No `component`: these are custom elements, not Vue components.
  // No 'autodocs': Dropdown.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-dropdown', ATTRS),
  args: controlArgs('wa-dropdown', ATTRS),
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), trigger: data.trigger, items: data.items as Item[], events: dropdownEvents() }),
    // min-height leaves room for the open menu inside the story.
    template: `
      <div style="min-height: 16rem">
        <wa-dropdown v-bind="attrs" v-on="events">
          <wa-button slot="trigger" appearance="filled" with-caret>{{ trigger }}</wa-button>
          <template v-for="(item, i) in items" :key="item.value ?? 'divider-' + i">
            <wa-divider v-if="item.divider"></wa-divider>
            <wa-dropdown-item v-else :value="item.value" :variant="item.variant" :disabled="item.disabled || undefined">
              <wa-icon v-if="item.icon" slot="icon" :name="item.icon"></wa-icon>
              {{ item.text }}
              <span v-if="item.details" slot="details">{{ item.details }}</span>
            </wa-dropdown-item>
          </template>
        </wa-dropdown>
      </div>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real markup. Without it, Storybook would
// invent a Vue component name from the title (<Dropdown .../>).

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) =>
          waSource('wa-dropdown', args, ATTRS, [triggerSource(data.trigger), ...(data.items as Item[]).map((item) => itemSource(item))].join('\n')),
      },
    },
  },
};

export const CheckableItems: Story = {
  name: 'Checkable items',
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) =>
          waSource('wa-dropdown', args, ATTRS, [triggerSource(data.checkable.trigger), ...data.checkable.items.map((item) => itemSource(item, ' type="checkbox"'))].join('\n')),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), group: data.checkable, events: dropdownEvents() }),
    template: `
      <div style="min-height: 12rem">
        <wa-dropdown v-bind="attrs" v-on="events">
          <wa-button slot="trigger" appearance="filled" with-caret>{{ group.trigger }}</wa-button>
          <wa-dropdown-item
            v-for="item in group.items"
            :key="item.value"
            type="checkbox"
            :value="item.value"
            :checked="item.checked || undefined"
          >{{ item.text }}</wa-dropdown-item>
        </wa-dropdown>
      </div>`,
  }),
};

export const Submenu: Story = {
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) => waSource(
          'wa-dropdown',
          args,
          ATTRS,
          [
            triggerSource(data.submenu.trigger),
            '<wa-dropdown-item>',
            `  ${data.submenu.parent}`,
            ...data.submenu.children.map((child) => `  ${itemSource(child, ' slot="submenu"')}`),
            '</wa-dropdown-item>',
            itemSource(data.submenu.after),
          ].join('\n'),
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), menu: data.submenu, events: dropdownEvents() }),
    template: `
      <div style="min-height: 14rem">
        <wa-dropdown v-bind="attrs" v-on="events">
          <wa-button slot="trigger" appearance="filled" with-caret>{{ menu.trigger }}</wa-button>
          <wa-dropdown-item>
            {{ menu.parent }}
            <wa-dropdown-item v-for="child in menu.children" :key="child.value" slot="submenu" :value="child.value">{{ child.text }}</wa-dropdown-item>
          </wa-dropdown-item>
          <wa-dropdown-item :value="menu.after.value">{{ menu.after.text }}</wa-dropdown-item>
        </wa-dropdown>
      </div>`,
  }),
};

// ---------------------------------------------------------------------------
// Dropdown limitations: what not to put inside <wa-dropdown>, next to the fix.
//
// <wa-dropdown> only manages its own <wa-dropdown-item> (and <wa-divider>)
// children. Each "Don't" story builds one common mistake; each "Do" story
// builds the fix. A live line under every menu reports what actually happened,
// so the difference is visible rather than just described.
// ---------------------------------------------------------------------------

const limits = data.limitations;
type LinkItem = { value: string; text: string; href: string };
type MenuItem = { value: string; text: string; variant?: string };

/**
 * Wires a demo dropdown to its live report: where focus goes when the menu
 * opens, whether a click fires wa-select, and whether the menu closes.
 */
function useReport() {
  const dropdown = ref<HTMLElement & { open: boolean }>();
  const report = ref('Open the menu, then click an item or press the arrow keys.');
  let selected: string | null = null;
  let closed = false;

  // Opening: did focus move into the menu? Arrow keys only work from there.
  const onShown = (e: Event) => {
    if (e.target !== e.currentTarget) return;
    closed = false;
    const active = document.activeElement;
    const inMenu = !!active && dropdown.value?.contains(active) && active.getAttribute('slot') !== 'trigger';
    report.value = inMenu
      ? 'Opened · focus moved to the first item, so arrow keys work'
      : "Opened · focus didn't move into the menu, so arrow keys can't reach the items";
  };
  const onHide = (e: Event) => e.target === e.currentTarget && (closed = true);
  const onSelect = (e: CustomEvent<{ item: { value: string } }>) => {
    selected = e.detail.item.value;
    action('wa-select')({ value: selected });
  };
  // A click on anything but the trigger: report once the menu has reacted.
  const onMenuClick = (e: Event) => {
    if ((e.target as Element).closest('[slot="trigger"]')) {
      selected = null;
      return;
    }
    setTimeout(() => {
      const fired = selected ? `wa-select fired ("${selected}")` : 'no wa-select, so your code never hears about it';
      report.value = `Clicked · ${fired} · menu ${closed ? 'closed' : 'still open'}`;
      selected = null;
    }, 400);
  };
  return { dropdown, report, onShown, onHide, onSelect, onMenuClick };
}

// The menu, its report line, and room for the menu to open inside the story.
const demo = (inside: string, trigger: string) => `
  <div style="min-height: 12rem; display: grid; gap: var(--wa-space-m); align-content: start">
    <wa-dropdown
      ref="dropdown"
      v-bind="attrs"
      @wa-after-show="onShown"
      @wa-hide="onHide"
      @wa-select="onSelect"
      @click="onMenuClick"
    >
      <wa-button slot="trigger" appearance="filled" with-caret>${trigger}</wa-button>
      ${inside}
    </wa-dropdown>
    <output aria-live="polite" style="font-family: var(--wa-font-family-code); font-size: var(--wa-font-size-s); color: var(--wa-color-text-quiet)">{{ report }}</output>
  </div>`;

/** "Show code" for a Don't story: the markup, flagged so nobody copies it. */
const dontSource = (args: Args, why: string, inside: string[], trigger: string) =>
  `<!-- Don't: ${why} -->\n${waSource('wa-dropdown', args, ATTRS, [triggerSource(trigger), ...inside].join('\n'))}`;

// The Accessibility panel flags the Don't stories (that's the point of them);
// 'todo' reports their violations without failing, once @storybook/addon-a11y
// is added to this Storybook. The Do stories stay fully checked.
const expectedViolations = { a11y: { test: 'todo' } };

export const DontPlainLinks: Story = {
  name: "Don't: plain links",
  parameters: {
    ...expectedViolations,
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) =>
          dontSource(
          args,
          'plain links are not menu items',
          limits.links.items.map((i) => `<a href="${i.href}">${i.text}</a>`),
          limits.links.dontTrigger,
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ ...useReport(), attrs: computed(() => waAttrs(args, ATTRS)), items: limits.links.items as LinkItem[] }),
    template: demo(`<a v-for="i in items" :key="i.value" :href="i.href">{{ i.text }}</a>`, limits.links.dontTrigger),
  }),
};

export const DoLinkItems: Story = {
  name: 'Do: link items',
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) => waSource(
          'wa-dropdown',
          args,
          ATTRS,
          [triggerSource(limits.links.doTrigger), ...limits.links.items.map((i) => `<wa-dropdown-item value="${i.value}" href="${i.href}">${i.text}</wa-dropdown-item>`)].join('\n'),
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ ...useReport(), attrs: computed(() => waAttrs(args, ATTRS)), items: limits.links.items as LinkItem[] }),
    template: demo(
      `<wa-dropdown-item v-for="i in items" :key="i.value" :value="i.value" :href="i.href">{{ i.text }}</wa-dropdown-item>`,
      limits.links.doTrigger,
    ),
  }),
};

export const DontList: Story = {
  name: "Don't: items in a list",
  parameters: {
    ...expectedViolations,
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) =>
          dontSource(
          args,
          'items inside a list are unreachable by keyboard and not announced as menu items',
          [
            '<ul>',
            ...limits.list.groups.flat().map((i) => `  <li>${itemSource(i)}</li>`),
            '</ul>',
          ],
          limits.list.dontTrigger,
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ ...useReport(), attrs: computed(() => waAttrs(args, ATTRS)), items: limits.list.groups.flat() as MenuItem[] }),
    template: demo(
      `<ul>
        <li v-for="i in items" :key="i.value">
          <wa-dropdown-item :value="i.value" :variant="i.variant">{{ i.text }}</wa-dropdown-item>
        </li>
      </ul>`,
      limits.list.dontTrigger,
    ),
  }),
};

export const DoItemsAndDivider: Story = {
  name: 'Do: items and a divider',
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) => waSource(
          'wa-dropdown',
          args,
          ATTRS,
          [
            triggerSource(limits.list.doTrigger),
            ...limits.list.groups.flatMap((group, g) => [...(g > 0 ? ['<wa-divider></wa-divider>'] : []), ...group.map((i) => itemSource(i))]),
          ].join('\n'),
        ),
      },
    },
  },
  render: (args) => ({
    setup: () => ({ ...useReport(), attrs: computed(() => waAttrs(args, ATTRS)), groups: limits.list.groups as MenuItem[][] }),
    template: demo(
      `<template v-for="(group, g) in groups" :key="g">
        <wa-divider v-if="g > 0"></wa-divider>
        <wa-dropdown-item v-for="i in group" :key="i.value" :value="i.value" :variant="i.variant">{{ i.text }}</wa-dropdown-item>
      </template>`,
      limits.list.doTrigger,
    ),
  }),
};
