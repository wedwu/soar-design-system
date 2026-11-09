import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const VARIANTS = ['brand', 'neutral', 'success', 'warning', 'danger'];

export default {
  title: 'Atoms/Badge',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-badge', {
    soar: 'No component-specific changes. Colors come from the Soar brand, neutral, success, warning and danger ramps.',
    args: { ...waDefaults('wa-badge', ['variant', 'appearance', 'pill', 'attention']), text: 'New' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-badge', args, String(args.text)),
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const Variants: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${['accent', 'filled', 'outlined', 'filled-outlined'].map(
      (appearance) => html`<div class="sb-stack">
        ${VARIANTS.map((v) => html`<wa-badge variant=${v} appearance=${appearance}>${v}</wa-badge>`)}
      </div>`,
    )}
  </div>`,
};

export const Pill: StoryObj = {
  render: () => html`<div class="sb-stack">${VARIANTS.map((v) => html`<wa-badge pill variant=${v}>${v}</wa-badge>`)}</div>`,
};

export const Attention: StoryObj = {
  render: () => html`<div class="sb-stack">
    <wa-button appearance="outlined">Inbox <wa-badge slot="end" pill attention="pulse">4</wa-badge></wa-button>
    <wa-button appearance="outlined">Alerts <wa-badge slot="end" pill variant="danger" attention="bounce">2</wa-badge></wa-button>
  </div>`,
};
