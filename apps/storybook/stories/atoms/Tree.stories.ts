import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tree/tree.js';
import '@awesome.me/webawesome/dist/components/tree-item/tree-item.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const items = html`
  <wa-tree-item expanded>
    Workspace
    <wa-tree-item expanded>
      Projects
      <wa-tree-item selected>Apollo</wa-tree-item>
      <wa-tree-item>Gemini</wa-tree-item>
      <wa-tree-item disabled>Mercury (archived)</wa-tree-item>
    </wa-tree-item>
    <wa-tree-item>
      Billing
      <wa-tree-item>Invoices</wa-tree-item>
      <wa-tree-item>Payment methods</wa-tree-item>
    </wa-tree-item>
  </wa-tree-item>
  <wa-tree-item>Personal</wa-tree-item>
`;

export default {
  title: 'Atoms/Tree',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-tree', {
    soar: 'No component-specific changes.',
    extra: 'Listen for `wa-selection-change` to read the selected items. Selections appear in the **Actions** panel.',
    args: waDefaults('wa-tree', ['selection']),
  }),
  render: (args: Record<string, unknown>) => {
    const tree = waElement('wa-tree', args, items);
    tree.style.maxWidth = '20rem';
    return tree;
  },
};

export const Playground: StoryObj = {};

export const Multiple: StoryObj = {
  name: 'Multiple selection',
  args: { selection: 'multiple' },
  parameters: {
    docs: {
      description: {
        story:
          '**Known upstream accessibility issue (Web Awesome 3.14.0):** in `multiple` mode, the checkboxes the tree item renders in its shadow DOM have no accessible label, so axe reports `label` violations in the Accessibility panel. This is inside Web Awesome, so Soar does not patch it. Selection state is still exposed through the tree items. Re-check after each `npm run upstream:bump`.',
      },
    },
  },
};

export const WithIcons: StoryObj = {
  render: () => html`<wa-tree style="max-width: 20rem; --indent-guide-width: var(--wa-border-width-s)">
    <wa-tree-item expanded>
      <wa-icon name="folder"></wa-icon> Documents
      <wa-tree-item><wa-icon name="file-pdf"></wa-icon> Contract.pdf</wa-tree-item>
      <wa-tree-item><wa-icon name="file-excel"></wa-icon> Forecast.xlsx</wa-tree-item>
    </wa-tree-item>
    <wa-tree-item><wa-icon name="folder"></wa-icon> Photos</wa-tree-item>
  </wa-tree>`,
};
