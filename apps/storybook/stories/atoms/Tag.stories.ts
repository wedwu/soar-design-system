import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const VARIANTS = ['brand', 'neutral', 'success', 'warning', 'danger'];

export default {
  title: 'Atoms/Tag',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-tag', {
    soar: 'No component-specific changes.',
    extra: '`with-remove` only shows the button and emits `wa-remove`. Your code removes the tag. Try it in the **Removable** story.',
    args: { ...waDefaults('wa-tag', ['variant', 'appearance', 'size', 'pill', 'with-remove']), text: 'Design system' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-tag', args, String(args.text)),
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const Variants: StoryObj = {
  render: () => html`<div style="display: grid; gap: var(--wa-space-s)">
    ${['accent', 'filled', 'outlined', 'filled-outlined'].map(
      (appearance) => html`<div class="sb-stack">
        ${VARIANTS.map((v) => html`<wa-tag variant=${v} appearance=${appearance}>${v}</wa-tag>`)}
      </div>`,
    )}
  </div>`,
};

export const Sizes: StoryObj = {
  render: () => html`<div class="sb-stack">${['small', 'medium', 'large'].map((s) => html`<wa-tag size=${s}>${s}</wa-tag>`)}</div>`,
};

export const Removable: StoryObj = {
  render: () => html`<div class="sb-stack" @wa-remove=${(e: Event) => (e.target as HTMLElement).remove()}>
    ${['invoices', 'mentions', 'deploys', 'billing'].map((t) => html`<wa-tag with-remove pill>${t}</wa-tag>`)}
  </div>`,
};
