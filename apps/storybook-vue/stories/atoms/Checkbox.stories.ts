// wa-checkbox in Vue, loaded from the CDN. The pieces live side by side:
//   Checkbox.data.json  the example content
//   Checkbox.mdx        the docs page
// The templates use <wa-checkbox> directly, exactly as a CDN page would.
// Nothing here imports Web Awesome or Soar: the CDN <script> tags in
// .storybook/main.ts register the elements.

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { computed, nextTick, ref, watch } from 'vue';
import { type Args, controlArgs, hideControls, withControls } from '../../src/controls';
import { designTabs } from '../../src/design';
import { waArgTypes, waAttrs, waEventNames, waSource } from '../../../storybook/src/wa';
import data from './Checkbox.data.json';

const ATTRS = ['checked', 'indeterminate', 'disabled', 'required', 'size', 'hint', 'name', 'value'];

/** Actions panel: the checkbox's events (from Web Awesome's manifest), with its state. */
const checkboxEvents = () =>
  Object.fromEntries(
    waEventNames('wa-checkbox').map((name) => [
      name,
      (e: Event) => {
        const el = e.currentTarget as HTMLInputElement;
        action(name)({ checked: el.checked, indeterminate: el.indeterminate });
      },
    ]),
  );

/**
 * Error styling. Web Awesome doesn't style invalid checkboxes, so this colors
 * the box and label red once the error has been shown (a submit, or
 * reportValidity()). It's added for the Error story; an app would put the same
 * rule in its stylesheet.
 */
const ERROR_CSS = `wa-checkbox:state(user-invalid)::part(control) {
  border-color: var(--wa-color-danger-border-loud);
}
wa-checkbox:state(user-invalid) {
  color: var(--wa-color-danger-on-quiet);
}`;
if (!document.getElementById('checkbox-error-css')) {
  document.head.append(Object.assign(document.createElement('style'), { id: 'checkbox-error-css', textContent: ERROR_CSS }));
}

const meta = {
  title: 'Atoms/Checkbox',
  // No `component`: wa-checkbox is a custom element, not a Vue component.
  // No 'autodocs': Checkbox.mdx is the docs page.
  tags: ['upstream'],
  // Controls come from Web Awesome's manifest on the CDN, plus `text` for the
  // label, which is the checkbox's content rather than an attribute.
  argTypes: {
    ...waArgTypes('wa-checkbox', ATTRS),
    text: { control: 'text', description: 'The label (the checkbox\'s content).', table: { category: 'story' } },
  },
  args: { ...controlArgs('wa-checkbox', ATTRS), text: data.text },
  parameters: {
    // Design tab: the Figma frame (when configured) and Web Awesome's docs.
    design: designTabs(data.design),
  },
  render: (args) => {
    // Clicking the checkbox updates the checked/indeterminate controls too.
    const [, updateArgs] = useArgs();
    return {
      setup() {
        const attrs = computed(() => waAttrs(args, ATTRS));
        const events = checkboxEvents();
        const onChange = (e: Event) => {
          const el = e.currentTarget as HTMLInputElement;
          updateArgs({ checked: el.checked, indeterminate: el.indeterminate });
        };
        return { args, attrs, events, onChange };
      },
      template: `<wa-checkbox v-bind="attrs" v-on="events" @change="onChange">{{ args.text }}</wa-checkbox>`,
    };
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Each story's "Show code" shows the real <wa-checkbox> markup. Without it,
// Storybook would invent a Vue component name from the title (<Checkbox .../>).

/** "Show code" for one checkbox, following the controls. */
const followControls = { language: 'html', transform: (_code: string, { args }: { args: Args }) => waSource('wa-checkbox', args, ATTRS, String(args.text ?? '')) };

export const Playground: Story = {
  parameters: { docs: { source: followControls } },
};

/** The states, each with the remaining controls (size, hint, required...) applied. */
const stateArgs = (args: Args) => withControls(args, data.states);

export const States: Story = {
  argTypes: hideControls('checked', 'indeterminate', 'disabled', 'text'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: Args }) => stateArgs(args).map((s) => waSource('wa-checkbox', s, ATTRS, s.text)).join('\n'),
      },
    },
  },
  render: (args) => ({
    setup() {
      const states = computed(() => stateArgs(args).map((s) => ({ text: s.text, attrs: waAttrs(s, ATTRS) })));
      return { states, events: checkboxEvents() };
    },
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <wa-checkbox v-for="s in states" :key="s.text" v-bind="s.attrs" v-on="events">{{ s.text }}</wa-checkbox>
      </div>`,
  }),
};

// Uses the Playground render, so every control works; it just starts with a hint.
export const WithHint: Story = {
  name: 'With hint',
  args: { hint: data.hint },
  parameters: { docs: { source: followControls } },
};

/** The sizes, each with the remaining controls applied; the label is the size. */
const sizeArgs = (args: Args) => data.sizes.map((size) => ({ ...args, size, text: size }));

export const Sizes: Story = {
  argTypes: hideControls('size', 'text'),
  args: { checked: true },
  parameters: {
    docs: {
      source: {
        language: 'html',
        // size is written out in full: waSource would drop size="m", Web Awesome's default.
        transform: (_code: string, { args }: { args: Args }) =>
          sizeArgs(args)
            .map((s) => waSource('wa-checkbox', s, ATTRS.filter((name) => name !== 'size'), s.text).replace('<wa-checkbox', `<wa-checkbox size="${s.size}"`))
            .join('\n'),
      },
    },
  },
  render: (args) => ({
    setup() {
      const sizes = computed(() => sizeArgs(args).map((s) => ({ size: s.size, attrs: waAttrs(s, ATTRS) })));
      return { sizes, events: checkboxEvents() };
    },
    template: `
      <div style="display: grid; gap: var(--wa-space-s)">
        <wa-checkbox v-for="s in sizes" :key="s.size" v-bind="s.attrs" v-on="events">{{ s.size }}</wa-checkbox>
      </div>`,
  }),
};

/** The Error story adds `custom-error`, the message that makes the checkbox invalid. */
const ERROR_ATTRS = [...ATTRS, 'custom-error'];

export const ErrorState: Story = {
  name: 'Error',
  argTypes: {
    ...waArgTypes('wa-checkbox', ['custom-error']),
    showError: {
      control: 'boolean',
      description: 'Shows the error now, as a submit would (calls `reportValidity()`). Pressing **Continue** does the same.',
      table: { category: 'story' },
    },
  },
  args: { text: data.error.text, name: 'terms', required: true, 'custom-error': data.error.message, showError: false },
  parameters: {
    docs: {
      source: {
        language: 'html',
        // Follows the controls.
        transform: (_code: string, { args }: { args: Record<string, unknown> }) => `<form>
  ${waSource('wa-checkbox', args, ERROR_ATTRS, String(args.text ?? ''))}
  <wa-button type="submit">${data.error.submit}</wa-button>
</form>

<style>
${ERROR_CSS}
</style>`,
      },
    },
  },
  render: (args: Record<string, unknown>) => {
    const [, updateArgs] = useArgs();
    return {
    setup() {
      const el = ref<HTMLInputElement & { reportValidity(): boolean }>();
      const status = ref('');
      // Checking the box clears the error; unchecking it brings it back.
      const attrs = computed(() =>
        waAttrs({ ...args, 'custom-error': args.checked ? '' : args['custom-error'] }, ERROR_ATTRS),
      );

      // "showError" control: show the error whenever it's on and the controls change.
      watch(
        () => [args.showError, attrs.value],
        async () => {
          if (!args.showError) return;
          await nextTick();
          await customElements.whenDefined('wa-checkbox');
          await (el.value as unknown as { updateComplete?: Promise<unknown> })?.updateComplete;
          if (el.value && !el.value.reportValidity()) return;
          status.value = '';
        },
        { immediate: true },
      );

      const onChange = (e: Event) => {
        const checked = (e.currentTarget as HTMLInputElement).checked;
        updateArgs({ checked });
        action('change')({ checked });
      };
      const onInvalid = (e: Event) => {
        status.value = (e.currentTarget as HTMLInputElement).validationMessage;
        action('wa-invalid')({ message: status.value });
      };
      const onSubmit = () => {
        status.value = 'Submitted.';
        action('submit')();
      };
      return { args, attrs, el, data, status, onChange, onInvalid, onSubmit };
    },
    template: `
      <form style="display: grid; gap: var(--wa-space-m); justify-items: start" @submit.prevent="onSubmit">
        <wa-checkbox ref="el" v-bind="attrs" @change="onChange" @wa-invalid="onInvalid">{{ args.text }}</wa-checkbox>
        <wa-button type="submit">{{ data.error.submit }}</wa-button>
        <p role="status" style="margin: 0">{{ status }}</p>
      </form>`,
    };
  },
};
