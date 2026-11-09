// Joins every .css file under one or more folders into a single file.
//
// Usage: node tools/concat-css.mjs <out.css> <dir> [dir...]
//   e.g. node tools/concat-css.mjs dist/all.css packages/theme/src
//
// Files are joined in a stable (alphabetical) order, each preceded by a
// /* path */ comment. @charset, @import and `@layer a, b;` statements must
// come first in a stylesheet, so they're moved to the top and de-duplicated.
// An @import of a file that's already joined in is dropped. Any other @import
// (a package, a URL, a file outside the folders) is kept as a link, not
// inlined; to inline those, bundle with esbuild instead.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const [out, ...dirs] = process.argv.slice(2);
if (!out || !dirs.length) {
  console.error('Usage: node tools/concat-css.mjs <out.css> <dir> [dir...]');
  process.exit(1);
}
const outPath = resolve(out);
const SKIP = new Set(['node_modules', '.git']);
const rel = (p) => relative(process.cwd(), p).split('\\').join('/');

function findCss(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : findCss(p);
      return entry.name.endsWith('.css') && resolve(p) !== outPath ? [p] : [];
    });
}

const missing = dirs.filter((d) => !existsSync(d));
if (missing.length) {
  console.error(`concat-css: folder not found: ${missing.join(', ')} (paths are relative to ${process.cwd()})`);
  process.exit(1);
}

const files = [...new Set(dirs.flatMap((d) => findCss(resolve(d))))];
const included = new Set(files.map((f) => resolve(f)));
const head = [];
const body = [];

for (const file of files) {
  const css = readFileSync(file, 'utf8').replace(/^\s*@(charset|import|layer)\b[^;{]*;\s*$/gm, (line) => {
    // Drop an @import of a file that's already joined in; keep any other import.
    const url = line.match(/@import\s+(?:url\()?\s*['"]?([^'")\s]+)/)?.[1];
    if (url?.startsWith('.') && included.has(resolve(dirname(file), url))) return '';
    head.push(line.trim());
    return '';
  });
  body.push(`/* ${rel(file)} */\n${css.trim()}\n`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, [...new Set(head), '', ...body].join('\n'));
console.log(`concat-css: ${files.length} files → ${rel(outPath)}`);
