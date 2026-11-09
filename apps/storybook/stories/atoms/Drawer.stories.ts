import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/drawer/drawer.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Drawer',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-drawer', {
    soar:
      'Two adjustments in `parts.css`. (1) A wider panel with roomier padding, set through the drawer\'s own `--size` and `--spacing` properties. (2) A divider under the header, via `wa-drawer::part(header)`. The component itself is untouched.',
    iframeHeight: 520,
    args: { ...waDefaults('wa-drawer', ['placement', 'light-dismiss', 'without-header']), label: 'Invoice INV-1043', open: true },
  }),
  render: (args: Record<string, unknown>) => {
    const drawer = waElement(
      'wa-drawer',
      args,
      html`<p>Contoso · Due 2026-09-15</p>
        <p>This invoice is 23 days overdue. Send a reminder or mark it as paid.</p>
        <div slot="footer" class="sb-stack" style="justify-content: end">
          <wa-button appearance="plain" data-drawer="close">Cancel</wa-button>
          <wa-button variant="brand" data-drawer="close">Send reminder</wa-button>
        </div>`,
    ) as HTMLElement & { open: boolean };
    return html`<div style="padding: var(--wa-space-l)">
      <wa-button variant="brand" @click=${() => (drawer.open = true)}>Open drawer</wa-button>
      ${drawer}
    </div>`;
  },
};

export const Default: StoryObj = {};
export const Start: StoryObj = { args: { placement: 'start' } };
