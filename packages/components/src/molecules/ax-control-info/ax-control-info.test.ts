import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './ax-control-info.js';
import { WA_LABEL_PROPERTY, WA_LABEL_SLOT, type AxControlInfo } from './ax-control-info.js';

// Web Awesome is stubbed in unit tests (see vitest.config.ts). These stand-ins
// expose the same public label/hint properties the real controls do.
class FakeWaInput extends HTMLElement {
  label = '';
  hint = '';
}
class FakeWaSwitch extends HTMLElement {
  hint = '';
}
if (!customElements.get('wa-input')) customElements.define('wa-input', FakeWaInput);
if (!customElements.get('wa-switch')) customElements.define('wa-switch', FakeWaSwitch);

async function mount(markup: string) {
  document.body.innerHTML = markup;
  const el = document.body.querySelector('ax-control-info') as AxControlInfo;
  await el.updateComplete;
  el.wire(); // slotchange doesn't fire in happy-dom
  return el;
}

describe('ax-control-info', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('links the label and info text to the control', async () => {
    const el = await mount(`<ax-control-info>
      <label slot="label">Seats</label>
      <span slot="info">Billed per active user.</span>
      <input type="number" />
    </ax-control-info>`);
    const label = el.querySelector('label')!;
    const info = el.querySelector('[slot="info"]')!;
    const control = el.querySelector('input')!;
    expect(control.id).toMatch(/^ax-control-info-\d+-control$/);
    expect(label.htmlFor).toBe(control.id);
    expect(control.getAttribute('aria-describedby')).toBe(info.id);
  });

  it('keeps ids and links you set yourself, and appends to aria-describedby', async () => {
    const el = await mount(`<ax-control-info>
      <label slot="label" for="mine">Name</label>
      <span slot="info" id="name-help">Shown on invoices.</span>
      <input id="mine" aria-describedby="other-help" />
    </ax-control-info>`);
    const control = el.querySelector('input')!;
    expect(control.id).toBe('mine');
    expect(el.querySelector('label')!.htmlFor).toBe('mine');
    expect(control.getAttribute('aria-describedby')).toBe('other-help name-help');
    el.wire();
    expect(control.getAttribute('aria-describedby')).toBe('other-help name-help'); // no duplicates
  });

  it('shows the required marker when the control is required', async () => {
    const el = await mount(`<ax-control-info><label slot="label">Email</label><input required /></ax-control-info>`);
    expect(el.hasAttribute('data-required')).toBe(true);
    el.querySelector('input')!.removeAttribute('required');
    el.wire();
    expect(el.hasAttribute('data-required')).toBe(false);
  });

  it('inline mode renders the info slot under the label', async () => {
    const el = await mount(`<ax-control-info><label slot="label">A</label><span slot="info">Help</span><input /></ax-control-info>`);
    expect(el.shadowRoot!.querySelector('[part="info"] slot[name="info"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('wa-tooltip')).toBeNull();
  });

  it('tooltip mode puts the info slot in a tooltip behind a labelled button', async () => {
    const el = await mount(`<ax-control-info info-display="tooltip" info-label="About seats">
      <label slot="label">Seats</label><span slot="info">Help</span><input />
    </ax-control-info>`);
    const trigger = el.shadowRoot!.querySelector('[part="info-trigger"]')!;
    const tooltip = el.shadowRoot!.querySelector('wa-tooltip')!;
    expect(trigger.getAttribute('aria-label')).toBe('About seats');
    expect(tooltip.getAttribute('for')).toBe(trigger.id);
    expect(tooltip.querySelector('slot[name="info"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[part="info"]')).toBeNull();
  });

  it('reflects layout for styling', async () => {
    const el = await mount(`<ax-control-info layout="horizontal"><label slot="label">Dark mode</label><input type="checkbox" /></ax-control-info>`);
    expect(el.getAttribute('layout')).toBe('horizontal');
  });

  describe('Web Awesome controls', () => {
    it('passes label and info through the control\'s own label/hint API', async () => {
      const el = await mount(`<ax-control-info>
        <label slot="label">Seats</label><span slot="info">Billed per user.</span><wa-input></wa-input>
      </ax-control-info>`);
      const control = el.querySelector('wa-input') as FakeWaInput;
      expect(control.label).toBe('Seats');
      expect(control.hint).toBe('Billed per user.');
      expect(control.hasAttribute('data-ax-proxy-label')).toBe(true);
      expect(control.hasAttribute('data-ax-proxy-hint')).toBe(true);
      // aria-describedby on the host can't reach WA's inner input, so it isn't set
      expect(control.hasAttribute('aria-describedby')).toBe(false);
      // inline mode: the visible info is hidden from AT so it isn't read twice
      expect(el.querySelector('[slot="info"]')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('never overwrites a label or hint you set on the control', async () => {
      const el = await mount(`<ax-control-info>
        <label slot="label">Seats</label><span slot="info">Info</span><wa-input label="Mine" hint="My hint"></wa-input>
      </ax-control-info>`);
      const control = el.querySelector('wa-input') as FakeWaInput;
      control.label = 'Mine';
      control.hint = 'My hint';
      control.removeAttribute('data-ax-proxy-label');
      control.removeAttribute('data-ax-proxy-hint');
      el.wire();
      expect(control.label).toBe('Mine');
      expect(control.hint).toBe('My hint');
      expect(control.hasAttribute('data-ax-proxy-label')).toBe(false);
    });

    it('labels slot-labelled controls (wa-switch) with a proxy text node', async () => {
      const el = await mount(`<ax-control-info layout="horizontal">
        <label slot="label">Two-factor authentication</label><wa-switch></wa-switch>
      </ax-control-info>`);
      const control = el.querySelector('wa-switch')!;
      expect(control.querySelector('[data-ax-label]')!.textContent).toBe('Two-factor authentication');
      el.wire();
      expect(control.querySelectorAll('[data-ax-label]').length).toBe(1); // idempotent
    });

    it('leaves a slot-labelled control alone when it has its own text', async () => {
      const el = await mount(`<ax-control-info><label slot="label">X</label><wa-switch>Own label</wa-switch></ax-control-info>`);
      expect(el.querySelector('wa-switch')!.querySelector('[data-ax-label]')).toBeNull();
    });

    it('tooltip mode keeps the info visible to AT (it names the info button)', async () => {
      const el = await mount(`<ax-control-info info-display="tooltip">
        <label slot="label">Seats</label><span slot="info">Billed per user.</span><wa-input></wa-input>
      </ax-control-info>`);
      expect(el.querySelector('[slot="info"]')!.hasAttribute('aria-hidden')).toBe(false);
    });

    it('every proxied tag has a matching rule in theme parts.css', () => {
      // Vitest runs from packages/components (import.meta.url isn't a file URL under happy-dom).
      const css = readFileSync(resolve(process.cwd(), '../theme/src/parts.css'), 'utf8');
      for (const tag of WA_LABEL_PROPERTY) {
        expect(css).toContain(`${tag}[data-ax-proxy-label]::part(form-control-label)`);
        expect(css).toContain(`${tag}[data-ax-proxy-hint]::part(hint)`);
      }
      for (const tag of WA_LABEL_SLOT) {
        expect(css).toContain(`${tag}[data-ax-proxy-label]::part(label)`);
        expect(css).toContain(`${tag}[data-ax-proxy-hint]::part(hint)`);
      }
    });
  });
});
