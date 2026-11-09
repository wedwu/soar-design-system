import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const options = html`
  <wa-radio value="monthly">Monthly</wa-radio>
  <wa-radio value="annual">Annual (2 months free)</wa-radio>
  <wa-radio value="custom" disabled>Custom (contact sales)</wa-radio>
`;

export default {
  title: 'Atoms/Radio',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-radio-group', {
    soar: 'No component-specific changes.',
    extra: 'Radios are always used inside `<wa-radio-group>`, which owns the label, value, validation and form participation. The controls below configure the group.',
    args: {
      ...waDefaults('wa-radio-group', ['orientation', 'size', 'disabled', 'required']),
      label: 'Billing cycle',
      hint: 'You can change this at any time.',
      name: 'billing',
      value: 'monthly',
    },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-radio-group', args, options),
};

export const Playground: StoryObj = {};

export const Horizontal: StoryObj = { args: { orientation: 'horizontal' } };

export const ButtonAppearance: StoryObj = {
  name: 'Button appearance',
  render: () => html`<wa-radio-group label="View" name="view" value="list" orientation="horizontal">
    <wa-radio appearance="button" value="list">List</wa-radio>
    <wa-radio appearance="button" value="board">Board</wa-radio>
    <wa-radio appearance="button" value="calendar">Calendar</wa-radio>
  </wa-radio-group>`,
};
