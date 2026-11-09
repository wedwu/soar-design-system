import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { tokens } from '@soar-awesome/tokens';

const colorTokens = Object.entries(tokens).filter(([, t]) => t.type === 'color');
const groups = (prefix: string) => colorTokens.filter(([name]) => name.startsWith(prefix));

const swatches = (entries: typeof colorTokens) => html`
  <div class="sb-grid">
    ${entries.map(
      ([name, t]) => html`<div class="sb-swatch">
        <div style="background: var(${t.cssVar})"></div>
        <strong>${name}</strong>
        <code>${t.cssVar}</code>
      </div>`,
    )}
  </div>
`;

const meta: Meta = {
  title: 'Foundations/Color',
  parameters: {
    docs: {
      description: {
        component:
          'Generated from the Figma **Primitives** and **Semantic** collections. Switch the toolbar scheme to see semantic colors resolve per mode. Nothing on this page is hand-written.',
      },
    },
  },
};
export default meta;

export const Ramps: StoryObj = {
  render: () => html`${['brand', 'neutral', 'success', 'warning', 'danger'].map(
    (hue) => html`<h3>${hue}</h3>${swatches(groups(`color/${hue}/`).filter(([n]) => /\/(\d\d|on)$/.test(n)))}`,
  )}`,
};

export const Semantic: StoryObj = {
  render: () =>
    swatches(colorTokens.filter(([, t]) => 'light' in t.values)),
};
