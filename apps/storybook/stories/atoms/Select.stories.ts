import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const regions = html`
  <wa-option value="us" selected>United States</wa-option>
  <wa-option value="eu">European Union</wa-option>
  <wa-option value="uk">United Kingdom</wa-option>
  <wa-option value="apac" disabled>Asia-Pacific (coming soon)</wa-option>
`;

export default {
  title: 'Atoms/Select',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-select', {
    soar: 'Labels are one step smaller than the value text, via `wa-select::part(form-control-label)` in `parts.css`.',
    extra: 'Set the initial selection with `selected` on each `<wa-option>`, as with a native `<select>`.',
    args: {
      ...waDefaults('wa-select', ['size', 'appearance', 'placement', 'multiple', 'with-clear', 'disabled', 'required', 'pill']),
      label: 'Region',
      hint: 'Where your data is stored',
    },
  }),
  render: (args: Record<string, unknown>) => {
    const select = waElement('wa-select', args, regions);
    select.style.maxWidth = '24rem';
    return html`<div style="min-height: 16rem">${select}</div>`;
  },
};

export const Playground: StoryObj = {};

export const Multiple: StoryObj = {
  render: () => html`<div style="min-height: 16rem; max-width: 24rem">
    <wa-select label="Notify me about" multiple with-clear>
      <wa-option value="invoices" selected>Invoices</wa-option>
      <wa-option value="mentions" selected>Mentions</wa-option>
      <wa-option value="deploys">Deploys</wa-option>
      <wa-option value="billing">Billing</wa-option>
    </wa-select>
  </div>`,
};

export const Placeholder: StoryObj = {
  render: () => html`<div style="min-height: 16rem; max-width: 24rem">
    <wa-select label="Region" placeholder="Choose a region">
      <wa-option value="us">United States</wa-option>
      <wa-option value="eu">European Union</wa-option>
      <wa-option value="uk">United Kingdom</wa-option>
    </wa-select>
  </div>`,
};
