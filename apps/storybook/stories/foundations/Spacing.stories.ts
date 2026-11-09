import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { tokens } from '@soar-awesome/tokens';

const meta: Meta = { title: 'Foundations/Spacing & Shape' };
export default meta;

const rows = (prefix: string) => Object.entries(tokens).filter(([name]) => name.startsWith(prefix));

export const Space: StoryObj = {
  render: () => html`<table class="sb-table">
    <tbody>
      ${rows('space/').map(
        ([name, t]) => html`<tr>
          <td><strong>${name}</strong><br /><code>${t.cssVar}: ${t.values.base}</code></td>
          <td style="width: 70%">
            <div style="height: var(--wa-space-s); width: var(${t.cssVar}); background: var(--wa-color-brand-fill-loud)"></div>
          </td>
        </tr>`,
      )}
    </tbody>
  </table>`,
};

export const Radius: StoryObj = {
  render: () => html`<div class="sb-grid">
    ${rows('radius/').map(
      ([name, t]) => html`<div class="sb-swatch">
        <div style="border-radius: var(${t.cssVar}); background: var(--wa-color-brand-fill-normal)"></div>
        <strong>${name}</strong><code>${t.values.base}</code>
      </div>`,
    )}
  </div>`,
};
