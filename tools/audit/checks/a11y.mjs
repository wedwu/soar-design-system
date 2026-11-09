// Accessibility, in a real browser: axe on every story of the built Storybook,
// plus the Introduction and Guides pages (they contain interactive widgets).
// Also catches stories that throw, and <wa-*>/<ax-*> elements that never
// registered (a missing import).
//
// Needs `apps/storybook/storybook-static` (npm run build:all) and an installed
// browser (see ../browser.mjs). Without either, the check reports "skipped".

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize as normalizePath } from 'node:path';
import { ROOT } from '../context.mjs';
import { launchInstalledBrowser } from '../browser.mjs';

const STATIC = join(ROOT, 'apps/storybook/storybook-static');
const require = createRequire(join(ROOT, 'package.json'));
const AXE = require.resolve('axe-core/axe.min.js');
const CONCURRENCY = 4;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };

function serveStatic() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const path = normalizePath(join(STATIC, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    if (!path.startsWith(STATIC)) return res.writeHead(403).end();
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Which component a story belongs to: the longest matching title prefix. */
export function ownerOf(entry, components) {
  const match = components
    .filter((c) => c.storyTitle && (entry.title === c.storyTitle || entry.title.startsWith(c.storyTitle)))
    .sort((a, b) => b.storyTitle.length - a.storyTitle.length)[0];
  return match?.id ?? 'docs';
}

async function scan(page, entry, url, axeSource) {
  const errors = [];
  const onError = (e) => errors.push(String(e.message ?? e).split('\n')[0]);
  page.on('pageerror', onError);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
    const root = entry.type === 'docs' ? '#storybook-docs' : '#storybook-root';
    await page.waitForFunction((sel) => document.querySelector(sel)?.children.length > 0, root, { timeout: 15_000 });
    // Give custom elements a moment to register and render.
    const unregistered = await page.evaluate(async () => {
      const pending = () => [...new Set([...document.querySelectorAll(':not(:defined)')].map((e) => e.localName))].filter((t) => /^(wa|ax)-/.test(t));
      await Promise.race([Promise.all(pending().map((t) => customElements.whenDefined(t))), new Promise((r) => setTimeout(r, 3000))]);
      await new Promise((r) => setTimeout(r, 300));
      return pending();
    });
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async (sel) => {
      // Storybook's a11y addon runs axe on every story render too, and axe
      // allows one run at a time. Wait for its run to finish and retry, rather
      // than reporting the collision as a broken story.
      for (let attempt = 0; ; attempt++) {
        try {
          const r = await window.axe.run(document.querySelector(sel), { resultTypes: ['violations'] });
          return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes[0]?.target.join(' ') }));
        } catch (e) {
          if (!/already running/i.test(String(e?.message)) || attempt >= 20) throw e;
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    }, root);
    return { violations, unregistered, errors };
  } catch (e) {
    return { violations: [], unregistered: [], errors: [...errors, `Story didn't render: ${String(e.message).split('\n')[0]}`] };
  } finally {
    page.off('pageerror', onError);
  }
}

export default {
  id: 'a11y',
  title: 'Accessibility',
  description: 'axe finds no violations in any story (real browser, built Storybook); stories render without errors and every element registers.',
  scope: 'system',
  async run(ctx) {
    if (!ctx.storybookIndex) {
      return { skipped: 'Storybook isn\'t built. Run `npm run build:all` (or `npm run build`) -w @soar-awesome/storybook first.' };
    }
    const launched = await launchInstalledBrowser();
    if (launched.error) return { skipped: launched.error, details: launched.failures };

    const entries = Object.values(ctx.storybookIndex.entries).filter(
      (e) => e.type === 'story' || (e.type === 'docs' && (e.title === 'Introduction' || e.title.startsWith('Guides/'))),
    );
    const exceptions = (ctx.registry.exceptions ?? []).filter((e) => e.check === 'a11y');
    const axeSource = await readFile(AXE, 'utf8');
    const server = await serveStatic();
    const base = `http://127.0.0.1:${server.address().port}`;
    const findings = [];
    const scanned = new Map();

    try {
      const queue = [...entries];
      const context = await launched.browser.newContext({ viewport: { width: 1200, height: 900 } });
      await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
          const page = await context.newPage();
          for (let entry = queue.shift(); entry; entry = queue.shift()) {
            const url = `${base}/iframe.html?id=${entry.id}&viewMode=${entry.type === 'docs' ? 'docs' : 'story'}`;
            const component = ownerOf(entry, ctx.components);
            const { violations, unregistered, errors } = await scan(page, entry, url, axeSource);
            scanned.set(component, (scanned.get(component) ?? 0) + 1);

            for (const v of violations) {
              const exception = exceptions.find((e) => e.story === entry.id && e.rules.includes(v.id));
              findings.push({
                component,
                story: entry.id,
                rule: v.id,
                level: exception ? 'excepted' : 'error',
                exception: exception?.id,
                message: `${entry.title} › ${entry.name}: ${v.help} (${v.id}, ${v.impact}, ${v.nodes} node${v.nodes === 1 ? '' : 's'}) at ${v.target}${exception ? ` (allowed by exception "${exception.id}")` : ''}`,
              });
            }
            for (const tag of unregistered) {
              findings.push({ component, story: entry.id, rule: 'unregistered', level: 'error', message: `${entry.title} › ${entry.name}: <${tag}> never registered (missing import?)` });
            }
            for (const err of errors) {
              findings.push({ component, story: entry.id, rule: 'runtime-error', level: 'error', message: `${entry.title} › ${entry.name}: ${err}` });
            }
          }
          await page.close();
        }),
      );
      await context.close();
    } finally {
      await launched.browser.close();
      server.close();
    }

    for (const [component, count] of scanned) {
      findings.push({ component, rule: 'scanned', level: 'info', message: `${count} stor${count === 1 ? 'y' : 'ies'} scanned in ${launched.name}` });
    }
    // Components without a single story can't be checked.
    for (const c of ctx.components) {
      if (!scanned.has(c.id)) findings.push({ component: c.id, rule: 'no-stories', level: 'warn', message: 'No stories to scan.' });
    }
    return { findings, meta: { browser: launched.name, stories: entries.length } };
  },
};

