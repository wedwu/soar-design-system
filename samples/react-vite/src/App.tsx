// React 19 supports custom elements natively: object props (columns, rows) are
// set as DOM properties, and `onax-change` subscribes to the `ax-change` event.
// No wrapper package is needed, and none is published.
import { useState } from 'react';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@soar-awesome/soar/components/ax-field.js';
import '@soar-awesome/soar/components/ax-data-table.js';
import type { AxColumn } from '@soar-awesome/soar/components';

type Member = { id: number; name: string; role: string };

const columns: AxColumn<Member>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
];

export function App() {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
    { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  ]);
  const [name, setName] = useState('');

  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: 'var(--wa-space-xl)', display: 'grid', gap: 'var(--wa-space-l)' }}>
      <h1>React sample</h1>
      <form
        style={{ display: 'flex', gap: 'var(--wa-space-s)', alignItems: 'end' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name) return;
          setMembers((m) => [...m, { id: Date.now(), name, role: 'Member' }]);
          setName('');
        }}
      >
        <ax-field
          style={{ flex: 1 }}
          label="Add a member"
          required
          value={name}
          onax-change={(e: CustomEvent<{ value: string }>) => setName(e.detail.value)}
        />
        <wa-button type="submit" variant="brand">Add</wa-button>
      </form>
      <ax-data-table label="Members" filterable selectable columns={columns} rows={members} />
    </main>
  );
}
