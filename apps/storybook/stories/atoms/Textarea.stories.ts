import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

export default {
  title: 'Atoms/Textarea',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-textarea', {
    soar: 'Labels are one step smaller than the value text, via `wa-textarea::part(form-control-label)` in `parts.css`.',
    args: {
      ...waDefaults('wa-textarea', ['size', 'appearance', 'rows', 'resize', 'disabled', 'readonly', 'required', 'with-count']),
      label: 'Notes',
      hint: 'Visible to your team only',
      placeholder: 'Add context for the next reviewer…',
    },
  }),
  render: (args: Record<string, unknown>) => {
    const el = waElement('wa-textarea', args);
    el.style.maxWidth = '32rem';
    return el;
  },
};

export const Playground: StoryObj = {};

export const WithCount: StoryObj = {
  name: 'Character count',
  args: { 'with-count': true, maxlength: 280, label: 'Status update', hint: '' },
};

export const AutoResize: StoryObj = {
  name: 'Auto resize',
  args: { resize: 'auto', rows: 2, label: 'Grows as you type' },
};
