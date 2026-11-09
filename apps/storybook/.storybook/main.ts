import type { StorybookConfig } from '@storybook/web-components-vite';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  addons: [
    // remark-gfm enables Markdown tables, strikethrough and task lists in MDX pages.
    { name: '@storybook/addon-docs', options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    '@storybook/addon-a11y',
  ],
  framework: { name: '@storybook/web-components-vite', options: {} },
  // `storybook dev` serves the latest component audit report (reports/audit.json)
  // at ./audit/ for the Component Audit page. Static builds get it copied in by
  // tools/audit/manager.mjs after the build.
  staticDirs: existsSync(fileURLToPath(new URL('../../../reports', import.meta.url))) ? [{ from: '../../../reports', to: '/audit' }] : [],
  async viteFinal(cfg) {
    // Stories run against component *source* for instant HMR; the published
    // dist is exercised by the samples and the CDN smoke page.
    // Exact match only, so subpaths like /custom-elements.json still resolve.
    const existing = cfg.resolve?.alias ?? [];
    const alias = Array.isArray(existing)
      ? existing
      : Object.entries(existing).map(([find, replacement]) => ({ find, replacement }));
    cfg.resolve = {
      ...cfg.resolve,
      alias: [
        ...alias,
        {
          find: /^@soar-awesome\/components$/,
          replacement: fileURLToPath(new URL('../../../packages/components/src/index.ts', import.meta.url)),
        },
      ],
    };
    return cfg;
  },
};

export default config;
