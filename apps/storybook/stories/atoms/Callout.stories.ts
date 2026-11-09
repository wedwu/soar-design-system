import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const ICONS: Record<string, string> = {
  brand: 'circle-info',
  neutral: 'gear',
  success: 'circle-check',
  warning: 'triangle-exclamation',
  danger: 'circle-exclamation',
};

export default {
  title: 'Atoms/Callout',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-callout', {
    soar: 'No component-specific changes.',
    args: { ...waDefaults('wa-callout', ['variant', 'size']), text: 'Your trial ends in 3 days. Add a payment method to keep your projects.' },
  }),
  render: (args: Record<string, unknown>) =>
    waElement('wa-callout', args, html`<wa-icon slot="icon" name=${ICONS[String(args.variant)] ?? 'circle-info'}></wa-icon>${args.text}`),
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const Variants: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${Object.entries(ICONS).map(
      ([v, icon]) => html`<wa-callout variant=${v}><wa-icon slot="icon" name=${icon}></wa-icon>This is a <strong>${v}</strong> callout.</wa-callout>`,
    )}
  </div>`,
};

export const Appearances: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${['accent', 'filled', 'outlined', 'filled-outlined', 'plain'].map(
      (a) => html`<wa-callout variant="brand" appearance=${a}><wa-icon slot="icon" name="circle-info"></wa-icon>appearance="${a}"</wa-callout>`,
    )}
  </div>`,
};
