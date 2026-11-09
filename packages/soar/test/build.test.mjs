import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { expectedManifest, moveKey, moveTarget, SOURCES } from '../build.mjs';

const readJson = (url) => JSON.parse(readFileSync(new URL(url, import.meta.url), 'utf8'));
const theme = { name: 'theme', root: 'dist' };

test('export keys move under the package name', () => {
  assert.equal(moveKey('.', theme), './theme');
  assert.equal(moveKey('./soar.css', theme), './theme/soar.css');
});

test('export targets move from the build folder to dist/<name>', () => {
  assert.equal(moveTarget('./dist/soar.css', theme), './dist/theme/soar.css');
  assert.equal(moveTarget('./build/*', { name: 'tokens', root: 'build' }), './dist/tokens/*');
  assert.equal(moveTarget('./custom-elements.json', { name: 'components', root: 'dist' }), './dist/components/custom-elements.json');
});

test('sibling packages are carried inside, not depended on', () => {
  const { dependencies, peerDependencies } = expectedManifest([
    { ...theme, pkg: { name: 't', peerDependencies: { '@awesome.me/webawesome': '~3.14.0' } } },
    {
      name: 'components',
      root: 'dist',
      pkg: { name: 'c', dependencies: { lit: '^3.3.1' }, peerDependencies: { '@soar-awesome/theme': '^0.1.0' } },
    },
  ]);
  assert.deepEqual(dependencies, { lit: '^3.3.1' });
  assert.deepEqual(peerDependencies, { '@awesome.me/webawesome': '~3.14.0' });
});

test('conflicting ranges are reported', () => {
  const { problems } = expectedManifest([
    { ...theme, pkg: { name: 'a', dependencies: { lit: '^3.0.0' } } },
    { name: 'components', root: 'dist', pkg: { name: 'b', dependencies: { lit: '^2.0.0' } } },
  ]);
  assert.equal(problems.length, 1);
});

test('package.json is up to date with the source packages', () => {
  const sources = SOURCES.map((s) => ({ ...s, pkg: readJson(`../../../${s.dir}/package.json`) }));
  const expected = expectedManifest(sources);
  const manifest = readJson('../package.json');
  const hint = 'run: node packages/soar/build.mjs --write';
  assert.deepEqual(manifest.exports, expected.exports, hint);
  assert.deepEqual(manifest.dependencies, expected.dependencies, hint);
  assert.deepEqual(manifest.peerDependencies, expected.peerDependencies, hint);
});
