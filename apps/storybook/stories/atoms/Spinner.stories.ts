import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import { atomMeta, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Spinner',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-spinner', {
    soar: 'No component-specific changes. The indicator uses the Soar brand fill.',
    extra: 'Spinners scale with `font-size`. Inside buttons, prefer the button\'s own `loading` attribute.',
    args: { 'font-size': '2rem' },
  }),
  render: (args: Record<string, unknown>) => {
    const el = waElement('wa-spinner', args);
    el.style.fontSize = String(args['font-size'] ?? '');
    return el;
  },
};

export const Playground: StoryObj = {
  argTypes: { 'font-size': { control: 'text', table: { category: 'story' } } },
};

export const Sizes: StoryObj = {
  render: () => html`<div class="sb-stack">
    ${['var(--wa-font-size-m)', 'var(--wa-font-size-2xl)', 'var(--wa-font-size-4xl)'].map(
      (size) => html`<wa-spinner style=${`font-size: ${size}`}></wa-spinner>`,
    )}
  </div>`,
};

export const TrackWidth: StoryObj = {
  name: 'Track width',
  render: () => html`<wa-spinner style="font-size: var(--wa-font-size-4xl); --track-width: var(--wa-border-width-l)"></wa-spinner>`,
};
