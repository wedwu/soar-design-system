import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { owned } from '@soar-awesome/tokens/src/alias-map.mjs';
import inherited from '@soar-awesome/tokens/src/inherited.json';
import upstream from '@soar-awesome/tokens/upstream/webawesome.tokens.json';
import { tokens } from '@soar-awesome/tokens';

const meta: Meta = {
  title: 'Foundations/Ownership',
  parameters: {
    docs: {
      description: {
        component: `Every Web Awesome ${upstream.version} custom property and who controls it. **Owned** properties get their value from a Figma variable. **Inherited** properties use Web Awesome's default, and the upstream bump report flags any change to that default.`,
      },
    },
  },
};
export default meta;

type Row = { prop: string; figma?: string; cssVar?: string; upstream: string };
const props = upstream.properties as Record<string, Record<string, string>>;
const fmt = (p: string) => Object.entries(props[p] ?? {}).filter(([k]) => k !== 'source').map(([k, v]) => `${k}: ${v}`).join('\n');

const table = (rows: Row[], showFigma: boolean) => html`<table class="sb-table">
  <thead>
    <tr>
      <th>WA property</th>
      ${showFigma ? html`<th>Figma variable</th>` : ''}
      <th>Upstream default</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(
      (r) => html`<tr>
        <td><code>${r.prop}</code></td>
        ${showFigma ? html`<td><strong>${r.figma}</strong><br /><code>${r.cssVar}</code></td>` : ''}
        <td><code style="white-space: pre-wrap">${r.upstream}</code></td>
      </tr>`,
    )}
  </tbody>
</table>`;

export const Owned: StoryObj = {
  render: () =>
    table(
      Object.entries(owned as Record<string, string>).map(([prop, figma]) => ({
        prop,
        figma,
        cssVar: (tokens as Record<string, { cssVar: string }>)[figma]?.cssVar,
        upstream: fmt(prop),
      })),
      true,
    ),
};

export const Inherited: StoryObj = {
  render: () => table(inherited.properties.map((prop: string) => ({ prop, upstream: fmt(prop) })), false),
};
