import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const VARIANTS = ['brand', 'neutral', 'success', 'warning', 'danger'];

export default {
  title: 'Atoms/Button',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-button', {
    soar: 'No component-specific changes. Every color, radius, font weight and transition comes from Soar tokens.',
    args: { ...waDefaults('wa-button', ['variant', 'appearance', 'size', 'pill', 'with-caret', 'disabled', 'loading']), variant: 'brand', text: 'Save changes' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-button', args, String(args.text)),
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const Variants: StoryObj = {
  render: () => html`${['accent', 'filled', 'outlined', 'filled-outlined', 'plain'].map(
    (appearance) => html`<div class="sb-stack" style="margin-block-end: var(--wa-space-m)">
      ${VARIANTS.map((variant) => html`<wa-button variant=${variant} appearance=${appearance}>${variant}</wa-button>`)}
    </div>`,
  )}`,
};

export const Sizes: StoryObj = {
  render: () => html`<div class="sb-stack">
    ${['small', 'medium', 'large'].map((size) => html`<wa-button variant="brand" size=${size}>${size}</wa-button>`)}
  </div>`,
};

export const States: StoryObj = {
  render: () => html`<div class="sb-stack">
    <wa-button variant="brand" disabled>Disabled</wa-button>
    <wa-button variant="brand" loading>Loading</wa-button>
    <wa-button with-caret>With caret</wa-button>
    <wa-button pill variant="brand">Pill</wa-button>
  </div>`,
};

export const WithIcons: StoryObj = {
  render: () => html`<div class="sb-stack">
    <wa-button variant="brand"><wa-icon slot="start" name="floppy-disk"></wa-icon>Save</wa-button>
    <wa-button>Next<wa-icon slot="end" name="arrow-right"></wa-icon></wa-button>
    <wa-button appearance="plain"><wa-icon name="gear" label="Settings"></wa-icon></wa-button>
  </div>`,
};
