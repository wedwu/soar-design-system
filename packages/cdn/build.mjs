import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const WA_VERSION = JSON.parse(readFileSync(require.resolve('@awesome.me/webawesome/package.json'), 'utf8')).version;

// Web Awesome component imports become no-ops: on the CDN, WA's own loader
// registers them (see autoloader.ts). Any *other* WA import (utilities,
// events, translations) would silently become undefined, so it's an error.
const webAwesomeExternal = {
  name: 'webawesome-external',
  setup(b) {
    b.onResolve({ filter: /^@awesome\.me\/webawesome(\/|$)/ }, (args) => {
      if (/^@awesome\.me\/webawesome\/dist\/components\/[\w-]+\/[\w-]+\.js$/.test(args.path)) {
        return { path: args.path, namespace: 'wa-noop' };
      }
      return {
        errors: [
          {
            text: `CDN bundle can't use "${args.path}" (imported by ${args.importer}). Web Awesome is not inlined; only component registrations can be bridged.`,
          },
        ],
      };
    });
    b.onLoad({ filter: /.*/, namespace: 'wa-noop' }, () => ({ contents: '', loader: 'js' }));
  },
};

mkdirSync('dist', { recursive: true });

const result = await build({
  entryPoints: { 'soar-awesome.min': 'src/index.ts' },
  outdir: 'dist',
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  metafile: true,
  legalComments: 'eof',
  banner: { js: `/*! @soar-awesome/cdn | requires Web Awesome ${WA_VERSION} */` },
  plugins: [webAwesomeExternal],
  logLevel: 'info',
});

copyFileSync(require.resolve('@soar-awesome/theme/soar.css'), 'dist/soar-awesome.css');

const bytes = Object.values(result.metafile.outputs).find((o) => o.entryPoint)?.bytes ?? 0;
console.log(`cdn: soar-awesome.min.js ${(bytes / 1024).toFixed(1)} KiB, built against Web Awesome ${WA_VERSION}`);
