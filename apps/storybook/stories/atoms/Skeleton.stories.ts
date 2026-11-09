import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Skeleton',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-skeleton', {
    soar: 'No component-specific changes.',
    extra: 'Size skeletons with `width` and `height`, and shape them with `border-radius`, to match the content they stand in for.',
    args: waDefaults('wa-skeleton', ['effect']),
  }),
  render: (args: Record<string, unknown>) => {
    const el = waElement('wa-skeleton', args);
    el.style.maxWidth = '24rem';
    return el;
  },
};

export const Playground: StoryObj = {};

export const Effects: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s); max-width: 24rem">
    ${['none', 'pulse', 'sheen'].map((effect) => html`<wa-skeleton effect=${effect}></wa-skeleton>`)}
  </div>`,
};

export const CardPlaceholder: StoryObj = {
  name: 'Card placeholder',
  render: () => html`<div style="display: grid; gap: var(--wa-space-s); max-width: 24rem">
    <div class="sb-stack">
      <wa-skeleton effect="sheen" style="width: 3rem; height: 3rem; border-radius: var(--wa-border-radius-circle)"></wa-skeleton>
      <wa-skeleton effect="sheen" style="flex: 1"></wa-skeleton>
    </div>
    <wa-skeleton effect="sheen"></wa-skeleton>
    <wa-skeleton effect="sheen"></wa-skeleton>
    <wa-skeleton effect="sheen" style="width: 60%"></wa-skeleton>
  </div>`,
};
