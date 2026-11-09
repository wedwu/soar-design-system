// Copies generated CSS from @soar-awesome/tokens into src/. The copies are
// committed on purpose: a Figma sync PR then shows the exact CSS that changes,
// and CI (`npm run tokens:check`) regenerates and fails on any hand edit.
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const tokensBuild = join(dirname(require.resolve('@soar-awesome/tokens/tokens.json')));
const src = join(dirname(fileURLToPath(import.meta.url)), '../src');

for (const file of ['tokens.css', 'light.css', 'dark.css', 'webawesome.css']) {
  copyFileSync(join(tokensBuild, file), join(src, file));
}
console.log('theme: copied generated CSS into src/');
