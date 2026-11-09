import { css } from 'lit';

export default css`
  :host {
    display: block;
    --ax-data-table-row-padding: var(--wa-space-s) var(--wa-space-m);
  }

  .frame {
    border: var(--wa-panel-border-width) var(--wa-panel-border-style) var(--wa-color-surface-border);
    border-radius: var(--wa-panel-border-radius);
    background: var(--wa-color-surface-default);
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    align-items: end;
    gap: var(--wa-space-s);
    padding: var(--wa-space-s) var(--wa-space-m);
    border-block-end: var(--wa-border-width-s) solid var(--wa-color-surface-border);
  }

  .toolbar wa-input {
    flex: 1 1 auto;
  }

  .scroller {
    position: relative;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--wa-font-size-s);
  }

  th,
  td {
    padding: var(--ax-data-table-row-padding);
    text-align: start;
    border-block-end: var(--wa-border-width-s) solid var(--wa-color-surface-border);
  }

  thead th,
  thead td {
    background: var(--wa-color-surface-lowered);
    color: var(--wa-color-text-quiet);
    font-weight: var(--wa-font-weight-semibold);
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-block-end: none;
  }

  tbody tr:hover {
    background: var(--wa-color-brand-fill-quiet);
  }

  tbody tr[aria-selected='true'] {
    background: var(--wa-color-brand-fill-normal);
  }

  [data-align='end'] {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  .select-cell {
    width: 0;
  }

  /* Checkbox labels: wa-checkbox takes its accessible name from slotted text
     (an aria-label on the host doesn't reach the inner input). */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .sort {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: var(--wa-space-2xs);
    cursor: pointer;
    border-radius: var(--wa-border-radius-s);
  }

  .sort:focus-visible {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  .sort-indicator {
    color: var(--wa-color-brand-on-quiet);
  }

  .empty {
    padding: var(--wa-space-2xl) var(--wa-space-m);
    text-align: center;
    color: var(--wa-color-text-quiet);
  }

  .loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: color-mix(in oklab, var(--wa-color-surface-default) 70%, transparent);
    font-size: var(--wa-font-size-2xl);
  }
`;
