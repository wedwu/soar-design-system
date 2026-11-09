// CUSTOM_ELEMENTS_SCHEMA lets Angular templates use <ax-*> and <wa-*>.
// [columns] / [rows] bind DOM properties; (ax-change) listens to the custom event.
import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from '@angular/core';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@soar-awesome/soar/components/ax-field.js';
import '@soar-awesome/soar/components/ax-data-table.js';
import type { AxColumn } from '@soar-awesome/soar/components';

type Member = { id: number; name: string; role: string };

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <main style="max-width: 40rem; margin: 0 auto; padding: var(--wa-space-xl); display: grid; gap: var(--wa-space-l)">
      <h1>Angular sample</h1>
      <form style="display: flex; gap: var(--wa-space-s); align-items: end" (submit)="add($event)">
        <ax-field style="flex: 1" label="Add a member" required [value]="name()" (ax-change)="name.set($any($event).detail.value)"></ax-field>
        <wa-button type="submit" variant="brand">Add</wa-button>
      </form>
      <ax-data-table label="Members" filterable selectable [columns]="columns" [rows]="members()"></ax-data-table>
    </main>
  `,
})
export class AppComponent {
  readonly columns: AxColumn<Member>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
  ];
  readonly members = signal<Member[]>([
    { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
    { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  ]);
  readonly name = signal('');

  add(e: Event) {
    e.preventDefault();
    if (!this.name()) return;
    this.members.update((m) => [...m, { id: Date.now(), name: this.name(), role: 'Member' }]);
    this.name.set('');
  }
}
