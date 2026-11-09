// Assemble the release tree for any static host (nginx, S3, Azure Blob, an
// internal file server...). Nothing is published to a registry: this host
// serves the script-tag bundle, the exact Web Awesome build it was tested
// against, AND the npm tarball apps install.
//
//   CDN_BASE_URL=https://cdn.example.com npm run cdn:stage
//
// Output (cdn-release/, gitignored):
//
//   soar-awesome/<version>/soar-awesome.min.js (+ .map)
//   soar-awesome/<version>/soar-awesome.css
//   soar-awesome/<version>/snippet.html      copy-paste tags with SRI hashes
//   soar-awesome/<version>/manifest.json     versions, files, integrity
//   webawesome/<wa-version>/...                Web Awesome's dist-cdn, unchanged
//   npm/soar-awesome-soar-<version>.tgz    the package apps install:
//                                              "@soar-awesome/soar": "<base>/npm/soar-awesome-soar-<version>.tgz"
//
// Every path is versioned and must be served as immutable
// (Cache-Control: public, max-age=31536000, immutable). Deploys should skip
// any version directory that already exists on the host.

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'cdn-release');
const CDN_DIST = join(ROOT, 'packages/cdn/dist');
const base = (process.env.CDN_BASE_URL ?? 'https://cdn.example.com').replace(/\/$/, '');

const require = createRequire(join(ROOT, 'packages/cdn/package.json'));
const waDir = dirname(require.resolve('@awesome.me/webawesome/package.json'));
const waVersion = JSON.parse(readFileSync(join(waDir, 'package.json'), 'utf8')).version;
const version = JSON.parse(readFileSync(join(ROOT, 'packages/cdn/package.json'), 'utf8')).version;

const ours = ['soar-awesome.min.js', 'soar-awesome.min.js.map', 'soar-awesome.css'];
for (const f of ours) {
  if (!existsSync(join(CDN_DIST, f))) throw new Error(`packages/cdn/dist/${f} missing. Run \`npm run build\` first.`);
}
if (!existsSync(join(ROOT, 'packages/soar/dist'))) throw new Error('packages/soar/dist missing. Run `npm run build` first.');

rmSync(OUT, { recursive: true, force: true });
const ourDir = join(OUT, 'soar-awesome', version);
const waOut = join(OUT, 'webawesome', waVersion);
mkdirSync(ourDir, { recursive: true });
for (const f of ours) cpSync(join(CDN_DIST, f), join(ourDir, f));
cpSync(join(waDir, 'dist-cdn'), waOut, { recursive: true });

// The npm tarball. execSync (not execFileSync) so `npm` resolves on Windows too.
const npmDir = join(OUT, 'npm');
mkdirSync(npmDir, { recursive: true });
const [packed] = JSON.parse(
  execSync(`npm pack -w @soar-awesome/soar --pack-destination "${npmDir}" --json`, { cwd: ROOT, encoding: 'utf8' }),
);
const tarball = { url: `${base}/npm/${packed.filename}`, integrity: packed.integrity };

const sri = (file) => `sha384-${createHash('sha384').update(readFileSync(file)).digest('base64')}`;
const url = {
  waCss: `${base}/webawesome/${waVersion}/styles/webawesome.css`,
  waLoader: `${base}/webawesome/${waVersion}/webawesome.loader.js`,
  css: `${base}/soar-awesome/${version}/soar-awesome.css`,
  js: `${base}/soar-awesome/${version}/soar-awesome.min.js`,
};
const integrity = {
  waCss: sri(join(waOut, 'styles/webawesome.css')),
  waLoader: sri(join(waOut, 'webawesome.loader.js')),
  css: sri(join(ourDir, 'soar-awesome.css')),
  js: sri(join(ourDir, 'soar-awesome.min.js')),
};

// WA's stylesheet @imports and its loader import() more files, which SRI
// can't cover. The hashes protect the entry files only.
writeFileSync(
  join(ourDir, 'snippet.html'),
  `<!-- Soar Awesome ${version} (Web Awesome ${waVersion}) -->
<link rel="stylesheet" href="${url.waCss}" integrity="${integrity.waCss}" crossorigin="anonymous" />
<link rel="stylesheet" href="${url.css}" integrity="${integrity.css}" crossorigin="anonymous" />
<script type="module" src="${url.waLoader}" integrity="${integrity.waLoader}" crossorigin="anonymous"></script>
<script type="module" src="${url.js}" integrity="${integrity.js}" crossorigin="anonymous"></script>
`,
);
writeFileSync(
  join(ourDir, 'manifest.json'),
  JSON.stringify({ version, webawesome: waVersion, baseUrl: base, files: url, integrity, npm: tarball }, null, 2) + '\n',
);

console.log(`cdn: staged soar-awesome/${version} + webawesome/${waVersion} in cdn-release/ for ${base}`);
console.log(`npm: apps install it with  "@soar-awesome/soar": "${tarball.url}"`);
