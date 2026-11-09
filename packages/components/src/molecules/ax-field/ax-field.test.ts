import { afterEach, describe, expect, it } from 'vitest';
import './ax-field.js';
import type { AxField } from './ax-field.js';

async function mount(markup: string) {
  document.body.innerHTML = markup;
  const el = document.body.querySelector('ax-field') as AxField;
  await el.updateComplete;
  return el;
}

const input = (el: AxField) => el.shadowRoot!.querySelector('wa-input') as HTMLElement & { hint: string };

describe('ax-field', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('passes label and hint through to wa-input', async () => {
    const el = await mount(`<ax-field label="Email" hint="Work address"></ax-field>`);
    expect((input(el) as unknown as { label: string }).label).toBe('Email');
    expect(input(el).hint).toBe('Work address');
  });

  it('does not show a required error until the field is touched', async () => {
    const el = await mount(`<ax-field label="Name" required></ax-field>`);
    expect(el.validationMessage).toBe('This field is required.');
    expect(input(el).hint).toBe('');
    expect(el.hasAttribute('data-invalid')).toBe(false);

    input(el).dispatchEvent(new Event('blur'));
    await el.updateComplete;
    expect(input(el).hint).toBe('This field is required.');
    expect(el.hasAttribute('data-invalid')).toBe(true);
  });

  it('a custom error wins over built-in validation', async () => {
    const el = await mount(`<ax-field required error="Already taken"></ax-field>`);
    expect(el.validationMessage).toBe('Already taken');
  });

  it('renders a live character count', async () => {
    const el = await mount(`<ax-field maxlength="5" show-count></ax-field>`);
    el.value = 'abcdef';
    await el.updateComplete;
    const count = el.shadowRoot!.querySelector('.count')!;
    expect(count.textContent).toBe('6/5');
    expect(count.classList.contains('over')).toBe(true);
    expect(el.validationMessage).toMatch(/5 characters/);
  });

  it('emits ax-change when the value is committed', async () => {
    const el = await mount(`<ax-field></ax-field>`);
    el.value = 'hello';
    let detail: unknown;
    el.addEventListener('ax-change', (e) => (detail = (e as CustomEvent).detail));
    input(el).dispatchEvent(new Event('blur'));
    expect(detail).toEqual({ value: 'hello' });
  });
});
