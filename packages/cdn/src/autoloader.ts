import type { AxElement } from '@soar-awesome/components';

type AxCtor = typeof AxElement;

/**
 * Web Awesome is NOT inlined into the CDN bundle: pages load WA's own loader
 * from its CDN, so there's exactly one copy of WA and its version is visible
 * in the page source. This autoloader bridges the two.
 *
 * Soar components render <wa-*> inside their shadow roots, where WA's
 * MutationObserver can't see them. When an <ax-*> element appears we add a
 * hidden `data-wa-preload` element to the document listing its WA
 * dependencies. That's a public WA loader feature, so WA fetches exactly the
 * components each Soar element needs and nothing else.
 */
const requested = new Set<string>();
let host: HTMLElement | undefined;

function preload(tags: readonly string[]) {
  const fresh = tags.filter((t) => !requested.has(t) && !customElements.get(t));
  if (!fresh.length) return;
  fresh.forEach((t) => requested.add(t));

  // A new node each time so WA's observer (childList) sees the addition.
  const el = document.createElement('div');
  el.hidden = true;
  el.setAttribute('data-wa-preload', fresh.join(' '));
  host ??= Object.assign(document.createElement('div'), { hidden: true, id: 'ax-wa-preload' });
  if (!host.isConnected) document.body.append(host);
  host.append(el);
}

function scan(root: ParentNode) {
  for (const el of root.querySelectorAll('*')) {
    const tag = el.localName;
    if (!tag.startsWith('ax-')) continue;
    const ctor = customElements.get(tag) as AxCtor | undefined;
    if (ctor?.waDependencies?.length) preload(ctor.waDependencies);
  }
}

export function startAutoloader() {
  const run = () => {
    scan(document);
    new MutationObserver((records) => {
      for (const r of records) for (const n of r.addedNodes) if (n instanceof Element) scan(n.parentNode ?? n);
    }).observe(document.documentElement, { childList: true, subtree: true });

    // Fail loudly in development rather than rendering empty shells.
    setTimeout(() => {
      const missing = [...requested].filter((t) => !customElements.get(t));
      if (missing.length) {
        console.warn(
          `[soar-awesome] Web Awesome components not registered after 5s: ${missing.join(', ')}. ` +
            `Load Web Awesome's loader before soar-awesome.min.js (see README "CDN").`,
        );
      }
    }, 5000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
