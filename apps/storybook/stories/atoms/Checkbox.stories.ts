import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Checkbox',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-checkbox', {
    soar: 'No component-specific changes. The checked fill uses `--wa-form-control-activated-color`, which resolves to the Soar brand fill.',
    args: { ...waDefaults('wa-checkbox', ['size', 'disabled', 'indeterminate', 'required']), text: 'Email me about product updates', hint: '' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-checkbox', args, String(args.text)),
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const States: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    <wa-checkbox>Unchecked</wa-checkbox>
    <wa-checkbox checked>Checked</wa-checkbox>
    <wa-checkbox indeterminate>Indeterminate</wa-checkbox>
    <wa-checkbox disabled>Disabled</wa-checkbox>
    <wa-checkbox checked disabled>Checked and disabled</wa-checkbox>
  </div>`,
};

export const WithHint: StoryObj = {
  render: () => html`<wa-checkbox hint="We'll send at most one email a month.">Email me about product updates</wa-checkbox>`,
};

export const Sizes: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${['small', 'medium', 'large'].map((s) => html`<wa-checkbox size=${s} checked>${s}</wa-checkbox>`)}
  </div>`,
};
