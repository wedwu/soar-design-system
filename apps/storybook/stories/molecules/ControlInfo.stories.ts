import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';

const meta: Meta = {
  title: 'Molecules/Control Info',
  tags: ['autodocs'],
  component: 'ax-control-info',
  parameters: {
    docs: {
      description: {
        component: [
          'A label and help text ("info") for any form control. The info text shows under the label or behind an info button.',
          'The label, info and control stay in **your** DOM (slots). The component fills in only what\'s missing, and never overwrites what you set: an `id` on the control, `for` on a slotted `<label>`, and the required marker when the control is `required`.',
          '**How the label and info reach screen readers** depends on the control. **Native controls** (`<input>`, `<select>`) get the info text in `aria-describedby`. **Web Awesome controls** render their real input inside their own shadow DOM, where an outside `<label>` or `aria-describedby` can\'t reach. So the component passes the same text through Web Awesome\'s public API (the control\'s `label` and `hint`), and `parts.css` visually hides Web Awesome\'s copy. Screen readers announce the right name and description, and nothing appears twice. If you set `label` or `hint` on the control yourself, they are left alone.',
          'Use a `<label>` in the `label` slot so clicking it focuses the control. Use this component for the info button, the horizontal layout, or one consistent label pattern across Web Awesome and native controls.',
        ].join('\n\n'),
      },
    },
  },
  argTypes: {
    'info-display': { control: 'inline-radio', options: ['inline', 'tooltip'] },
    layout: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
  args: { 'info-display': 'inline', layout: 'vertical' },
  render: (args) => html`<ax-control-info info-display=${args['info-display']} layout=${args.layout} style="max-width: 32rem">
    <label slot="label">Seats</label>
    <span slot="info">Billed per active user each month.</span>
    <wa-input type="number" value="5"></wa-input>
  </ax-control-info>`,
};
export default meta;

export const Playground: StoryObj = {};

export const Tooltip: StoryObj = { args: { 'info-display': 'tooltip' } };

export const SettingsRows: StoryObj = {
  name: 'Horizontal (settings rows)',
  parameters: {
    docs: {
      description: {
        story:
          'The select\'s accessible name ("Default region") comes from the label passed to `wa-select`, and matches the visible label exactly, which satisfies WCAG 2.5.3 (Label in Name). axe\'s best-practice rule `label-title-only` still flags it, because the visible label sits outside `wa-select`\'s shadow root and axe can\'t connect the two. That single rule is turned off for this story only. A plain `wa-select` with its own label passes it.',
      },
    },
    // See the story description: a cross-shadow-root false positive. Scoped to this story.
    // audit-exception: control-info-select-label
    a11y: { config: { rules: [{ id: 'label-title-only', enabled: false }] } },
  },
  render: () => html`<div style="display: grid; gap: var(--wa-space-l); max-width: 40rem">
    <ax-control-info layout="horizontal">
      <label slot="label">Two-factor authentication</label>
      <span slot="info">Ask for a code each time you sign in.</span>
      <wa-switch></wa-switch>
    </ax-control-info>
    <ax-control-info layout="horizontal" info-display="tooltip">
      <label slot="label">Default region</label>
      <span slot="info">Where new projects store their data. Existing projects don't move.</span>
      <wa-select value="us" style="min-width: 12rem">
        <wa-option value="us" selected>United States</wa-option>
        <wa-option value="eu">European Union</wa-option>
      </wa-select>
    </ax-control-info>
  </div>`,
};

export const NativeControl: StoryObj = {
  name: 'Native control',
  render: () => html`<ax-control-info style="max-width: 24rem">
    <label slot="label">Report frequency</label>
    <span slot="info">How often we email the usage report.</span>
    <select>
      <option>Weekly</option>
      <option>Monthly</option>
    </select>
  </ax-control-info>`,
};

export const Required: StoryObj = {
  render: () => html`<ax-control-info style="max-width: 24rem">
    <label slot="label">Billing email</label>
    <span slot="info">Invoices are sent here.</span>
    <input type="email" required />
  </ax-control-info>`,
};
