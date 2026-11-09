import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

// Tooltips point at their target by id, and every story on the docs page
// shares one document, so ids must be unique per render.
let n = 0;
const uid = (prefix: string) => `${prefix}-${++n}`;

export default {
  title: 'Atoms/Tooltip',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-tooltip', {
    soar: 'No component-specific changes.',
    extra:
      'A tooltip attaches to its target with `for="<target id>"`. Keep content short and non-interactive. For anything clickable, use a dropdown or a popover.',
    args: { ...waDefaults('wa-tooltip', ['placement', 'trigger', 'distance', 'without-arrow', 'disabled']), text: 'Copy invoice link' },
  }),
  render: (args: Record<string, unknown>) => {
    const id = uid('tooltip-target');
    return html`<div style="padding: var(--wa-space-3xl); display: grid; place-items: center">
      <wa-button id=${id} appearance="outlined"><wa-icon name="link" label="Copy invoice link"></wa-icon></wa-button>
      ${waElement('wa-tooltip', { ...args, for: id }, String(args.text))}
    </div>`;
  },
};

export const Playground: StoryObj = {
  argTypes: { text: { control: 'text', table: { category: 'story' } } },
};

export const Open: StoryObj = { args: { open: true } };

export const ClickTrigger: StoryObj = { name: 'Click trigger', args: { trigger: 'click', text: 'Click again to close' } };

export const Placements: StoryObj = {
  render: () => {
    const placements = ['top', 'right', 'bottom', 'left'];
    return html`<div class="sb-stack" style="padding: var(--wa-space-3xl); justify-content: center">
      ${placements.map((p) => {
        const id = uid('tooltip-placement');
        return html`<wa-button id=${id}>${p}</wa-button><wa-tooltip for=${id} placement=${p}>placement="${p}"</wa-tooltip>`;
      })}
    </div>`;
  },
};
