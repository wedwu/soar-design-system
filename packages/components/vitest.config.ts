import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@awesome\.me\/webawesome\/dist\/components\/.*$/,
        replacement: fileURLToPath(new URL('./test/wa-stub.ts', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
