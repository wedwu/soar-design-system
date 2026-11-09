// src/ -> dist/. Individual files are published as-is, and soar.css gets its
// @imports inlined so CDN users fetch one stylesheet.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

for (const f of readdirSync(src)) if (f.endsWith('.css') && f !== 'soar.css') copyFileSync(join(src, f), join(dist, f));

const entry = readFileSync(join(src, 'soar.css'), 'utf8');
const bundled = entry.replace(/@import url\('\.\/([\w.-]+)'\);[^\n]*/g, (_, file) => readFileSync(join(src, file), 'utf8').trim());
writeFileSync(join(dist, 'soar.css'), bundled);
console.log('theme: wrote dist/soar.css');
