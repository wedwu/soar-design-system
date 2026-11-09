// Docs-only widget: an "Updated" / "Not updated" badge for docs pages.
// Not shipped; shared by both Storybooks, so it imports nothing. The page
// supplies <wa-badge>: from npm in the main Storybook, from the CDN in the Vue one.
//
//   <ax-docs-updated status="updated"></ax-docs-updated>      → success badge
//   <ax-docs-updated status="not updated"></ax-docs-updated>  → danger badge
//
// Custom properties, set on the element or any ancestor:
//   --ax-docs-updated-color       badge fill (default: the variant's loud fill)
//   --ax-docs-updated-text-color  text and dot (default: the variant's on-loud color)
//   --ax-docs-updated-font-size   (default: var(--wa-font-size-2xs))

export type UpdatedStatus = 'updated' | 'not updated';

const VARIANTS: Record<UpdatedStatus, { variant: string; text: string }> = {
  updated: { variant: 'success', text: 'Updated' },
  'not updated': { variant: 'danger', text: 'Not updated' },
};

// Added to the page once. The badge sits in light DOM, so page CSS reaches it;
// the variables fall back to the colors Web Awesome sets for its variant.
const STYLE_ID = 'ax-docs-updated-styles';
const CSS = `
  ax-docs-updated {
    display: inline-block;
    vertical-align: middle;
  }
  ax-docs-updated wa-badge {
    font-size: var(--ax-docs-updated-font-size, var(--wa-font-size-2xs));
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ax-docs-updated-text-color, var(--wa-color-on-loud));
    background-color: var(--ax-docs-updated-color, var(--wa-color-fill-loud));
    border-radius: var(--wa-border-radius-pill);
  }
  ax-docs-updated .dot {
    display: inline-block;
    width: 0.5em;
    height: 0.5em;
    margin-inline-end: 0.4em;
    border-radius: 50%;
    background-color: currentColor;
  }
`;

function addStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}

export class AxDocsUpdated extends HTMLElement {
  static observedAttributes = ['status'];

  /** "updated" or "not updated" ("not-updated" works too). Anything else counts as not updated. */
  get status(): UpdatedStatus {
    const value = (this.getAttribute('status') ?? '').trim().toLowerCase().replace('-', ' ');
    return value === 'updated' ? 'updated' : 'not updated';
  }

  set status(value: string) {
    this.setAttribute('status', value);
  }

  connectedCallback() {
    addStyles(this.ownerDocument);
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  // Light DOM, so the badge picks up the Soar theme like any other wa-badge.
  #render() {
    if (!this.isConnected) return;
    const { variant, text } = VARIANTS[this.status];
    let badge = this.querySelector('wa-badge');
    if (!badge) {
      badge = this.ownerDocument.createElement('wa-badge');
      this.replaceChildren(badge);
    }
    badge.setAttribute('variant', variant);
    const dot = this.ownerDocument.createElement('span');
    dot.className = 'dot';
    dot.setAttribute('aria-hidden', 'true');
    badge.replaceChildren(dot, text);
  }
}

if (!customElements.get('ax-docs-updated')) customElements.define('ax-docs-updated', AxDocsUpdated);
