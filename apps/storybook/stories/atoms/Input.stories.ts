import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Input',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-input', {
    soar:
      'Labels are one step smaller than the value text (`--wa-font-size-s`), via `wa-input::part(form-control-label)` in `parts.css`. For Soar validation behavior (errors on blur, a character counter, outer-form participation), use the **ax-field** molecule.',
    args: {
      ...waDefaults('wa-input', ['type', 'size', 'appearance', 'pill', 'with-clear', 'disabled', 'readonly', 'required']),
      label: 'Project name',
      hint: 'Shown on invoices',
      placeholder: 'Apollo',
    },
  }),
  render: (args: Record<string, unknown>) => {
    const input = waElement('wa-input', args);
    input.style.maxWidth = '24rem';
    return input;
  },
};

export const Playground: StoryObj = {};

export const Types: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-m); max-width: 24rem">
    <wa-input type="email" label="Email" placeholder="ada@example.com"></wa-input>
    <wa-input type="password" label="Password" password-toggle></wa-input>
    <wa-input type="search" label="Search" with-clear value="invoices"></wa-input>
    <wa-input type="number" label="Seats" value="5"></wa-input>
  </div>`,
};

export const WithIcons: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-m); max-width: 24rem">
    <wa-input label="Search"><wa-icon slot="start" name="magnifying-glass"></wa-icon></wa-input>
    <wa-input label="Website" placeholder="example.com"><span slot="start">https://</span></wa-input>
  </div>`,
};

export const States: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-m); max-width: 24rem">
    <wa-input label="Required" required></wa-input>
    <wa-input label="Disabled" disabled value="Can't edit this"></wa-input>
    <wa-input label="Read-only" readonly value="Copy me"></wa-input>
  </div>`,
};
