// Docs-only widget: shows which Soar breakpoints match right now.
// Not shipped; lives in Storybook to make the Breakpoints page interactive.
import { LitElement, css, html } from 'lit';
import { breakpoints, media } from '@soar-awesome/tokens';
import '@awesome.me/webawesome/dist/components/badge/badge.js';

type Bp = keyof typeof media;

export class AxDocsBreakpointMeter extends LitElement {
  static override properties = { width: { state: true }, active: { state: true } };

  width = 0;
  active = new Set<Bp>();
  #queries: { bp: Bp; mql: MediaQueryList }[] = [];
  #update = () => {
    this.width = this.ownerDocument.documentElement.clientWidth;
    this.active = new Set(this.#queries.filter((q) => q.mql.matches).map((q) => q.bp));
  };

  static override styles = css`
    :host {
      display: block;
      font-family: var(--wa-font-family-body);
      color: var(--wa-color-text-normal);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--wa-font-size-s);
    }
    th,
    td {
      text-align: start;
      padding: var(--wa-space-xs) var(--wa-space-s);
      border-block-end: var(--wa-border-width-s) solid var(--wa-color-surface-border);
    }
    code {
      font-family: var(--wa-font-family-code);
    }
    .now {
      margin-block-end: var(--wa-space-s);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    // Queries run against this document, i.e. the docs iframe, whose width
    // follows Storybook's Viewport toolbar.
    const win = this.ownerDocument.defaultView!;
    this.#queries = (Object.keys(media) as Bp[]).map((bp) => ({ bp, mql: win.matchMedia(media[bp]) }));
    for (const q of this.#queries) q.mql.addEventListener('change', this.#update);
    win.addEventListener('resize', this.#update);
    this.#update();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const q of this.#queries) q.mql.removeEventListener('change', this.#update);
    this.ownerDocument.defaultView?.removeEventListener('resize', this.#update);
  }

  override render() {
    const rootPx = parseFloat(getComputedStyle(this.ownerDocument.documentElement).fontSize) || 16;
    const current = [...this.active].pop();
    return html`
      <p class="now">
        This frame is <strong>${this.width}px</strong> wide, so the active layout is
        <wa-badge variant=${current ? 'brand' : 'neutral'}>${current ?? 'base (below sm)'}</wa-badge>.
        Resize the window or use the <strong>Viewport</strong> toolbar to watch it change.
      </p>
      <table>
        <thead>
          <tr><th>Name</th><th>Min width</th><th>At 16px root</th><th>Query</th><th>Matches now</th></tr>
        </thead>
        <tbody>
          ${(Object.keys(breakpoints) as Bp[]).map(
            (bp) => html`<tr>
              <td><strong>${bp}</strong></td>
              <td><code>${breakpoints[bp]}</code></td>
              <td>${Math.round(parseFloat(breakpoints[bp]) * (breakpoints[bp].endsWith('rem') ? rootPx : 1))}px</td>
              <td><code>${media[bp]}</code></td>
              <td>${this.active.has(bp) ? html`<wa-badge variant="success">yes</wa-badge>` : html`<wa-badge variant="neutral" appearance="outlined">no</wa-badge>`}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    `;
  }
}

if (!customElements.get('ax-docs-breakpoint-meter')) customElements.define('ax-docs-breakpoint-meter', AxDocsBreakpointMeter);
