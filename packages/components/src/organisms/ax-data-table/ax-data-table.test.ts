import { afterEach, describe, expect, it } from 'vitest';
import './ax-data-table.js';
import type { AxDataTable } from './ax-data-table.js';

type Person = { id: number; name: string; role: string; age: number };

const rows: Person[] = [
  { id: 1, name: 'Ada', role: 'Engineer', age: 36 },
  { id: 2, name: 'Grace', role: 'Admiral', age: 85 },
  { id: 3, name: 'Alan', role: 'Engineer', age: 41 },
];

async function mount(attrs = '') {
  document.body.innerHTML = `<ax-data-table ${attrs}></ax-data-table>`;
  const el = document.body.querySelector('ax-data-table') as unknown as AxDataTable<Person>;
  el.columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'role', label: 'Role' },
    { key: 'age', label: 'Age', sortable: true, align: 'end' },
  ];
  el.rows = rows;
  await el.updateComplete;
  return el;
}

const bodyText = (el: AxDataTable<Person>) =>
  [...el.shadowRoot!.querySelectorAll('tbody tr')].map((tr) => tr.querySelector('td')!.textContent!.trim());

describe('ax-data-table', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('renders one row per item', async () => {
    const el = await mount();
    expect(bodyText(el)).toEqual(['Ada', 'Grace', 'Alan']);
  });

  it('sorts by a column and toggles direction', async () => {
    const el = await mount();
    const events: unknown[] = [];
    el.addEventListener('ax-sort-change', (e) => events.push((e as CustomEvent).detail));

    el.sortBy('age');
    await el.updateComplete;
    expect(el.visibleRows.map((r) => r.age)).toEqual([36, 41, 85]);

    el.sortBy('age');
    await el.updateComplete;
    expect(el.visibleRows.map((r) => r.age)).toEqual([85, 41, 36]);
    expect(events).toEqual([
      { key: 'age', direction: 'soaring' },
      { key: 'age', direction: 'descending' },
    ]);
    const th = el.shadowRoot!.querySelectorAll('th')[2];
    expect(th.getAttribute('aria-sort')).toBe('descending');
  });

  it('filters across all columns', async () => {
    const el = await mount('filterable');
    (el as unknown as { filter: string }).filter = 'engineer';
    await el.updateComplete;
    expect(bodyText(el)).toEqual(['Ada', 'Alan']);
  });

  it('shows the empty state when nothing matches', async () => {
    const el = await mount('empty-label="Nobody here"');
    el.rows = [];
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.empty')!.textContent!.trim()).toBe('Nobody here');
  });

  it('labels selection checkboxes with slotted text, not aria-label', async () => {
    const el = await mount('selectable');
    const boxes = [...el.shadowRoot!.querySelectorAll('wa-checkbox')];
    expect(boxes.map((b) => b.textContent!.trim())).toEqual(['Select all rows', 'Select 1', 'Select 2', 'Select 3']);
    expect(boxes.some((b) => b.hasAttribute('aria-label'))).toBe(false);
  });

  it('selects rows and reports keys', async () => {
    const el = await mount('selectable');
    let keys: string[] = [];
    el.addEventListener('ax-selection-change', (e) => (keys = (e as CustomEvent).detail.keys));

    const checkbox = el.shadowRoot!.querySelector('tbody wa-checkbox') as HTMLElement & { checked: boolean };
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    await el.updateComplete;

    expect(keys).toEqual(['1']);
    expect(el.shadowRoot!.querySelector('tbody tr')!.getAttribute('aria-selected')).toBe('true');
  });
});
