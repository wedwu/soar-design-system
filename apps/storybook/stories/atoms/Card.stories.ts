import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const content = html`
  <div slot="header" class="sb-stack" style="justify-content: space-between">
    <strong>Usage this month</strong>
    <wa-badge variant="success">Healthy</wa-badge>
  </div>
  You've used 62% of your plan's API quota.
  <div slot="footer" class="sb-stack">
    <wa-button size="small" appearance="filled" variant="brand">Upgrade</wa-button>
    <wa-button size="small" appearance="plain">Details</wa-button>
  </div>
`;

export default {
  title: 'Atoms/Card',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-card', {
    soar:
      'The header sits on the lowered surface with a hairline divider, via `wa-card::part(header)` in `parts.css`. WA has no token for a card header background. Accent cards keep WA\'s header, because their text is white.',
    args: waDefaults('wa-card', ['appearance', 'orientation']),
  }),
  render: (args: Record<string, unknown>) => {
    const card = waElement('wa-card', args, content);
    card.style.maxWidth = '24rem';
    return card;
  },
};

export const Playground: StoryObj = {};

export const BodyOnly: StoryObj = {
  render: () => html`<wa-card style="max-width: 24rem">A card with no header or footer.</wa-card>`,
};

export const Appearances: StoryObj = {
  render: () => html`<div class="sb-grid">
    ${['outlined', 'filled', 'filled-outlined', 'plain', 'accent'].map(
      (a) => html`<wa-card appearance=${a}><div slot="header">${a}</div>Card body</wa-card>`,
    )}
  </div>`,
};
