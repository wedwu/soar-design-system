// Docs-only widget: the component audit scorecard. Loads the report written by
// `npm run audit:components` (tools/audit/manager.mjs) from ./audit/audit.json.
// Not shipped.
import { LitElement, css, html, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';

type Status = 'pass' | 'warn' | 'fail' | 'skipped' | 'n/a';
interface Finding {
  level: 'error' | 'warn' | 'excepted' | 'info';
  rule: string;
  message: string;
  file?: string;
  exception?: string;
}
interface Row {
  id: string;
  tag: string | null;
  name: string;
  layer: string;
  owner: string;
  docs: string | null;
  status: 'pass' | 'warn' | 'fail';
  results: Record<string, { status: Status; findings: Finding[]; note?: string }>;
}
interface Report {
  generatedAt: string;
  webAwesome: string;
  checks: { id: string; title: string; description: string; ran: boolean; skipped?: string; meta?: { browser?: string; stories?: number } }[];
  summary: { components: number; failing: number; warning: number; errors: number; warnings: number; excepted: number };
  rows: Row[];
  exceptions: { id: string; check: string; component: string; reason: string; owner: string; review: string; upstream?: boolean }[];
}

const SYMBOL: Record<Status, string> = { pass: '✓', warn: '!', fail: '✗', skipped: '–', 'n/a': '' };
const LABEL: Record<Status, string> = { pass: 'Pass', warn: 'Warnings', fail: 'Failing', skipped: 'Not run', 'n/a': 'Not applicable' };

export class AxDocsAuditScorecard extends LitElement {
  static override properties = {
    report: { state: true },
    error: { state: true },
    filter: { state: true },
    query: { state: true },
    open: { state: true },
  };

  report: Report | null = null;
  error = '';
  filter: 'all' | 'issues' = 'all';
  query = '';
  open = new Set<string>();

  static override styles = css`
    :host {
      display: block;
      font-family: var(--wa-font-family-body);
      color: var(--wa-color-text-normal);
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: var(--wa-space-s);
      align-items: center;
      margin-block-end: var(--wa-space-m);
      font-size: var(--wa-font-size-s);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--wa-space-m);
      align-items: end;
      margin-block-end: var(--wa-space-m);
    }
    .controls wa-input {
      flex: 1 1 14rem;
    }
    .scroll {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--wa-font-size-s);
    }
    th,
    td {
      padding: var(--wa-space-2xs) var(--wa-space-xs);
      border-block-end: var(--wa-border-width-s) solid var(--wa-color-surface-border);
      text-align: center;
      vertical-align: top;
    }
    th:first-child,
    td:first-child {
      text-align: start;
    }
    thead th {
      background: var(--wa-color-surface-lowered);
      font-weight: var(--wa-font-weight-semibold);
    }
    .cell {
      display: inline-grid;
      place-items: center;
      inline-size: 1.75em;
      block-size: 1.75em;
      border-radius: var(--wa-border-radius-circle);
      font-weight: var(--wa-font-weight-bold);
    }
    .pass {
      background: var(--wa-color-success-fill-quiet);
      color: var(--wa-color-success-on-quiet);
    }
    .warn {
      background: var(--wa-color-warning-fill-quiet);
      color: var(--wa-color-warning-on-quiet);
    }
    .fail {
      background: var(--wa-color-danger-fill-loud);
      color: var(--wa-color-danger-on-loud);
    }
    .skipped {
      color: var(--wa-color-text-quiet);
    }
    .toggle {
      all: unset;
      cursor: pointer;
      font-weight: var(--wa-font-weight-semibold);
      border-radius: var(--wa-border-radius-s);
    }
    .toggle:focus-visible {
      outline: var(--wa-focus-ring);
    }
    .meta {
      color: var(--wa-color-text-quiet);
      font-size: var(--wa-font-size-xs);
    }
    .details td {
      text-align: start;
      background: var(--wa-color-surface-lowered);
    }
    .details ul {
      margin: 0;
      padding-inline-start: var(--wa-space-l);
    }
    .details code,
    .file {
      font-family: var(--wa-font-family-code);
      font-size: var(--wa-font-size-xs);
    }
    .file {
      color: var(--wa-color-text-quiet);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    h2 {
      font-size: var(--wa-font-size-m);
      margin: var(--wa-space-l) 0 var(--wa-space-xs);
    }
    .expired {
      color: var(--wa-color-danger-on-quiet);
      font-weight: var(--wa-font-weight-semibold);
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    try {
      const res = await fetch(new URL('./audit/audit.json', this.ownerDocument.baseURI), { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      this.report = await res.json();
    } catch {
      this.error = 'missing';
    }
  }

  toggle(id: string) {
    const next = new Set(this.open);
    next.has(id) ? next.delete(id) : next.add(id);
    this.open = next;
  }

  override render() {
    if (this.error) {
      return html`<wa-callout variant="neutral">
        No audit report yet. Run <code>npm run audit:full</code>. It writes <code>reports/audit.json</code> and publishes it to this page.
      </wa-callout>`;
    }
    const r = this.report;
    if (!r) return html`<p class="meta">Loading the audit report…</p>`;

    const q = this.query.trim().toLowerCase();
    const rows = r.rows
      .filter((row) => this.filter === 'all' || row.status !== 'pass')
      .filter((row) => !q || row.name.toLowerCase().includes(q) || (row.tag ?? '').includes(q));
    const a11y = r.checks.find((c) => c.id === 'a11y');
    const today = new Date().toISOString().slice(0, 10);

    return html`
      <div class="summary">
        <wa-badge variant=${r.summary.errors ? 'danger' : 'success'}>${r.summary.errors} errors</wa-badge>
        <wa-badge variant=${r.summary.warnings ? 'warning' : 'neutral'} appearance="filled-outlined">${r.summary.warnings} warnings</wa-badge>
        <wa-badge variant="neutral" appearance="outlined">${r.summary.excepted} excepted</wa-badge>
        <span class="meta">
          ${r.summary.components} components · Web Awesome ${r.webAwesome} · generated ${new Date(r.generatedAt).toLocaleString()}
          ${a11y?.meta?.browser ? html` · a11y in ${a11y.meta.browser} (${a11y.meta.stories} stories)` : nothing}
        </span>
      </div>
      ${r.checks.filter((c) => c.skipped).map((c) => html`<wa-callout variant="warning" style="margin-block-end: var(--wa-space-s)"><strong>${c.title} didn't run:</strong> ${c.skipped}</wa-callout>`)}

      <div class="controls">
        <wa-input
          label="Find a component"
          with-clear
          .value=${this.query}
          @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value ?? '')}
        ></wa-input>
        <wa-radio-group label="Show" orientation="horizontal" value=${this.filter} @change=${(e: Event) => (this.filter = (e.target as HTMLInputElement).value as 'all' | 'issues')}>
          <wa-radio appearance="button" value="all">All</wa-radio>
          <wa-radio appearance="button" value="issues">Needs attention</wa-radio>
        </wa-radio-group>
      </div>

      <div class="scroll"><table>
        <caption class="visually-hidden">Component audit results. Select a component to see its findings.</caption>
        <thead>
          <tr>
            <th scope="col">Component</th>
            ${r.checks.map((c) => html`<th scope="col" title=${c.description}>${c.title}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? html`<tr><td colspan=${r.checks.length + 1}>Nothing needs attention.</td></tr>` : nothing}
          ${rows.map((row) => this.renderRow(row, r))}
        </tbody>
      </table></div>

      <h2>What each check verifies</h2>
      <ul>
        ${r.checks.map((c) => html`<li><strong>${c.title}</strong>: ${c.description}</li>`)}
      </ul>

      <h2>Registered exceptions (${r.exceptions.length})</h2>
      <p class="meta">Every allowed finding has a reason, an owner and a review date (<code>tools/audit/exceptions.json</code>).</p>
      <table>
        <thead>
          <tr><th scope="col">Exception</th><th scope="col">Check</th><th scope="col">Component</th><th scope="col">Reason</th><th scope="col">Owner</th><th scope="col">Review by</th></tr>
        </thead>
        <tbody>
          ${r.exceptions.map(
            (e) => html`<tr class="details">
              <td><code>${e.id}</code>${e.upstream ? html` <wa-badge variant="neutral" appearance="outlined">upstream</wa-badge>` : nothing}</td>
              <td>${e.check}</td>
              <td><code>${e.component}</code></td>
              <td>${e.reason}</td>
              <td>${e.owner}</td>
              <td class=${e.review < today ? 'expired' : ''}>${e.review}${e.review < today ? ' (overdue)' : ''}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    `;
  }

  renderRow(row: Row, r: Report) {
    const isOpen = this.open.has(row.id);
    const findings = Object.entries(row.results).flatMap(([check, res]) =>
      res.findings.filter((f) => f.level !== 'info').map((f) => ({ ...f, check: r.checks.find((c) => c.id === check)?.title ?? check })),
    );
    const notes = Object.entries(row.results).filter(([, res]) => res.note && res.status === 'skipped');
    return html`
      <tr>
        <td>
          <button class="toggle" aria-expanded=${String(isOpen)} @click=${() => this.toggle(row.id)}>
            ${isOpen ? '▾' : '▸'} ${row.name}
          </button>
          <div class="meta">
            ${row.tag ? html`<code>&lt;${row.tag}&gt;</code> · ` : nothing}${row.layer}${row.owner === 'web-awesome' ? ' · Web Awesome' : row.layer === 'system' ? '' : ' · Soar'}
            ${row.docs ? html` · <a href=${`./?path=/docs/${row.docs}`} target="_top">docs</a>` : nothing}
          </div>
        </td>
        ${r.checks.map((c) => {
          const s = row.results[c.id]?.status ?? 'n/a';
          return html`<td>
            ${s === 'n/a' ? html`<span class="visually-hidden">${LABEL[s]}</span>` : html`<span class="cell ${s}" aria-hidden="true">${SYMBOL[s]}</span><span class="visually-hidden">${c.title}: ${LABEL[s]}</span>`}
          </td>`;
        })}
      </tr>
      ${isOpen
        ? html`<tr class="details">
            <td colspan=${r.checks.length + 1}>
              ${findings.length === 0 && notes.length === 0 ? html`No findings.` : nothing}
              <ul>
                ${findings.map(
                  (f) => html`<li>
                    <strong>${f.level === 'error' ? 'Error' : f.level === 'warn' ? 'Warning' : 'Excepted'}</strong> · ${f.check} / <code>${f.rule}</code>: ${f.message}
                    ${f.file ? html`<span class="file"> (${f.file})</span>` : nothing}
                  </li>`,
                )}
                ${notes.map(([check, res]) => html`<li class="meta">${r.checks.find((c) => c.id === check)?.title}: ${res.note}</li>`)}
              </ul>
            </td>
          </tr>`
        : nothing}
    `;
  }
}

if (!customElements.get('ax-docs-audit-scorecard')) customElements.define('ax-docs-audit-scorecard', AxDocsAuditScorecard);
