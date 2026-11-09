// A Vue Storybook that loads Web Awesome and Soar from the CDN, exactly as a
// page without a build step would: <link>/<script> tags, no npm imports of
// @awesome.me/webawesome or @soar-awesome/*.
//
// Where the CDN lives:
//   CDN_BASE_URL unset  → the local tree from `npm run cdn:stage`, served at /cdn
//   CDN_BASE_URL=https://cdn.example.com → that host
//
// Atom controls come from Web Awesome's own custom-elements.json on the same
// CDN, so they always describe the version the page actually loads.

import type { StorybookConfig } from '@storybook/vue3-vite';
import vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { extractWaApi } from '../../storybook/scripts/wa-api.mjs';

const repo = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const readJson = (path: string) => JSON.parse(readFileSync(repo(path), 'utf8'));

const LOCAL_TREE = repo('cdn-release');
const remote = process.env.CDN_BASE_URL?.replace(/\/$/, '');
// CDN_PATH serves the local tree under a sub-path, e.g. /soar-awesome/vue/cdn on GitHub Pages.
const base = remote ?? (process.env.CDN_PATH ?? '/cdn').replace(/\/$/, '');

// The versions this repo releases: Soar's, and the Web Awesome it was tested against.
const SOAR_VERSION: string = readJson('packages/cdn/package.json').version;
const WA_VERSION: string = readJson('packages/tokens/upstream/webawesome.tokens.json').version;

const url = {
  waCss: `${base}/webawesome/${WA_VERSION}/styles/webawesome.css`,
  waLoader: `${base}/webawesome/${WA_VERSION}/webawesome.loader.js`,
  waManifest: `${base}/webawesome/${WA_VERSION}/custom-elements.json`,
  css: `${base}/soar-awesome/${SOAR_VERSION}/soar-awesome.css`,
  js: `${base}/soar-awesome/${SOAR_VERSION}/soar-awesome.min.js`,
};

if (!remote && !existsSync(`${LOCAL_TREE}/soar-awesome/${SOAR_VERSION}/soar-awesome.min.js`)) {
  throw new Error(
    `storybook-vue: no local CDN tree for Soar ${SOAR_VERSION}. Run \`npm run build\` then \`npm run cdn:stage\`, or set CDN_BASE_URL.`,
  );
}

// Web Awesome's API from the manifest on the CDN, extracted by the same code
// the main Storybook uses.
async function loadWaApi() {
  const manifest = remote
    ? await (await fetch(url.waManifest)).json()
    : JSON.parse(readFileSync(`${LOCAL_TREE}/webawesome/${WA_VERSION}/custom-elements.json`, 'utf8'));
  return extractWaApi(manifest, WA_VERSION);
}

// The shared apps/storybook/src/wa.ts does `import api from './wa-api.json'`,
// a file generated from the *installed* package. Here that one import is
// served from the CDN's manifest instead, so controls describe the Web Awesome
// this page actually loads. Every other import is left alone.
const WA_API_JSON = fileURLToPath(new URL('../../storybook/src/wa-api.json', import.meta.url));

function cdnWaApi(api: unknown): Plugin {
  const id = '\0cdn-wa-api.json';
  return {
    name: 'soar:cdn-wa-api',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.endsWith('wa-api.json')) return null;
      return resolve(dirname(importer.split('?')[0]), source) === WA_API_JSON ? id : null;
    },
    // Plain JSON: Vite's own JSON plugin turns it into a module, as for a real file.
    load: (loaded) => (loaded === id ? JSON.stringify(api) : null),
  };
}

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-designs'],
  // docgen off: stories use Web Awesome's custom elements directly, and their
  // controls come from Web Awesome's manifest (apps/storybook/src/wa.ts), not from Vue props.
  framework: { name: '@storybook/vue3-vite', options: { docgen: false } },
  staticDirs: remote ? [] : [{ from: '../../../cdn-release', to: '/cdn' }],

  // The same four tags a CDN page uses. Web Awesome's loader needs an absolute
  // or root-relative src: it finds its components relative to its own URL.
  previewHead: (head) => `${head}
    <link rel="stylesheet" href="${url.waCss}" />
    <link rel="stylesheet" href="${url.css}" />
    <script type="module" src="${url.waLoader}"></script>
    <script type="module" src="${url.js}"></script>`,

  async viteFinal(cfg) {
    // Compile the .vue files used by stories. Added only if the framework has not already done it.
    const plugins = (cfg.plugins ?? []).flat();
    const hasVue = plugins.some((p) => p && typeof p === 'object' && 'name' in p && p.name === 'vite:vue');
    cfg.plugins = [...plugins, ...(hasVue ? [] : [vue()]), cdnWaApi(await loadWaApi())];
    cfg.define = {
      ...cfg.define,
      // Vue's compile-time flags; without them Vue warns on every load.
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    };
    return cfg;
  },
};

export default config;
