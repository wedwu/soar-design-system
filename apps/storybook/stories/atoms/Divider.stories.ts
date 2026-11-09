import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Divider',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-divider', {
    soar: 'No component-specific changes. The line color is `--wa-color-surface-border`.',
    args: waDefaults('wa-divider', ['orientation', 'label-placement']),
  }),
  render: (args: Record<string, unknown>) =>
    html`<div style="display: flex; flex-direction: ${args.orientation === 'vertical' ? 'row' : 'column'}; height: ${args.orientation === 'vertical' ? '4rem' : 'auto'}; align-items: center">
      <span>Above</span>${waElement('wa-divider', args)}<span>Below</span>
    </div>`,
};

export const Playground: StoryObj = {};

export const Vertical: StoryObj = {
  render: () => html`<div class="sb-stack" style="height: 1.5rem">
    <span>Edit</span><wa-divider orientation="vertical"></wa-divider><span>Share</span><wa-divider orientation="vertical"></wa-divider><span>Delete</span>
  </div>`,
};

export const WithLabel: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-l)">
    <wa-divider>or</wa-divider>
    <wa-divider label-placement="start">Billing</wa-divider>
    <wa-divider label-placement="end">Archived</wa-divider>
  </div>`,
};
