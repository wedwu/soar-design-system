import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Switch',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-switch', {
    soar: 'No component-specific changes.',
    extra: 'Use a switch for a setting that takes effect immediately. In a form that is submitted, use a checkbox.',
    args: { ...waDefaults('wa-switch', ['size', 'disabled', 'required']), text: 'Two-factor authentication', hint: '' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-switch', args, String(args.text)),
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const States: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    <wa-switch>Off</wa-switch>
    <wa-switch checked>On</wa-switch>
    <wa-switch disabled>Disabled</wa-switch>
    <wa-switch checked disabled>On and disabled</wa-switch>
  </div>`,
};

export const WithHint: StoryObj = {
  render: () => html`<wa-switch hint="We'll ask for a code each time you sign in.">Two-factor authentication</wa-switch>`,
};

export const Sizes: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${['small', 'medium', 'large'].map((s) => html`<wa-switch size=${s} checked>${s}</wa-switch>`)}
  </div>`,
};
