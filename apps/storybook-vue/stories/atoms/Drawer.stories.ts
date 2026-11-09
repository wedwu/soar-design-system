// wa-drawer in Vue, loaded from the CDN. The pieces live side by side:
//   Drawer.data.json  the example content
//   Drawer.mdx        the docs page
// The template uses <wa-drawer> directly, exactly as a CDN page would. Nothing
// here imports Web Awesome or Soar: the CDN <script> tags in .storybook/main.ts
// register the elements, and .storybook/preview.ts tells Vue they're custom elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { ref, watch } from 'vue';
import { controlArgs } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Drawer.data.json';

const ATTRS = ['open', 'label', 'placement', 'light-dismiss', 'without-header'];

/** What goes inside <wa-drawer> in the "Show code" panel, matching the template below. */
function drawerContent(withHeaderActions: boolean) {
  const headerActions = withHeaderActions
    ? data.headerActions.map(
        (item) => `<wa-button slot="header-actions" appearance="plain"><wa-icon name="${item.icon}" label="${item.label}"></wa-icon></wa-button>`,
      )
    : [];
  const buttons = data.actions.map(
    (a) => `  <wa-button${'appearance' in a ? ` appearance="${a.appearance}"` : ''}${'variant' in a ? ` variant="${a.variant}"` : ''} data-drawer="close">${a.text}</wa-button>`,
  );
  return [
    ...headerActions,
    ...data.body.map((line) => `<p>${line}</p>`),
    '<div slot="footer">',
    ...buttons,
    '</div>',
  ].join('\n');
}

const meta = {
  title: 'Atoms/Drawer',
  // No `component`: wa-drawer is a custom element, not a Vue component.
  // No 'autodocs': Drawer.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN.
  argTypes: waArgTypes('wa-drawer', ATTRS),
  // Stories start closed: open one with its "Open drawer" button or the `open`
  // control. Docs render the stories inline (not in their own frames) so the
  // docs page's Controls table can change them; an open drawer then covers the
  // page, as it would in an app.
  args: { ...controlArgs('wa-drawer', ATTRS), label: data.label },
  parameters: {
    docs: {
      // "Show code" shows the real <wa-drawer> markup for the current controls.
      source: {
        language: 'html',
        transform: (_code: string, { args, parameters }: { args: Record<string, unknown>; parameters: { headerActions?: boolean } }) =>
          waSource('wa-drawer', args, ATTRS, drawerContent(Boolean(parameters.headerActions))),
      },
    },
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  // Stories turn on header actions with `parameters: { headerActions: true }`,
  // so the flag never reaches <wa-drawer> as an attribute.
  render: (args, { parameters }) => ({
    setup() {
      // The drawer can close itself (Escape, close button, data-drawer="close",
      // light dismiss), so keep a local `open` that follows both the control
      // and the drawer's own wa-after-hide event.
      const open = ref(Boolean(args.open));
      watch(() => args.open, (value) => (open.value = Boolean(value)));
      // Actions panel: every event wa-drawer fires (from Web Awesome's manifest),
      // plus clicks on the demo's header and footer buttons. Only the drawer's own
      // events are logged, not the same events bubbling up from elements inside it.
      const drawerEvents = Object.fromEntries(
        waEventNames('wa-drawer').map((name) => [name, (e: Event) => e.target === e.currentTarget && action(name)(e)]),
      );
      const onHeaderAction = (label: string) => action('header-action')(label);
      const onFooterAction = (text: string) => action('footer-action')(text);
      return {
        args,
        open,
        data,
        headerActions: parameters.headerActions ? data.headerActions : [],
        drawerEvents,
        onHeaderAction,
        onFooterAction,
      };
    },
    // Booleans are bound as `x || undefined`: before the CDN script has upgraded
    // <wa-drawer>, Vue writes attributes, and a `false` would become
    // open="false", which still counts as present (open).
    // `open` is cleared on wa-after-hide, when the drawer has finished closing.
    // (Not wa-hide: Web Awesome sets open=false itself when its close animation
    // ends, so clearing `open` earlier lets the two disagree and the trigger stops
    // working.) `.self` ignores the event bubbling up from a tooltip or dropdown inside.
    template: `
      <div style="padding: var(--wa-space-l)">
        <wa-button variant="brand" @click="open = true">{{ data.trigger }}</wa-button>
        <wa-drawer
          :open="open || undefined"
          :label="args.label"
          :placement="args.placement"
          :light-dismiss="args['light-dismiss'] || undefined"
          :without-header="args['without-header'] || undefined"
          v-on="drawerEvents"
          @wa-after-hide.self="open = false"
        >
          <wa-button
            v-for="item in headerActions"
            :key="item.icon"
            slot="header-actions"
            appearance="plain"
            @click="onHeaderAction(item.label)"
          ><wa-icon :name="item.icon" :label="item.label"></wa-icon></wa-button>

          <p v-for="line in data.body" :key="line">{{ line }}</p>

          <div slot="footer" style="display: flex; gap: var(--wa-space-s); justify-content: end">
            <wa-button
              v-for="a in data.actions"
              :key="a.text"
              :appearance="a.appearance"
              :variant="a.variant"
              data-drawer="close"
              @click="onFooterAction(a.text)"
            >{{ a.text }}</wa-button>
          </div>
        </wa-drawer>
      </div>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Start: Story = { args: { placement: 'start' } };

export const HeaderActions: Story = { parameters: { headerActions: true } };
