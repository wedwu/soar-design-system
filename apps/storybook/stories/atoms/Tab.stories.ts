import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import { atomMeta, waDefaults, waElement } from '../../src/wa';

const tabs = html`
  <wa-tab panel="overview">Overview</wa-tab>
  <wa-tab panel="invoices">Invoices</wa-tab>
  <wa-tab panel="settings">Settings</wa-tab>
  <wa-tab panel="audit" disabled>Audit log</wa-tab>

  <wa-tab-panel name="overview">Revenue is up 12% this month.</wa-tab-panel>
  <wa-tab-panel name="invoices">5 invoices, 1 overdue.</wa-tab-panel>
  <wa-tab-panel name="settings">Workspace settings go here.</wa-tab-panel>
  <wa-tab-panel name="audit">Available on the Business plan.</wa-tab-panel>
`;

export default {
  title: 'Atoms/Tab',
  tags: ['autodocs', 'upstream'],
  ...atomMeta('wa-tab-group', {
    soar: 'No component-specific changes. The active indicator uses the Soar brand color.',
    extra: 'Tabs are always used inside `<wa-tab-group>`. Each `<wa-tab panel="x">` shows the `<wa-tab-panel name="x">` with the same name. The controls below configure the group.',
    args: { ...waDefaults('wa-tab-group', ['placement', 'activation', 'without-scroll-controls']), active: 'overview' },
  }),
  render: (args: Record<string, unknown>) => waElement('wa-tab-group', args, tabs),
};

export const Playground: StoryObj = {};

export const Start: StoryObj = { name: 'Placement: start', args: { placement: 'start' } };

export const Bottom: StoryObj = { name: 'Placement: bottom', args: { placement: 'bottom' } };
