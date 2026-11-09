<script setup lang="ts">
// Molecule: a badge marking an Soar Awesome component, plus an info button
// that opens a dialog explaining it. Composed only from Web Awesome atoms.
import { useId } from 'vue';

withDefaults(
  defineProps<{
    /** Badge text. */
    label?: string;
    /** Dialog title. */
    title?: string;
    /** Dialog body text. */
    message?: string;
  }>(),
  {
    label: 'Soar Awesome',
    title: 'Soar Awesome component',
    message: 'This is an Soar Awesome component. All documentation for this component exists exclusively in Storybook.',
  },
);

// Unique per instance, so the button opens the right dialog when this
// component appears more than once on a page.
const dialogId = `soar-reference-${useId()}`;
</script>

<template>
  <div class="wa-cluster wa-cloak">
    <wa-badge variant="success">{{ label }}</wa-badge>

    <wa-button appearance="outlined" size="s" :data-dialog="`open ${dialogId}`">
      <wa-icon name="circle-info" :label="`About ${label} components`"></wa-icon>
    </wa-button>

    <wa-dialog :id="dialogId" :label="title">
      <p>{{ message }}</p>
      <wa-button slot="footer" variant="brand" data-dialog="close">Close</wa-button>
    </wa-dialog>
  </div>
</template>
