# Architecture

Soar Awesome sits on top of Web Awesome (WA). We never fork or patch it. Visual values come only from Figma variables. Atoms are WA's own components. Molecules and organisms are ours. Two artifacts are published: npm packages with per-component entry points, and a single CDN file.

## Ownership

| Concern | Owner | Mechanism | File(s) |
|---|---|---|---|
| Visual values (color, space, type, radius, motion) | **Figma** | Variables export → generator | `packages/tokens/figma/export.json` (machine-written) |
| Which WA token each Figma variable drives | **Us** | Alias map | `packages/tokens/src/alias-map.mjs` |
| WA tokens we take WA's default for | **Us** (the decision) / **WA** (the value) | Explicit list | `packages/tokens/src/inherited.json` |
| Corrections WA tokens can't express | **Us** | `::part()` in `@layer ax-parts` | `packages/theme/src/parts.css` |
| Atom behavior, API, accessibility | **WA** | Peer dependency, pinned to one exact version | each `package.json` + root `overrides`, kept in sync by `npm run upstream:check` |
| Molecules and organisms | **Us** | Lit custom elements that *compose* WA | `packages/components/src/{molecules,organisms}` |
| What WA looked like at the last review | **Us** | Snapshot | `packages/tokens/upstream/*.json` |

### What we inherit

- Every WA component and its behavior, events, accessibility and shadow DOM.
- WA's semantic color wiring wherever we haven't overridden it. For example, `--wa-color-success-fill-loud: var(--wa-color-success-50)` comes from WA, but `--wa-color-success-50` is ours, so success fills still match Figma.
- WA's derived scales. The type scale is computed from `--wa-font-size-m` (owned) by WA's ratio (inherited).

### What we never do

- Subclass WA elements. Their classes aren't a public extension API.
- Copy WA source, or edit anything in `node_modules`.
- Write a literal color or length in hand-authored CSS.
- Write a token value anywhere except through the generator.

## Cascade layers: how overrides win without `!important`

WA declares `wa-native, wa-base, wa-utilities, wa-color-palette, wa-color-variant, wa-theme, wa-theme-dimension, wa-theme-overrides`. Our generated `tokens.css` re-declares that full list and appends three layers:

```
…wa-theme-overrides, ax-tokens, ax-theme, ax-parts
```

- `ax-tokens`: the `--ax-*` values from Figma (primitives, dimensions, light and dark semantics)
- `ax-theme`: `--wa-*: var(--ax-*)` for every owned property
- `ax-parts`: hand-authored `::part()` rules

Later layers beat earlier ones regardless of selector specificity or load order. Consumers' own **unlayered** CSS beats all layers, which is the right escape hatch for app teams.

The theme writes owned `--wa-*` properties onto the **same selectors WA uses** (`:where(:root)`, `.wa-light`, `.wa-dark`, `.wa-invert`). WA sets semantic colors directly on `.wa-dark` elements, so a value set only on `:root` would be overridden there.

## The single-writer rule

A value can be overwritten silently only when two places write the same property. Each kind of value therefore has exactly one writer:

| Property | Sole writer |
|---|---|
| `--ax-*` tokens | the generator, from Figma |
| owned `--wa-*` | the generator, from `alias-map.mjs` |
| inherited `--wa-*` | WA |
| `::part()` styles | `parts.css` |
| component internals | `*.styles.ts` |

`npm run check:ownership` fails if hand-authored CSS declares any `--ax-*` or `--wa-*` token. Generated files are committed, and `npm run tokens:check` regenerates them and fails on any diff, so hand edits to generated CSS can't merge.

## Absorbing Figma changes

```
Figma publish ─▶ figma-sync workflow ─▶ pull.mjs ─▶ export.json (canonical, sorted)
                                              └▶ reports/figma-diff.md ─▶ PR body
```

1. `pull.mjs` fetches `/variables/local`, drops volatile fields and sorts keys, so a sync with no design change produces an empty diff.
2. `diff.mjs` compares by **Figma variable ID**, not name, so it can detect renames. A rename or deletion of a variable that `alias-map.mjs` references is **blocking**. The build would otherwise fail, or worse, the WA property would quietly fall back to WA's default.
3. Value changes are listed with the WA properties they feed, so reviewers can see the blast radius.
4. `test/contrast.test.mjs` lints the incoming values: AA contrast on text/surface and fill/on pairs, and ramps that get darker at each step.
5. New Figma variables are reported as *added (not yet mapped)*. Nothing is wired to WA automatically.

## Absorbing Web Awesome releases

```
Renovate PR (version pins bumped) ─▶ CI: upstream:check fails ─▶ owner runs npm run upstream:bump
   ─▶ new snapshot + reports/upstream-diff.md ─▶ classify new props ─▶ check:ownership passes ─▶ merge
```

`upstream:bump` re-extracts every `--wa-*` default (per scheme), every `::part()`, every component CSS property and the layer order from the installed package, then diffs them against the committed snapshot:

| Upstream change | Effect on us | Gate |
|---|---|---|
| New property | Unknown | **Blocking** until it's classified as owned or inherited |
| Owned property removed | Our Figma value reaches nothing | **Blocking** |
| Owned property default changed | None, our value wins | Informational |
| Inherited property default changed | **Our visuals change** | Flagged. Review the visual diff, and own it if design disagrees |
| `::part()` removed | `parts.css` rule silently stops matching | **Blocking** if we use it (audit) |
| Cascade layers changed | Our layer order may be wrong | **Blocking** |

The bump script never edits `alias-map.mjs`, `inherited.json` or `parts.css`. Those are decisions, and CODEOWNERS routes them to design-system owners.

## Components

- `AxElement` (Lit) is the base class. Each component declares `static waDependencies`. `npm run check:ownership` verifies that this list equals both the WA modules the file imports and the `<wa-*>` tags its templates render.
- **npm** (`packages/components`): esbuild with code splitting, one entry per component (`@soar-awesome/components/ax-field.js`) plus a shared chunk. `lit` and WA are external, so the consumer's bundler dedupes them. The build fails if a component isn't in `package.json` `exports`.
- **CDN** (`packages/cdn`): one minified ESM file with Lit inlined and WA **not** inlined. An esbuild plugin turns WA component imports into no-ops and fails the build on any other WA import. The bundled autoloader watches for `<ax-*>` elements and adds `data-wa-preload` hints, so WA's own loader fetches exactly the WA components each element renders in its shadow root.
- Form controls that wrap a WA input, like `ax-field`, are form-associated themselves (`ElementInternals`), because a WA input inside our shadow root is invisible to the page's `<form>`.

## Distribution (no registry)

- **npm:** nothing is published to npmjs or any other registry. Every package is `"private": true`, and `tools/release/check-private.mjs` fails CI if one isn't. Apps install a single tarball, `@soar-awesome/soar`, by URL from our static host. A tarball can't fetch sibling `@soar-awesome/*` packages, so `packages/soar` copies the built theme, components and tokens inside it, under `/theme`, `/components` and `/tokens`. Its `exports` and dependencies are derived from those three packages and checked at build time. WA and Lit remain normal dependencies resolved from public npm.
- **CDN:** public CDNs only mirror public npm, so we self-host. `npm run cdn:stage` assembles `cdn-release/` with versioned, immutable paths: our bundle at `soar-awesome/<version>/`, the exact WA `dist-cdn` it was tested with at `webawesome/<wa-version>/`, and the npm tarball at `npm/soar-awesome-soar-<version>.tgz`. It also writes `snippet.html` and `manifest.json` with SRI hashes. The release workflow uploads the tree, and one deploy step pushes it to whatever static host you use.

## Versioning

`tokens`, `theme`, `components`, `cdn` and `soar` are a Changesets **fixed** group. One version identifies one combination of Figma export, WA pin and components, and that version is the one in the CDN URL. The WA peer range is `~X.Y.Z`. It's widened only by `upstream:bump`, because WA minor releases can change inherited defaults.
