import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { expect, waitFor } from 'storybook/test';

const meta: Meta = {
  title: 'Molecules/Field',
  tags: ['autodocs'],
  component: 'ax-field',
  args: {
    label: 'Display name',
    hint: 'Visible to your team',
    required: true,
    maxlength: 24,
    'show-count': true,
  },
  render: (args) => html`<ax-field
    style="max-width: 24rem"
    label=${args.label}
    hint=${args.hint}
    ?required=${args.required}
    maxlength=${args.maxlength}
    ?show-count=${args['show-count']}
    error=${args.error ?? ''}
  ></ax-field>`,
};
export default meta;

export const Default: StoryObj = {};

export const ServerError: StoryObj = {
  args: { error: 'That name is already taken.' },
};

export const InAForm: StoryObj = {
  render: () => html`<form
    style="display: grid; gap: var(--wa-space-m); max-width: 24rem"
    @submit=${(e: SubmitEvent) => {
      e.preventDefault();
      const out = (e.target as HTMLFormElement).querySelector('output')!;
      out.textContent = JSON.stringify(Object.fromEntries(new FormData(e.target as HTMLFormElement)));
    }}
  >
    <ax-field name="email" type="email" label="Email" required></ax-field>
    <ax-field name="company" label="Company" maxlength="40" show-count></ax-field>
    <wa-button type="submit" variant="brand">Create account</wa-button>
    <output></output>
  </form>`,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const email = form.querySelector('ax-field') as HTMLElement & { value: string; updateComplete: Promise<unknown> };
    await expect((email as unknown as HTMLObjectElement).checkValidity()).toBe(false);
    email.value = 'ada@example.com';
    await email.updateComplete;
    // What we own is form association: the outer <form> must see ax-field's value.
    form.requestSubmit();
    await waitFor(() => expect(form.querySelector('output')!.textContent).toContain('ada@example.com'));
  },
};
