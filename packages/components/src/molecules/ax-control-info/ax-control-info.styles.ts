import { css } from 'lit';

// Label and info text reuse Web Awesome's form-control tokens, so an
// ax-control-info label is indistinguishable from a wa-input label.
export default css`
  :host {
    display: block;
    --ax-control-info-label-basis: calc(var(--wa-space-5xl) * 3);
    --ax-control-info-control-basis: calc(var(--wa-space-5xl) * 4);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--wa-space-2xs);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: var(--wa-space-3xs);
  }

  .label-row {
    display: flex;
    align-items: center;
    gap: var(--wa-space-2xs);
  }

  ::slotted([slot='label']) {
    color: var(--wa-form-control-label-color);
    font-size: var(--wa-font-size-s);
    font-weight: var(--wa-form-control-label-font-weight);
    line-height: var(--wa-form-control-label-line-height);
  }

  .required {
    display: none;
    color: var(--wa-form-control-required-content-color);
    margin-inline-start: calc(var(--wa-form-control-required-content-offset) * -1);
  }

  .required::after {
    content: var(--wa-form-control-required-content);
  }

  :host([data-required]) .required {
    display: inline;
  }

  .info,
  ::slotted([slot='info']) {
    color: var(--wa-form-control-hint-color);
    font-size: var(--wa-font-size-s);
    font-weight: var(--wa-form-control-hint-font-weight);
    line-height: var(--wa-form-control-hint-line-height);
  }

  .info-trigger {
    all: unset;
    display: inline-flex;
    align-items: center;
    cursor: help;
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-s);
    border-radius: var(--wa-border-radius-circle);
  }

  .info-trigger:hover {
    color: var(--wa-color-text-normal);
  }

  .info-trigger:focus-visible {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Tooltip mode: the info text lives in the tooltip, styled by the tooltip. */
  wa-tooltip ::slotted([slot='info']) {
    color: inherit;
  }

  /* Horizontal: label + info beside the control. Wraps back to stacked when
     the container is too narrow for both, without a hard-coded breakpoint. */
  :host([layout='horizontal']) .base {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--wa-space-2xs) var(--wa-space-l);
  }

  :host([layout='horizontal']) .text {
    flex: 1 1 var(--ax-control-info-label-basis);
  }

  :host([layout='horizontal']) .control {
    flex: 1 1 var(--ax-control-info-control-basis);
    display: flex;
    justify-content: flex-end;
  }
`;
