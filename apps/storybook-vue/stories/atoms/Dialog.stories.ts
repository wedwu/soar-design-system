// wa-dialog in Vue, loaded from the CDN. The pieces live side by side:
//   Dialog.data.json  the example content
//   Dialog.mdx        the docs page
// The template uses <wa-dialog> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { computed, ref, watch } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Dialog.data.json';

const ATTRS = ['open', 'label', 'without-header', 'light-dismiss'];

/** What goes inside <wa-dialog> in the "Show code" panel, matching the template below. */
const dialogContent = [
  `${data.body.before}<strong>${data.body.strong}</strong>${data.body.after}`,
  ...data.actions.map(
    (a) =>
      `<wa-button slot="footer"${'appearance' in a ? ` appearance="${a.appearance}"` : ''}${'variant' in a ? ` variant="${a.variant}"` : ''} data-dialog="close">${a.text}</wa-button>`,
  ),
].join('\n');

const meta = {
  title: 'Atoms/Dialog',
  // No `component`: wa-dialog is a custom element, not a Vue component.
  // No 'autodocs': Dialog.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-dialog', ATTRS),
  // Stories start closed: open one with its trigger button or the `open`
  // control. Docs render the stories inline so the docs page's Controls table
  // can change them; an open dialog then covers the page, as it would in an app.
  args: { ...controlArgs('wa-dialog', ATTRS), label: data.label },
  parameters: {
    docs: {
      // "Show code" shows the real <wa-dialog> markup for the current controls.
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => waSource('wa-dialog', args, ATTRS, dialogContent),
      },
    },
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => ({
    setup() {
      // The dialog can close itself (Escape, close button, data-dialog="close",
      // light dismiss), so keep a local `open` that follows both the control
      // and the dialog's own wa-after-hide event.
      const open = ref(Boolean(args.open));
      watch(() => args.open, (value) => (open.value = Boolean(value)));
      // Every other attribute, with off booleans left out (see waAttrs).
      const attrs = computed(() => waAttrs(args, ATTRS.filter((name) => name !== 'open')));
      // Actions panel: every event wa-dialog fires (from Web Awesome's manifest),
      // plus the footer buttons. Only the dialog's own events are logged.
      const events = Object.fromEntries(
        waEventNames('wa-dialog').map((name) => [name, (e: Event) => e.target === e.currentTarget && action(name)(e)]),
      );
      const onFooterAction = (text: string) => action('footer-action')(text);
      return { open, attrs, events, data, onFooterAction };
    },
    // `open` is bound as `open || undefined` and cleared on wa-after-hide (when
    // the dialog has finished closing), exactly as for wa-drawer.
    template: `
      <div style="padding: var(--wa-space-l)">
        <wa-button variant="danger" @click="open = true">{{ data.trigger }}</wa-button>
        <wa-dialog
          v-bind="attrs"
          :open="open || undefined"
          v-on="events"
          @wa-after-hide.self="open = false"
        >
          {{ data.body.before }}<strong>{{ data.body.strong }}</strong>{{ data.body.after }}
          <wa-button
            v-for="a in data.actions"
            :key="a.text"
            slot="footer"
            :appearance="a.appearance"
            :variant="a.variant"
            data-dialog="close"
            @click="onFooterAction(a.text)"
          >{{ a.text }}</wa-button>
        </wa-dialog>
      </div>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const LightDismiss: Story = {
  name: 'Light dismiss',
  args: { 'light-dismiss': true, label: data.lightDismissLabel },
};

export const WithoutHeader: Story = {
  name: 'Without header',
  args: { 'without-header': true },
};
