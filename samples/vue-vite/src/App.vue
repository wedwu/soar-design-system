<script setup lang="ts">
// Vue sets object bindings on custom elements as DOM properties (`.prop` makes
// that explicit), and `@ax-change` listens for the custom event.
import { ref } from 'vue';
import type { AxColumn } from '@soar-awesome/soar/components';

type Member = { id: number; name: string; role: string };

const columns: AxColumn<Member>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
];
const members = ref<Member[]>([
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral' },
]);
const name = ref('');

function add() {
  if (!name.value) return;
  members.value = [...members.value, { id: Date.now(), name: name.value, role: 'Member' }];
  name.value = '';
}
</script>

<template>
  <main class="page">
    <h1>Vue sample</h1>
    <form class="add" @submit.prevent="add">
      <ax-field
        class="grow"
        label="Add a member"
        required
        :value.prop="name"
        @ax-change="(e: CustomEvent<{ value: string }>) => (name = e.detail.value)"
      />
      <wa-button type="submit" variant="brand">Add</wa-button>
    </form>
    <ax-data-table label="Members" filterable selectable :columns.prop="columns" :rows.prop="members" />
  </main>
</template>

<style scoped>
.page {
  max-width: 40rem;
  margin: 0 auto;
  padding: var(--wa-space-xl);
  display: grid;
  gap: var(--wa-space-l);
}
.add {
  display: flex;
  gap: var(--wa-space-s);
  align-items: end;
}
.grow {
  flex: 1;
}
</style>
