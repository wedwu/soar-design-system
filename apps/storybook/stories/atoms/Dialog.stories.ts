import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Dialog',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-dialog', {
    soar: 'The title uses the heading font family and weight, via `wa-dialog::part(title)` in `parts.css`.',
    extra: 'Buttons with `data-dialog="close"` inside the dialog close it. That is built-in WA behavior.',
    iframeHeight: 420,
    args: { ...waDefaults('wa-dialog', ['without-header', 'light-dismiss']), label: 'Delete project?', open: true },
  }),
  render: (args: Record<string, unknown>) => {
    const dialog = waElement(
      'wa-dialog',
      args,
      html`This permanently deletes <strong>Apollo</strong> and its 14 invoices. You can't undo this.
        <wa-button slot="footer" appearance="plain" data-dialog="close">Cancel</wa-button>
        <wa-button slot="footer" variant="danger" data-dialog="close">Delete project</wa-button>`,
    ) as HTMLElement & { open: boolean };
    return html`<div style="padding: var(--wa-space-l)">
      <wa-button variant="danger" @click=${() => (dialog.open = true)}>Delete project</wa-button>
      ${dialog}
    </div>`;
  },
};

export const Playground: StoryObj = {};

export const LightDismiss: StoryObj = {
  name: 'Light dismiss',
  args: { 'light-dismiss': true, label: 'Click outside to close' },
};

export const WithoutHeader: StoryObj = {
  name: 'Without header',
  args: { 'without-header': true },
};
