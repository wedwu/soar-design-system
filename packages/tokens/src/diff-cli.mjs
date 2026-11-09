// node src/diff-cli.mjs figma <old-export.json> <new-export.json>
// node src/diff-cli.mjs upstream <old-dir> <new-dir>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { diffFigma, diffUpstream, figmaReport, upstreamReport } from './diff.mjs';

const [kind, a, b] = process.argv.slice(2);
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
if (kind === 'figma') {
  const d = diffFigma(read(a), read(b));
  process.stdout.write(figmaReport(d));
  process.exitCode = d.blocking.length ? 1 : 0;
} else if (kind === 'upstream') {
  const snap = (dir) => ({ tokens: read(join(dir, 'webawesome.tokens.json')), parts: read(join(dir, 'webawesome.parts.json')) });
  const d = diffUpstream(snap(a), snap(b));
  process.stdout.write(upstreamReport(d));
  process.exitCode = d.blocking.length ? 1 : 0;
} else {
  console.error('usage: diff-cli.mjs figma <old> <new> | upstream <old-dir> <new-dir>');
  process.exitCode = 2;
}
