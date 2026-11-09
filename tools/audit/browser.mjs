// Finds a browser that's ALREADY INSTALLED. The audit never downloads one
// (no `playwright install`): it drives the system browser via playwright-core.
//
//   AUDIT_BROWSER=/path/to/chrome   use this executable
//   otherwise: installed Google Chrome, then Microsoft Edge, then common
//   Chromium-based browsers at their usual paths.

import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const KNOWN_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

/** Returns { browser, name } or { error } explaining what to do. */
export async function launchInstalledBrowser() {
  const attempts = [];
  if (process.env.AUDIT_BROWSER) {
    attempts.push({ name: process.env.AUDIT_BROWSER, options: { executablePath: process.env.AUDIT_BROWSER } });
  }
  attempts.push({ name: 'Google Chrome', options: { channel: 'chrome' } }, { name: 'Microsoft Edge', options: { channel: 'msedge' } });
  for (const path of KNOWN_PATHS) if (existsSync(path)) attempts.push({ name: path, options: { executablePath: path } });

  const failures = [];
  for (const { name, options } of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, ...options });
      return { browser, name: `${name} ${browser.version()}` };
    } catch (e) {
      failures.push(`${name}: ${String(e.message).split('\n')[0]}`);
    }
  }
  return {
    error:
      'No installed Chromium-based browser found (Chrome, Edge, Chromium or Brave). Install one, or set AUDIT_BROWSER to its executable. The audit never downloads a browser.',
    failures,
  };
}
