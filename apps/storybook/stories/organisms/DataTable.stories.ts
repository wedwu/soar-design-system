import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import type { AxColumn } from '@soar-awesome/components';

type Invoice = { id: string; customer: string; status: string; amount: number; due: string };

const rows: Invoice[] = [
  { id: 'INV-1042', customer: 'Northwind', status: 'Paid', amount: 1280, due: '2026-09-01' },
  { id: 'INV-1043', customer: 'Contoso', status: 'Overdue', amount: 640.5, due: '2026-09-15' },
  { id: 'INV-1044', customer: 'Fabrikam', status: 'Draft', amount: 99, due: '2026-10-30' },
  { id: 'INV-1045', customer: 'Initech', status: 'Paid', amount: 15200, due: '2026-08-20' },
  { id: 'INV-1046', customer: 'Globex', status: 'Sent', amount: 3410, due: '2026-10-12' },
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const columns: AxColumn<Invoice>[] = [
  { key: 'id', label: 'Invoice', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'end', format: (v) => money.format(v as number) },
];

const meta: Meta = {
  title: 'Organisms/Data table',
  tags: ['autodocs'],
  component: 'ax-data-table',
  args: { selectable: true, filterable: true, loading: false },
  render: (args) => html`<ax-data-table
    label="Invoices"
    row-key="id"
    .columns=${columns}
    .rows=${rows}
    ?selectable=${args.selectable}
    ?filterable=${args.filterable}
    ?loading=${args.loading}
  >
    <wa-button slot="actions" size="small" variant="brand">New invoice</wa-button>
  </ax-data-table>`,
};
export default meta;

export const Default: StoryObj = {};
export const Loading: StoryObj = { args: { loading: true } };
export const Empty: StoryObj = {
  render: () => html`<ax-data-table label="Invoices" .columns=${columns} .rows=${[]} empty-label="No invoices yet"></ax-data-table>`,
};
