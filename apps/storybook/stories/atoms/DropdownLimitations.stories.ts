import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import { WA_VERSION } from '../../src/wa';

/**
 * Known constraints of <wa-dropdown>, each with a live demo. Every item here
 * is documented upstream in Web Awesome's own dropdown reference; this page
 * collects them so product teams see them before they design around them.
 */
const meta: Meta = {
  title: 'Atoms/Dropdown Limitations',
  tags: ['autodocs', 'upstream'],
  parameters: {
    docs: {
      description: {
        component: `Behaviors of \`<wa-dropdown>\` (Web Awesome ${WA_VERSION}) that commonly surprise teams. These are upstream behaviors, not Soar bugs, so design around them rather than patching the component. Source: [webawesome.com/docs/components/dropdown](https://webawesome.com/docs/components/dropdown).`,
      },
    },
  },
};
export default meta;

/** Renders a dropdown plus a live log of the events it fires. */
function withLog(dropdown: (log: (msg: string) => void) => unknown) {
  const out = document.createElement('output');
  out.style.cssText = 'display: block; font-family: var(--wa-font-family-code); font-size: var(--wa-font-size-s); color: var(--wa-color-text-quiet)';
  out.textContent = 'Events will appear here.';
  const log = (msg: string) => (out.textContent = msg);
  return html`<div style="display: grid; gap: var(--wa-space-m); min-height: 14rem; align-content: start">${dropdown(log)}${out}</div>`;
}

const desc = (story: string) => ({ docs: { description: { story } } });

export const SelectionClosesMenu: StoryObj = {
  name: 'Selecting an item closes the menu',
  parameters: desc(
    'Every selection closes the dropdown, **including checkbox items**, so toggling several options means reopening the menu each time. To keep it open, call `event.preventDefault()` in the `wa-select` handler. The second dropdown does that.',
  ),
  render: () =>
    withLog((log) => html`<div class="sb-stack">
      <wa-dropdown @wa-select=${(e: CustomEvent) => log(`wa-select: ${e.detail.item.value} (menu closed)`)}>
        <wa-button slot="trigger" with-caret>Default behavior</wa-button>
        <wa-dropdown-item type="checkbox" value="grid">Show grid</wa-dropdown-item>
        <wa-dropdown-item type="checkbox" value="rulers">Show rulers</wa-dropdown-item>
      </wa-dropdown>
      <wa-dropdown
        @wa-select=${(e: CustomEvent) => {
          e.preventDefault();
          log(`wa-select: ${e.detail.item.value} (preventDefault, menu stays open)`);
        }}
      >
        <wa-button slot="trigger" with-caret>Stays open</wa-button>
        <wa-dropdown-item type="checkbox" value="grid">Show grid</wa-dropdown-item>
        <wa-dropdown-item type="checkbox" value="rulers">Show rulers</wa-dropdown-item>
      </wa-dropdown>
    </div>`),
};

export const SubmenuParents: StoryObj = {
  name: 'Submenu parents never select',
  parameters: desc(
    "An item that opens a submenu **doesn't emit `wa-select`** and **ignores `href`**, because selecting it opens the submenu. Only the items inside the submenu emit `wa-select`. Don't put an action on a parent item.",
  ),
  render: () =>
    withLog((log) => html`<wa-dropdown @wa-select=${(e: CustomEvent) => log(`wa-select: ${e.detail.item.value}`)}>
      <wa-button slot="trigger" with-caret>Share</wa-button>
      <wa-dropdown-item value="parent" href="https://example.com">
        Share via… (parent: no wa-select, href ignored)
        <wa-dropdown-item slot="submenu" value="email">Email</wa-dropdown-item>
        <wa-dropdown-item slot="submenu" value="link">Copy link</wa-dropdown-item>
      </wa-dropdown-item>
      <wa-dropdown-item value="print">Print</wa-dropdown-item>
    </wa-dropdown>`),
};

export const OneSubmenuLevel: StoryObj = {
  name: 'Use at most one submenu level',
  parameters: desc(
    "Web Awesome recommends **no more than one level of submenu**. Deeper menus are hard to navigate, especially with a pointer. This example nests two levels to show the problem. Flatten the structure, or move secondary choices into a separate view such as a dialog or drawer.",
  ),
  render: () => html`<div style="min-height: 14rem">
    <wa-dropdown>
      <wa-button slot="trigger" with-caret>Don't: nested twice</wa-button>
      <wa-dropdown-item>
        Export
        <wa-dropdown-item slot="submenu">
          Spreadsheet
          <wa-dropdown-item slot="submenu" value="xlsx">Excel</wa-dropdown-item>
          <wa-dropdown-item slot="submenu" value="csv">CSV</wa-dropdown-item>
        </wa-dropdown-item>
        <wa-dropdown-item slot="submenu" value="pdf">PDF</wa-dropdown-item>
      </wa-dropdown-item>
    </wa-dropdown>
  </div>`,
};

export const LinkItems: StoryObj = {
  name: "Link items aren't announced as links",
  parameters: desc(
    'Items with `href` navigate, but keep the `menuitem` role, so screen readers announce them as menu items, not links. Write labels that make the destination clear. Also, **Safari ignores modifier keys** on these items, so Cmd/Ctrl-click does not open a new tab there. Link items still emit `wa-select`. Calling `preventDefault()` cancels both the navigation and the close, which is what this demo does.',
  ),
  render: () =>
    withLog((log) => html`<wa-dropdown
      @wa-select=${(e: CustomEvent) => {
        e.preventDefault();
        log(`wa-select: ${e.detail.item.value} → would navigate to ${e.detail.item.href}`);
      }}
    >
      <wa-button slot="trigger" with-caret>Help</wa-button>
      <wa-dropdown-item value="docs" href="https://webawesome.com/docs">Open documentation (new page)</wa-dropdown-item>
      <wa-dropdown-item value="status" href="https://example.com/status" target="_blank">Service status (new tab)</wa-dropdown-item>
    </wa-dropdown>`),
};

export const PlacementIsAPreference: StoryObj = {
  name: 'Placement is a preference',
  parameters: desc(
    "`placement` is where the menu *prefers* to open. When there isn't room, it shifts to a better spot automatically. Don't build layouts that depend on the menu opening on a particular side. This trigger asks for `top`, but sits at the top of the frame, so the menu opens below.",
  ),
  render: () => html`<div style="min-height: 12rem">
    <wa-dropdown placement="top">
      <wa-button slot="trigger" with-caret>placement="top"</wa-button>
      <wa-dropdown-item value="a">Opens below: no room above</wa-dropdown-item>
      <wa-dropdown-item value="b">Second item</wa-dropdown-item>
    </wa-dropdown>
  </div>`,
};
