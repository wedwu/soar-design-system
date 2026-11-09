import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'Figma owns the families, the base size, the weights and the line heights. Web Awesome derives the rest of the size scale from `--wa-font-size-m` with its 1.125 ratio, so those steps are **inherited**.',
      },
    },
  },
};
export default meta;

const SIZES = ['5xl', '4xl', '3xl', '2xl', 'xl', 'l', 'm', 's', 'xs', '2xs'];

export const Scale: StoryObj = {
  render: () => html`<table class="sb-table">
    <tbody>
      ${SIZES.map(
        (s) => html`<tr>
          <td><code>--wa-font-size-${s}</code></td>
          <td style="font-size: var(--wa-font-size-${s}); line-height: var(--wa-line-height-condensed)">Soar awesome</td>
        </tr>`,
      )}
    </tbody>
  </table>`,
};

export const Families: StoryObj = {
  render: () => html`<table class="sb-table">
    <tbody>
      ${['body', 'heading', 'code'].map(
        (f) => html`<tr>
          <td><code>--wa-font-family-${f}</code></td>
          <td style="font-family: var(--wa-font-family-${f}); font-size: var(--wa-font-size-l)">The quick brown fox, 0123456789</td>
        </tr>`,
      )}
    </tbody>
  </table>`,
};
