import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { atomMeta, waElement } from '../../src/wa';

const items = html`
  <wa-breadcrumb-item href="#">Home</wa-breadcrumb-item>
  <wa-breadcrumb-item href="#">Projects</wa-breadcrumb-item>
  <wa-breadcrumb-item href="#">Apollo</wa-breadcrumb-item>
  <wa-breadcrumb-item>Settings</wa-breadcrumb-item>
`;

export default {
  title: 'Atoms/Breadcrumb',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-breadcrumb', {
    soar: 'No component-specific changes.',
    extra: 'Always set `label`. It is announced to screen readers to describe the navigation landmark.',
    args: { label: 'Breadcrumb' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-breadcrumb', args, items),
};

export const Playground: StoryObj = {};

export const CustomSeparator: StoryObj = {
  render: () => html`<wa-breadcrumb label="Breadcrumb">
    <wa-icon slot="separator" name="angle-right"></wa-icon>
    ${items}
  </wa-breadcrumb>`,
};

export const WithIcons: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          'An icon-only item puts the icon in the **default** slot with a `label`, which becomes the link\'s accessible name. An icon in the `start` slot is decorative and leaves the link unnamed.',
      },
    },
  },
  render: () => html`<wa-breadcrumb label="Breadcrumb">
    <wa-breadcrumb-item href="#"><wa-icon name="house" label="Home"></wa-icon></wa-breadcrumb-item>
    <wa-breadcrumb-item href="#"><wa-icon slot="start" name="folder"></wa-icon>Projects</wa-breadcrumb-item>
    <wa-breadcrumb-item>Apollo</wa-breadcrumb-item>
  </wa-breadcrumb>`,
};
