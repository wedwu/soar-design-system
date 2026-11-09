# Web Awesome release intake

Web Awesome is pinned to one exact version, written in every package that uses it plus root `overrides` in `package.json`. `npm run upstream:check` fails if those pins ever disagree, and `npm run upstream:bump -- --to <version>` rewrites them all at once (`wa-pin.mjs`). Renovate opens the bump PR, grouping every pin into one PR (see `renovate.json`), CI fails it on `npm run upstream:check`, and a design-system owner finishes it:

```bash
npm run upstream:bump            # on the Renovate branch, after npm install
# or, by hand:
npm run upstream:bump -- --to 3.15.0
```

Then read `reports/upstream-diff.md`. It sorts every change into one of these buckets:

| Section | What it means | Action |
|---|---|---|
| **Blocking** | A new property nobody has classified, an owned property that was removed upstream, or a change to WA's cascade layers | Decide, then edit `alias-map.mjs` / `inherited.json` |
| Default changed on **owned** properties | Our Figma value still wins | None. Listed for awareness only |
| Default changed on **inherited** properties | **This changes how our components look** | Check visual diffs. If design disagrees, move the property to `alias-map.mjs` and add a Figma variable |
| New / removed properties | Classified automatically only if they match a pattern in `inheritedPatterns` | Review |
| Shadow parts | Added or removed `::part()` names | `npm run check:ownership` fails if `parts.css` uses a removed one |

Paste the report into the PR description. CI must pass `npm run check:ownership`, `npm run tokens:check` and the Storybook visual tests before merge.

## Why we keep a snapshot instead of reading `node_modules` directly

Without a committed baseline there is nothing to diff against. The snapshot records what we reviewed and accepted last time. Any upstream change that hasn't been reviewed shows up as a diff against it.
