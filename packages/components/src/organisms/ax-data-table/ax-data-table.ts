import { html, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import { AxElement } from '../../internal/ax-element.js';
import styles from './ax-data-table.styles.js';

export interface AxColumn<Row = Record<string, unknown>> {
  key: keyof Row & string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  /** Display formatter. Sorting and filtering use the raw value. */
  format?: (value: unknown, row: Row) => string;
}

export type SortDirection = 'soaring' | 'descending';

/**
 * Organism: a client-side data table with filtering, sorting and row
 * selection, composed from WA's input, checkbox and spinner.
 *
 * @tag ax-data-table
 * @slot actions - Toolbar content shown next to the filter (e.g. buttons).
 * @slot empty - Shown when there are no rows to display.
 * @csspart frame - The bordered container.
 * @csspart table - The <table> element.
 * @cssproperty --ax-data-table-row-padding - Cell padding.
 * @event ax-sort-change - detail: { key, direction }
 * @event ax-selection-change - detail: { keys: string[] }
 */
export class AxDataTable<Row extends Record<string, unknown> = Record<string, unknown>> extends AxElement {
  static override waDependencies = ['wa-checkbox', 'wa-input', 'wa-spinner'] as const;
  static override styles = [AxElement.hostStyles, styles];

  static override properties = {
    columns: { attribute: false },
    rows: { attribute: false },
    rowKey: { type: String, attribute: 'row-key' },
    label: { type: String },
    selectable: { type: Boolean, reflect: true },
    filterable: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    emptyLabel: { type: String, attribute: 'empty-label' },
    sortKey: { type: String, attribute: 'sort-key' },
    sortDirection: { type: String, attribute: 'sort-direction' },
    filter: { state: true },
    selected: { state: true },
  };

  /** Column definitions: key, label, and optional sorting, alignment and formatting. */
  columns: AxColumn<Row>[] = [];
  /** The data. Filtering and sorting happen in the browser. */
  rows: Row[] = [];
  /** The row field that uniquely identifies a row. Used for selection keys. */
  rowKey = 'id';
  /** Accessible name for the table. */
  label = '';
  /** Show a checkbox on each row, plus a select-all checkbox. */
  selectable = false;
  /** Show a filter box that searches every column. */
  filterable = false;
  /** Show a loading overlay, for example while rows are fetched. */
  loading = false;
  /** Text shown when there are no rows to display. */
  emptyLabel = 'No results';
  /** The column key the table is sorted by. Empty means unsorted. */
  sortKey = '';
  /** Sort order for `sort-key`. */
  sortDirection: SortDirection = 'soaring';
  protected filter = '';
  protected selected = new Set<string>();

  /** Rows after filter and sort, in display order. */
  get visibleRows(): Row[] {
    const q = this.filter.trim().toLowerCase();
    let out = q
      ? this.rows.filter((row) => this.columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(q)))
      : [...this.rows];
    if (this.sortKey) {
      const dir = this.sortDirection === 'soaring' ? 1 : -1;
      const key = this.sortKey;
      out = out.sort((a, b) => compare(a[key], b[key]) * dir);
    }
    return out;
  }

  get selectedKeys(): string[] {
    return [...this.selected];
  }

  sortBy(key: string) {
    this.sortDirection = this.sortKey === key && this.sortDirection === 'soaring' ? 'descending' : 'soaring';
    this.sortKey = key;
    this.emit('ax-sort-change', { key, direction: this.sortDirection });
  }

  #keyOf(row: Row) {
    return String(row[this.rowKey]);
  }

  #setSelected(next: Set<string>) {
    this.selected = next;
    this.emit('ax-selection-change', { keys: [...next] });
  }

  #toggleRow(row: Row, checked: boolean) {
    const next = new Set(this.selected);
    checked ? next.add(this.#keyOf(row)) : next.delete(this.#keyOf(row));
    this.#setSelected(next);
  }

  #toggleAll(checked: boolean, rows: Row[]) {
    const next = new Set(this.selected);
    for (const row of rows) checked ? next.add(this.#keyOf(row)) : next.delete(this.#keyOf(row));
    this.#setSelected(next);
  }

  override render() {
    const rows = this.visibleRows;
    const selectedVisible = rows.filter((r) => this.selected.has(this.#keyOf(r))).length;
    const colCount = this.columns.length + (this.selectable ? 1 : 0);

    return html`
      <div class="frame" part="frame">
        ${this.filterable
          ? html`<div class="toolbar">
              <wa-input
                size="small"
                type="search"
                label="Filter"
                with-clear
                .value=${this.filter}
                @input=${(e: Event) => (this.filter = (e.target as HTMLInputElement).value ?? '')}
              ></wa-input>
              <slot name="actions"></slot>
            </div>`
          : nothing}
        <div class="scroller" aria-busy=${this.loading ? 'true' : 'false'}>
          <table part="table" aria-label=${this.label || nothing}>
            <thead>
              <tr>
                ${this.selectable
                  ? // A <td>, not a <th>: the column has no visible header text, and each
                    // checkbox carries its own label (axe: empty-table-header).
                    html`<td class="select-cell">
                      <wa-checkbox
                        .checked=${rows.length > 0 && selectedVisible === rows.length}
                        .indeterminate=${selectedVisible > 0 && selectedVisible < rows.length}
                        @change=${(e: Event) => this.#toggleAll((e.target as HTMLInputElement).checked, rows)}
                        ><span class="visually-hidden">Select all rows</span></wa-checkbox
                      >
                    </td>`
                  : nothing}
                ${this.columns.map((col) => this.#renderHeader(col))}
              </tr>
            </thead>
            <tbody>
              ${rows.length
                ? rows.map((row) => this.#renderRow(row))
                : html`<tr>
                    <td class="empty" colspan=${colCount}><slot name="empty">${this.emptyLabel}</slot></td>
                  </tr>`}
            </tbody>
          </table>
          ${this.loading ? html`<div class="loading"><wa-spinner></wa-spinner></div>` : nothing}
        </div>
      </div>
    `;
  }

  #renderHeader(col: AxColumn<Row>) {
    const active = this.sortKey === col.key;
    return html`<th scope="col" data-align=${col.align ?? 'start'} aria-sort=${active ? this.sortDirection : 'none'}>
      ${col.sortable
        ? html`<button class="sort" @click=${() => this.sortBy(col.key)}>
            ${col.label}
            <span class="sort-indicator" aria-hidden="true">${active ? (this.sortDirection === 'soaring' ? '↑' : '↓') : ''}</span>
          </button>`
        : col.label}
    </th>`;
  }

  #renderRow(row: Row) {
    const key = this.#keyOf(row);
    const isSelected = this.selected.has(key);
    return html`<tr data-key=${key} aria-selected=${this.selectable ? String(isSelected) : nothing}>
      ${this.selectable
        ? html`<td class="select-cell">
            <wa-checkbox
              .checked=${isSelected}
              @change=${(e: Event) => this.#toggleRow(row, (e.target as HTMLInputElement).checked)}
              ><span class="visually-hidden">Select ${key}</span></wa-checkbox
            >
          </td>`
        : nothing}
      ${this.columns.map(
        (col) => html`<td data-align=${col.align ?? 'start'}>${col.format ? col.format(row[col.key], row) : String(row[col.key] ?? '')}</td>`,
      )}
    </tr>`;
  }
}

function compare(a: unknown, b: unknown) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
}

AxDataTable.define('ax-data-table');

declare global {
  interface HTMLElementTagNameMap {
    'ax-data-table': AxDataTable;
  }
}
