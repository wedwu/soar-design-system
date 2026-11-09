import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const items = html`
  <wa-button slot="trigger" appearance="filled" with-caret>Actions</wa-button>
  <wa-dropdown-item value="edit"><wa-icon slot="icon" name="pen"></wa-icon>Edit</wa-dropdown-item>
  <wa-dropdown-item value="duplicate"><wa-icon slot="icon" name="copy"></wa-icon>Duplicate<span slot="details">⌘D</span></wa-dropdown-item>
  <wa-dropdown-item value="archive" disabled><wa-icon slot="icon" name="box-archive"></wa-icon>Archive</wa-dropdown-item>
  <wa-divider></wa-divider>
  <wa-dropdown-item value="delete" variant="danger"><wa-icon slot="icon" name="trash"></wa-icon>Delete</wa-dropdown-item>
`;

export default {
  title: 'Atoms/Dropdown',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-dropdown', {
    soar: 'No component-specific changes.',
    extra: 'Listen for `wa-select` and read `event.detail.item.value`. Selections appear in the **Actions** panel. Known constraints are on the **Dropdown Limitations** page.',
    args: waDefaults('wa-dropdown', ['placement', 'size', 'distance', 'skidding']),
  }),
  render: (args: Record<string, unknown>) => html`<div style="min-height: 16rem">${waElement('wa-dropdown', args, items)}</div>`,
};

export const Playground: StoryObj = {};

export const CheckableItems: StoryObj = {
  render: () => html`<div style="min-height: 12rem">
    <wa-dropdown>
      <wa-button slot="trigger" appearance="filled" with-caret>View</wa-button>
      <wa-dropdown-item type="checkbox" value="grid" checked>Show grid</wa-dropdown-item>
      <wa-dropdown-item type="checkbox" value="rulers">Show rulers</wa-dropdown-item>
      <wa-dropdown-item type="checkbox" value="guides" checked>Show guides</wa-dropdown-item>
    </wa-dropdown>
  </div>`,
};

export const Submenu: StoryObj = {
  render: () => html`<div style="min-height: 14rem">
    <wa-dropdown>
      <wa-button slot="trigger" appearance="filled" with-caret>Export</wa-button>
      <wa-dropdown-item>
        Format
        <wa-dropdown-item slot="submenu" value="pdf">PDF</wa-dropdown-item>
        <wa-dropdown-item slot="submenu" value="csv">CSV</wa-dropdown-item>
        <wa-dropdown-item slot="submenu" value="xlsx">Excel spreadsheet</wa-dropdown-item>
      </wa-dropdown-item>
      <wa-dropdown-item value="email">Email a copy</wa-dropdown-item>
    </wa-dropdown>
  </div>`,
};
