import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/details/details.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Details',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-details', {
    soar: 'No component-specific changes.',
    args: {
      ...waDefaults('wa-details', ['open', 'disabled', 'appearance', 'icon-placement']),
      summary: 'What happens when my trial ends?',
    },
  }),
  render: (args: Record<string, unknown>) =>
    waElement('wa-details', args, "Your projects stay read-only for 30 days. Add a payment method any time to pick up where you left off."),
};

export const Playground: StoryObj = {};

export const Open: StoryObj = { args: { open: true } };

export const Grouped: StoryObj = {
  name: 'Grouped (one open at a time)',
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    <wa-details name="faq" summary="Can I change plans later?" open>Yes. Upgrades apply immediately; downgrades apply at the next billing date.</wa-details>
    <wa-details name="faq" summary="Do you offer refunds?">Annual plans can be refunded within 30 days.</wa-details>
    <wa-details name="faq" summary="Where is my data stored?">In the region you chose when creating the workspace.</wa-details>
  </div>`,
};

export const Appearances: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${['outlined', 'filled', 'filled-outlined', 'plain'].map(
      (a) => html`<wa-details appearance=${a} summary=${`appearance="${a}"`}>Content</wa-details>`,
    )}
  </div>`,
};
