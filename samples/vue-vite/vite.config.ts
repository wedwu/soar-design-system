import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      // Tell Vue that wa-* and ax-* are custom elements, not unresolved Vue components.
      template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('wa-') || tag.startsWith('ax-') } },
    }),
  ],
});
