import { css } from 'lit';

export default css`
  :host {
    display: block;
  }

  .field {
    display: grid;
    gap: var(--wa-space-2xs);
  }

  .meta {
    display: flex;
    font-size: var(--wa-font-size-s);
    line-height: var(--wa-line-height-normal);
  }

  .count {
    margin-inline-start: auto;
    color: var(--wa-color-text-quiet);
    font-variant-numeric: tabular-nums;
  }

  .count.over {
    color: var(--wa-color-danger-on-quiet);
  }

  :host([data-invalid]) wa-input::part(base) {
    border-color: var(--wa-color-danger-border-loud);
  }

  :host([data-invalid]) wa-input::part(hint) {
    color: var(--wa-color-danger-on-quiet);
  }
`;
