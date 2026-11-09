import { LitElement, css } from 'lit';

/**
 * Base class for every Soar molecule and organism.
 *
 * We compose Web Awesome elements; we never subclass them. WA's element
 * classes and internals are not a public extension API, and subclassing would
 * tie every Soar component to WA's private implementation across releases.
 */
export abstract class AxElement extends LitElement {
  /**
   * WA tags this component renders. Must match the WA component modules the
   * file imports and the <wa-*> tags in its templates (checked by `npm run check:ownership`).
   * The CDN autoloader uses this list because WA isn't inlined there.
   */
  static waDependencies: readonly string[] = [];

  static define(tag: string) {
    if (!customElements.get(tag)) customElements.define(tag, this as unknown as CustomElementConstructor);
  }

  /** Shared host styles. Visual values come from tokens only. */
  static hostStyles = css`
    :host {
      box-sizing: border-box;
      font-family: var(--wa-font-family-body);
      color: var(--wa-color-text-normal);
    }
    :host([hidden]) {
      display: none !important;
    }
    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }
  `;

  protected emit<T>(name: `ax-${string}`, detail?: T) {
    return this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true }));
  }
}
