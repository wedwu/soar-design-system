import { html, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/input/input.js';
import { AxElement } from '../../internal/ax-element.js';
import styles from './ax-field.styles.js';

/**
 * Molecule: a text field with Soar's validation pattern. Wraps <wa-input>
 * and adds what WA doesn't do: an error message that appears after the user
 * leaves the field (not while typing), a live character counter, and
 * participation in the *outer* form (a wa-input inside our shadow root is
 * invisible to the page's <form>, so ax-field is form-associated itself).
 * The error renders through wa-input's own hint, so WA's aria-describedby
 * wiring announces it.
 *
 * @tag ax-field
 * @csspart base - The wrapper around the input and the meta row.
 * @event ax-change - Value committed (blur or Enter). detail: { value }
 */
export class AxField extends AxElement {
  static override waDependencies = ['wa-input'] as const;
  static override styles = [AxElement.hostStyles, styles];
  static formAssociated = true;

  static override properties = {
    label: { type: String },
    hint: { type: String },
    name: { type: String, reflect: true },
    value: { type: String },
    type: { type: String },
    placeholder: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    maxlength: { type: Number },
    showCount: { type: Boolean, attribute: 'show-count' },
    error: { type: String },
    requiredMessage: { type: String, attribute: 'required-message' },
    touched: { state: true },
  };

  /** The field's label, shown above the input. */
  label = '';
  /** Help text under the input. Replaced by the error message when the field is invalid. */
  hint = '';
  /** Name submitted with the form. */
  name = '';
  /** The current value. */
  value = '';
  /** The kind of text the field accepts. */
  type: 'text' | 'email' | 'tel' | 'url' | 'search' | 'password' = 'text';
  /** Example text shown while the field is empty. */
  placeholder = '';
  /** The field must have a value before the form submits. */
  required = false;
  /** The field can't be edited or focused, and isn't submitted. */
  disabled = false;
  /** Maximum number of characters. Longer values are invalid. */
  maxlength?: number;
  /** Show a live character count (needs `maxlength`). */
  showCount = false;
  /** Server-side or custom error. Takes precedence over built-in validation. */
  error = '';
  /** Error shown when a required field is empty. */
  requiredMessage = 'This field is required.';
  protected touched = false;

  readonly #internals: ElementInternals | undefined;

  constructor() {
    super();
    this.#internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
    this.addEventListener('invalid', () => {
      this.touched = true; // form submit attempted: reveal errors
    });
  }

  get validationMessage() {
    if (this.error) return this.error;
    if (this.required && !this.value) return this.requiredMessage;
    if (this.maxlength !== undefined && this.value.length > this.maxlength) {
      return `Use ${this.maxlength} characters or fewer.`;
    }
    return '';
  }

  checkValidity() {
    return this.#internals?.checkValidity() ?? !this.validationMessage;
  }

  reportValidity() {
    this.touched = true;
    return this.#internals?.reportValidity() ?? !this.validationMessage;
  }

  formResetCallback() {
    this.value = '';
    this.touched = false;
  }

  override willUpdate() {
    if (!this.#internals) return;
    this.#internals.setFormValue(this.value);
    const message = this.validationMessage;
    const flags: ValidityStateFlags = this.error
      ? { customError: true }
      : this.required && !this.value
        ? { valueMissing: true }
        : message
          ? { tooLong: true }
          : {};
    this.#internals.setValidity(flags, message);
  }

  override updated() {
    this.toggleAttribute('data-invalid', this.touched && !!this.validationMessage);
  }

  #onInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value ?? '';
  }

  #commit = () => {
    this.touched = true;
    this.emit('ax-change', { value: this.value });
  };

  override render() {
    const message = this.touched ? this.validationMessage : '';
    const count = this.value.length;
    const over = this.maxlength !== undefined && count > this.maxlength;

    return html`
      <div class="field" part="base">
        <wa-input
          .label=${this.label}
          .hint=${message || this.hint}
          .value=${this.value}
          .type=${this.type}
          .placeholder=${this.placeholder}
          ?required=${this.required}
          ?disabled=${this.disabled}
          @input=${this.#onInput}
          @blur=${this.#commit}
          @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.#commit()}
        ></wa-input>
        ${this.showCount && this.maxlength !== undefined
          ? html`<div class="meta">
              <span class="count ${over ? 'over' : ''}" aria-live="polite">${count}/${this.maxlength}</span>
            </div>`
          : nothing}
      </div>
    `;
  }
}

AxField.define('ax-field');

declare global {
  interface HTMLElementTagNameMap {
    'ax-field': AxField;
  }
}
