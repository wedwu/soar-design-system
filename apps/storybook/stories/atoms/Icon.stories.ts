import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Icon',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-icon', {
    soar: 'No component-specific changes. Icons inherit `currentColor` and size with `font-size`.',
    extra: [
      '**Where icons load from:** the default library fetches Font Awesome Free SVGs from the **public Font Awesome CDN**.',
      'Soar self-hosts its own packages and CDN. To keep icons off public hosts too, download the Font Awesome SVGs, serve them next to the self-hosted CDN, and call `setIconPath()` from `@awesome.me/webawesome/dist/webawesome.js` before any icon renders.',
      'Icons are decorative unless you set `label`. Always label icon-only buttons.',
    ].join(' '),
    args: { ...waDefaults('wa-icon', ['family', 'library', 'rotate', 'auto-width']), name: 'house', 'font-size': '2rem' },
  }),
  render: (args: Record<string, unknown>) => {
    const icon = waElement('wa-icon', args);
    icon.style.fontSize = String(args['font-size'] ?? '');
    return icon;
  },
};

export const Playground: StoryObj = {
  argTypes: { 'font-size': { control: 'text', table: { category: 'story' } } },
};

export const Common: StoryObj = {
  render: () => html`<div class="sb-stack" style="font-size: 1.5rem">
    ${['house', 'gear', 'user', 'bell', 'magnifying-glass', 'pen', 'trash', 'copy', 'download', 'circle-check', 'triangle-exclamation', 'circle-info'].map(
      (name) => html`<wa-icon name=${name} label=${name}></wa-icon>`,
    )}
  </div>`,
};

export const Variants: StoryObj = {
  render: () => html`<div class="sb-stack" style="font-size: 2rem">
    <wa-icon name="star" variant="solid" label="Solid star"></wa-icon>
    <wa-icon name="star" variant="regular" label="Regular star"></wa-icon>
    <wa-icon name="github" family="brands" label="GitHub"></wa-icon>
  </div>`,
};

export const Sizing: StoryObj = {
  render: () => html`<div class="sb-stack">
    ${['var(--wa-font-size-s)', 'var(--wa-font-size-m)', 'var(--wa-font-size-xl)', 'var(--wa-font-size-3xl)'].map(
      (size) => html`<wa-icon name="rocket" style=${`font-size: ${size}`}></wa-icon>`,
    )}
  </div>`,
};
