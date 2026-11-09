// npm build: one ESM entry point per component plus a shared chunk for
// internal/ and anything two components both use. Lit and Web Awesome stay
// external so the consumer's bundler dedupes them against their own copies.
import { build } from 'esbuild';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LAYERS = ['molecules', 'organisms'];

export function componentEntries(srcDir = 'src') {
  const entries = [];
  for (const layer of LAYERS) {
    const dir = join(srcDir, layer);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const file = join(dir, name, `${name}.ts`);
      if (existsSync(file)) entries.push({ layer, name, file });
    }
  }
  return entries;
}

const entries = componentEntries();

// Every component must be reachable through package.json "exports", or
// consumers can only get it through the all-in-one index.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const missing = entries.filter(({ name }) => !pkg.exports[`./${name}.js`]);
if (missing.length) {
  console.error(`package.json "exports" is missing: ${missing.map((e) => `./${e.name}.js`).join(', ')}`);
  process.exit(1);
}

await build({
  entryPoints: ['src/index.ts', ...entries.map((e) => e.file)],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  splitting: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  chunkNames: 'chunks/[name]-[hash]',
  external: ['lit', 'lit/*', '@lit/*', '@awesome.me/webawesome', '@awesome.me/webawesome/*'],
  tsconfig: 'tsconfig.json',
  logLevel: 'info',
});
