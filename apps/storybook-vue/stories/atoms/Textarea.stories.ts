// wa-textarea in Vue, loaded from the CDN. The pieces live side by side:
//   Textarea.data.json  the example content
//   Textarea.mdx        the docs page
// The templates use <wa-textarea> directly, exactly as a CDN page would.
// Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Textarea.data.json';

const ATTRS = ['label', 'hint', 'placeholder', 'size', 'appearance', 'rows', 'resize', 'disabled', 'readonly', 'required', 'with-count', 'maxlength'];

/** Actions panel: every event wa-textarea fires (from Web Awesome's manifest), with its value. */
const textareaEvents = () =>
  Object.fromEntries(
    waEventNames('wa-textarea').map((name) => [name, (e: Event) => action(name)({ value: (e.currentTarget as HTMLTextAreaElement).value })]),
  );

const meta = {
  title: 'Atoms/Textarea',
  // No `component`: wa-textarea is a custom element, not a Vue component.
  // No 'autodocs': Textarea.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN. maxlength is a text
  // field that starts empty (no limit): a number control has no "empty", so
  // Storybook would show a "Set number" button instead.
  argTypes: { ...waArgTypes('wa-textarea', ATTRS), maxlength: { ...waArgTypes('wa-textarea', ['maxlength']).maxlength, control: 'text' } },
  args: { ...controlArgs('wa-textarea', ATTRS), maxlength: '', label: data.label, hint: data.hint, placeholder: data.placeholder },
  parameters: {
    // "Show code" shows the real <wa-textarea> markup for the current controls.
    // Without it, Storybook would invent a Vue component name (<Textarea .../>).
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-textarea', args, ATTRS),
      },
    },
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup: () => ({ attrs: computed(() => waAttrs(args, ATTRS)), events: textareaEvents() }),
    template: `<wa-textarea v-bind="attrs" v-on="events" style="max-width: 32rem"></wa-textarea>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const WithCount: Story = {
  name: 'Character count',
  args: { 'with-count': true, maxlength: data.withCount.maxlength, label: data.withCount.label, hint: '' },
};

export const AutoResize: Story = {
  name: 'Auto resize',
  args: { resize: 'auto', rows: data.autoResize.rows, label: data.autoResize.label },
};
