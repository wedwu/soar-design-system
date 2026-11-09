import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/button-group/button-group.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/ButtonGroup',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-button-group', {
    soar: 'No component-specific changes.',
    extra: 'Always set `label`. It is announced to assistive technology for the group.',
    args: { ...waDefaults('wa-button-group', ['orientation']), label: 'Alignment' },
  }),
  render: (args: Record<string, unknown>) =>
    waElement(
      'wa-button-group',
      args,
      html`<wa-button appearance="filled">Left</wa-button><wa-button appearance="filled">Center</wa-button><wa-button appearance="filled">Right</wa-button>`,
    ),
};

export const Playground: StoryObj = {};

export const Vertical: StoryObj = { args: { orientation: 'vertical', label: 'Options' } };

export const IconToolbar: StoryObj = {
  render: () => html`<wa-button-group label="Text formatting">
    <wa-button appearance="outlined"><wa-icon name="bold" label="Bold"></wa-icon></wa-button>
    <wa-button appearance="outlined"><wa-icon name="italic" label="Italic"></wa-icon></wa-button>
    <wa-button appearance="outlined"><wa-icon name="underline" label="Underline"></wa-icon></wa-button>
  </wa-button-group>`,
};

export const SplitButton: StoryObj = {
  render: () => html`<wa-button-group label="Save options">
    <wa-button variant="brand">Save</wa-button>
    <wa-dropdown placement="bottom-end">
      <wa-button slot="trigger" variant="brand"><wa-icon name="chevron-down" label="More save options"></wa-icon></wa-button>
      <wa-dropdown-item value="draft">Save as draft</wa-dropdown-item>
      <wa-dropdown-item value="template">Save as template</wa-dropdown-item>
    </wa-dropdown>
  </wa-button-group>`,
};
