import { html, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { AxElement } from '../../internal/ax-element.js';
import styles from './ax-control-info.styles.js';

let uid = 0;

/**
 * Web Awesome form controls render their real <input> inside their own shadow
 * DOM, where an outside <label for> or aria-describedby can't reach it. For
 * these, the label and info text go through WA's public API instead (the
 * `label` property or the label slot, and the `hint` property), and
 * theme/src/parts.css visually hides WA's copy using its documented parts.
 * Keep these lists in sync with parts.css (a unit test checks it).
 */
export const WA_LABEL_PROPERTY = [
  'wa-checkbox-group',
  'wa-color-picker',
  'wa-input',
  'wa-number-input',
  'wa-radio-group',
  'wa-select',
  'wa-tag-input',
  'wa-textarea',
  'wa-time-input',
] as const;
export const WA_LABEL_SLOT = ['wa-checkbox', 'wa-switch'] as const;

type WaControl = HTMLElement & { label?: string; hint?: string };

/**
 * Molecule: a label and help text ("info") for any form control, shown
 * either under the label or behind an info button with a tooltip.
 *
 * The label, info and control all stay in the page's own DOM (slots). On
 * every slot change the component fills in only what's missing, and leaves
 * anything you set yourself alone:
 *   - an `id` on the control, and `for` on a slotted `<label>`
 *   - native controls: the info element's `id` in `aria-describedby`
 *   - Web Awesome controls: the label and info text through WA's own `label`
 *     and `hint` API (see WA_LABEL_PROPERTY above). An outside label can't
 *     name or describe the input inside WA's shadow DOM.
 *   - the required marker, when the control has `required`
 *
 * @tag ax-control-info
 * @slot label - The control's label. Use a `<label>` so clicking it focuses the control.
 * @slot info - Help text describing the control.
 * @slot - The control itself (`wa-input`, `wa-switch`, a native `<select>`, ...).
 * @csspart base - The wrapper around everything.
 * @csspart label-row - The row holding the label, required marker and info button.
 * @csspart info - The inline help text container (inline mode only).
 * @csspart info-trigger - The info button (tooltip mode only).
 * @csspart control - The container around the slotted control.
 * @cssproperty --ax-control-info-label-basis - Horizontal layout: preferred width of the label column before wrapping.
 * @cssproperty --ax-control-info-control-basis - Horizontal layout: preferred width of the control column before wrapping.
 */
export class AxControlInfo extends AxElement {
  static override waDependencies = ['wa-icon', 'wa-tooltip'] as const;
  static override styles = [AxElement.hostStyles, styles];

  static override properties = {
    infoDisplay: { type: String, attribute: 'info-display', reflect: true },
    layout: { type: String, reflect: true },
    infoLabel: { type: String, attribute: 'info-label' },
  };

  /** Show the info text under the label, or behind an info button. */
  infoDisplay: 'inline' | 'tooltip' = 'inline';
  /** Stack label above the control, or place them side by side (settings rows). */
  layout: 'vertical' | 'horizontal' = 'vertical';
  /** Accessible name of the info button in tooltip mode. */
  infoLabel = 'More information';

  readonly #id = `ax-control-info-${++uid}`;

  get labelElement() {
    return this.querySelector<HTMLElement>(':scope > [slot="label"]');
  }

  get infoElement() {
    return this.querySelector<HTMLElement>(':scope > [slot="info"]');
  }

  get control() {
    return this.querySelector<HTMLElement>(':scope > :not([slot])');
  }

  override connectedCallback() {
    super.connectedCallback();
    this.wire();
  }

  override updated() {
    this.wire();
  }

  /** Fill in missing ids and ARIA links between label, info and control. */
  wire = () => {
    const control = this.control;
    const label = this.labelElement;
    const info = this.infoElement;
    if (!control) return;

    if (!control.id) control.id = `${this.#id}-control`;
    if (label instanceof HTMLLabelElement && !label.htmlFor) label.htmlFor = control.id;
    if (info && !info.id) info.id = `${this.#id}-info`;

    if (control.localName.startsWith('wa-')) {
      this.#wireWebAwesome(control as WaControl, label, info);
    } else if (info) {
      const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      if (!ids.includes(info.id)) control.setAttribute('aria-describedby', [...ids, info.id].join(' '));
    }

    this.toggleAttribute('data-required', control.hasAttribute('required'));
  };

  #wireWebAwesome(control: WaControl, label: HTMLElement | null, info: HTMLElement | null) {
    const tag = control.localName;
    const labelText = label?.textContent?.trim() ?? '';
    const infoText = info?.textContent?.trim() ?? '';
    const proxied = (attr: string) => control.hasAttribute(attr);

    // Label: only if the control has none of its own (or it's ours from a previous run).
    if (labelText && (WA_LABEL_PROPERTY as readonly string[]).includes(tag)) {
      if (!control.label || proxied('data-ax-proxy-label')) {
        control.label = labelText;
        control.setAttribute('data-ax-proxy-label', '');
      }
    } else if (labelText && (WA_LABEL_SLOT as readonly string[]).includes(tag)) {
      let proxy = control.querySelector<HTMLElement>(':scope > [data-ax-label]');
      const hasOwnLabel = [...control.childNodes].some(
        (n) => n !== proxy && !(n instanceof Element && n.hasAttribute('slot')) && n.textContent?.trim(),
      );
      if (!hasOwnLabel) {
        if (!proxy) {
          proxy = document.createElement('span');
          proxy.setAttribute('data-ax-label', '');
          control.append(proxy);
        }
        proxy.textContent = labelText;
        control.setAttribute('data-ax-proxy-label', '');
      }
    }

    // Info: through `hint`, which WA wires to its inner input's aria-describedby.
    if (infoText && 'hint' in control && (!control.hint || proxied('data-ax-proxy-hint'))) {
      control.hint = infoText;
      control.setAttribute('data-ax-proxy-hint', '');
      // Inline mode shows the info text visibly AND (hidden) inside the control;
      // hide ours from assistive tech so it isn't read twice.
      // (aria-hidden must be "true": an empty value counts as not hidden.)
      if (info && this.infoDisplay === 'inline') info.setAttribute('aria-hidden', 'true');
      else info?.removeAttribute('aria-hidden');
    }
  }

  override render() {
    const tooltip = this.infoDisplay === 'tooltip';
    const triggerId = `${this.#id}-trigger`;
    return html`
      <div class="base" part="base">
        <div class="text">
          <div class="label-row" part="label-row">
            <slot name="label" @slotchange=${this.wire}></slot>
            <span class="required" aria-hidden="true"></span>
            ${tooltip
              ? html`<button id=${triggerId} class="info-trigger" part="info-trigger" type="button" aria-label=${this.infoLabel}>
                    <wa-icon name="circle-info"></wa-icon>
                  </button>
                  <wa-tooltip for=${triggerId}><slot name="info" @slotchange=${this.wire}></slot></wa-tooltip>`
              : nothing}
          </div>
          ${tooltip ? nothing : html`<div class="info" part="info"><slot name="info" @slotchange=${this.wire}></slot></div>`}
        </div>
        <div class="control" part="control"><slot @slotchange=${this.wire}></slot></div>
      </div>
    `;
  }
}

AxControlInfo.define('ax-control-info');

declare global {
  interface HTMLElementTagNameMap {
    'ax-control-info': AxControlInfo;
  }
}
