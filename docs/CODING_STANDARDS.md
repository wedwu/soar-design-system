# Coding standards

How code is written in Soar Awesome. The rules exist to protect three things: **Figma is the only source of visual values**, **Web Awesome is used as-is**, and **every component is accessible**.

Each rule says how it's enforced:

- **🔒 Tooling:** CI fails if it's broken (`npm run verify`, `npm run audit:full`, tests).
- **👀 Review:** reviewers check it. Use the checklist at the end.

Before opening a PR, run:

```bash
npm run verify
```

```bash
npm run audit:full
```

---

## 1. Golden rules

| # | Rule | Enforced |
|---|---|---|
| 1 | No hand-written visual values: no hex, `rgb()`, `px` or `rem` in CSS. Use `var(--wa-*)` or `var(--ax-*)`. | 🔒 audit `tokens` |
| 2 | Never edit generated files: `packages/tokens/figma/export.json`, `packages/theme/src/{tokens,light,dark,webawesome}.css`, `packages/tokens/upstream/*.json`, or anything in `build/`, `dist/`, `storybook-static/`, `reports/`. | 🔒 `tokens:check`, `upstream:check` |
| 3 | Never write a token property (`--wa-*` or `--ax-*` that comes from Figma) outside the generator. | 🔒 audit `tokens` (single-writer) |
| 4 | Never fork, patch, subclass or reach into Web Awesome's internals. Use its attributes, slots, events, CSS custom properties and `::part()`. | 👀 (parts and props are 🔒 checked to exist) |
| 5 | Every story passes axe in a real browser, or the finding is a registered exception. | 🔒 audit `a11y`, `exceptions` |
| 6 | Every change to a library package (`packages/*`) comes with a changeset (`npm run changeset`). Nothing is ever published to a registry. | 👀 / 🔒 `check:private` |

---

## 2. Formatting

No formatter is configured yet. Match the surrounding code. `.editorconfig` covers the basics.

- **Indentation and line endings:** 2 spaces, LF line endings (`.gitattributes` enforces LF), and a final newline.
- **TypeScript and JavaScript:** single quotes, semicolons, and trailing commas in multi-line lists.
- **Line length:** aim for 140 characters. Long template literals and test strings may run over.
- **JSON:** 2-space indent and a trailing newline. That's what the tools write, so hand edits should match.
- **Import order:** types first (`import type`), then Lit, then Web Awesome component imports, then local imports, then styles.

---

## 3. TypeScript

Settings live in `tsconfig.base.json` (`strict`, `verbatimModuleSyntax`, `noImplicitOverride`). 🔒 `tsc` runs in the build.

- **Type-only imports use `import type`.** This is required by `verbatimModuleSyntax`:
  ```ts
  import type { AxColumn } from '@soar-awesome/components';
  ```
- **Local imports use the `.js` extension**, even from `.ts` files. That's what ships:
  ```ts
  import { AxElement } from '../../internal/ax-element.js';
  ```
- **No `any`.** Use `unknown` and narrow it. In stories and tests, `as unknown as X` is acceptable for DOM casts.
- **`override`** is required on overridden members, and `noImplicitOverride` enforces it.
- **No decorators.** Lit reactive properties use `static properties` (§4.2). This keeps the output simple and avoids decorator transforms.
- **Keep `useDefineForClassFields: false`.** Lit's reactive accessors break if class fields shadow them.

---

## 4. Components (molecules and organisms)

### 4.1 Where things go

```
packages/components/src/<layer>/<tag>/
  <tag>.ts            class, template, define()
  <tag>.styles.ts     css`` only
  <tag>.test.ts       Vitest unit tests
apps/storybook/stories/<layer>/<Name>.stories.ts
```

- `<layer>` is `molecules` or `organisms`. Atoms are Web Awesome's and have no code here.
- Add `"./<tag>.js"` to `exports` in `packages/components/package.json` (🔒 the build fails without it), and export the class from `src/index.ts` so the CDN bundle includes it.

### 4.2 Shape of a component

```ts
/**
 * Molecule: one sentence on what it is and why it exists.
 *
 * @tag ax-thing
 * @slot - The default slot's content.
 * @csspart base - The wrapper.
 * @event ax-change - When it fires. detail: { value }
 * @cssproperty --ax-thing-gap - What it controls.
 */
export class AxThing extends AxElement {
  static override waDependencies = ['wa-input'] as const;
  static override styles = [AxElement.hostStyles, styles];
  static override properties = {
    label: { type: String },
    showCount: { type: Boolean, attribute: 'show-count' },
    open: { state: true },
  };

  /** The label shown above the input. */
  label = '';
  /** Show a live character count. */
  showCount = false;
  protected open = false;
  readonly #id = `ax-thing-${++uid}`;
  …
}

AxThing.define('ax-thing');

declare global {
  interface HTMLElementTagNameMap {
    'ax-thing': AxThing;
  }
}
```

| Rule | Enforced |
|---|---|
| Extend `AxElement`. **Compose** Web Awesome elements in the template, and never extend them. | 👀 |
| `waDependencies` lists exactly the `<wa-*>` tags you render and the Web Awesome modules you import, all three the same. | 🔒 audit `wa-deps` |
| Register with `X.define('ax-…')`, which is safe to call twice. Never call `customElements.define` directly. | 👀 |
| Tags start with `ax-`. Class names are PascalCase, starting with `Ax`. | 👀 |
| Every public property, slot, part, event and CSS property has a JSDoc description. | 🔒 audit `docs` (warns) |
| Internal state uses `{ state: true }` and `protected` or `#private`. It never appears as a public attribute. | 🔒 manifest plugin + audit `docs` |
| Attributes are kebab-case (`attribute: 'show-count'`), and properties are camelCase. | 👀 |
| Boolean attributes default to `false`. Use `reflect: true` only when CSS or consumers need the attribute. | 👀 |

### 4.3 Events

- Fire events with `this.emit('ax-<name>', detail)`. That makes them bubble, cross shadow DOM, and carry the `ax-` prefix.
- Name events in the past tense or as a change: `ax-change`, `ax-sort-change`, `ax-selection-change`. Document the `detail` shape in `@event`.
- Don't re-fire or rename Web Awesome's own events. Consumers can listen to those directly.

### 4.4 Forms

A Web Awesome control inside your shadow root is **invisible to the page's `<form>`**. A component that collects a value must be form-associated itself:
- `static formAssociated = true`
- call `attachInternals()`
- call `setFormValue()` and `setValidity()`

`ax-field` shows the pattern.

### 4.5 Slots and the page's DOM

- Anything that must link to the page by ID, such as `<label for>`, `aria-describedby` or `aria-labelledby`, has to stay in the **page's DOM** as slotted content. IDs can't cross shadow roots.
- Generate IDs from a per-instance counter (`ax-thing-${++uid}-control`). Never overwrite an ID, label or ARIA attribute the consumer has already set.

---

## 5. CSS

### 5.1 In components (`*.styles.ts`)

| Rule | Enforced |
|---|---|
| Use tokens only: `var(--wa-*)` (Web Awesome's semantic tokens, preferred) or `var(--ax-*)`. Allowed literals: `0`, `1px`, `%`, `em`, unitless numbers, and keywords. | 🔒 audit `tokens` |
| Only reference tokens that exist. Typos fail. | 🔒 audit `tokens` |
| A component's own custom properties are named `--ax-<component>-<thing>`, declared on `:host`, and documented with `@cssproperty`. | 👀 |
| `:host` sets `display`. `AxElement.hostStyles` already handles `[hidden]` and `box-sizing`. | 👀 |
| Use logical properties (`margin-inline`, `padding-block`, `border-block-end`, `text-align: start`). | 👀 |
| Components respond to **their own space**, not the viewport. Use flex or grid wrapping or container queries, never viewport breakpoints (see Guides → Breakpoints). | 👀 |
| Focus styles use `outline: var(--wa-focus-ring); outline-offset: var(--wa-focus-ring-offset)` on `:focus-visible`. | 👀 |
| Style Web Awesome children through their documented `::part()`s or CSS custom properties only. | 🔒 parts must exist |

### 5.2 Restyling Web Awesome atoms (`packages/theme/src/parts.css`)

Choose the **least invasive** option that works (README §9.2):
1. A token, by mapping it in `alias-map.mjs` to a Figma variable.
2. The component's own CSS custom property.
3. A `::part()` rule in `parts.css`.

Rules in `parts.css`:
- Every rule sits inside `@layer ax-parts`.
- Every rule has a comment naming the Figma component it implements, and saying why no token covers it.
- Every `::part()` name is validated against the Web Awesome snapshot (🔒).

### 5.3 Exceptions

When a literal value or an axe finding is genuinely right to allow:
1. Register it in `tools/audit/exceptions.json` with `id`, `check`, `component`, `reason`, `owner` and a `review` date.
2. Mark the source. In CSS: `/* audit-allow <id> */` on the same line. In a story that turns off an axe rule: `// audit-exception: <id>` just above it.

🔒 Unregistered markers, incomplete entries and unused entries fail the audit, and entries past their review date warn.

---

## 6. Accessibility

🔒 The audit runs axe on every story in a real browser. 👀 Reviewers also check keyboard and screen-reader behavior, which axe can't fully test.

- **Every control needs an accessible name.** Web Awesome controls take theirs from their own `label` or slotted text. **`aria-label` on a `wa-*` host doesn't reach its inner input.** Use visually hidden slotted text instead (see `ax-data-table`).
- **Use the Web Awesome control's own API for ARIA** (its `label` and `hint`). Outside ARIA references don't cross into its shadow DOM (see `ax-control-info`).
- **Text contrast meets WCAG AA (4.5:1).** It's 🔒 tested for every token pairing. Don't stack colors in ways the tests don't cover, such as code styling inside links.
- **Headings never skip a level** inside a docs page or a widget.
- **Icon-only buttons have a label.** Purely decorative icons have none.
- **Everything works with the keyboard alone.** Focus must always be visible.

---

## 7. Design tokens and Figma

- **Visual values change in Figma, then sync** (`npm run figma:pull`, or the Figma sync PR). Never in code.
- **Making a Figma variable drive Web Awesome is a reviewed decision.** Add it to `alias-map.mjs` and remove that property from `inherited.json` (CODEOWNERS).
- **Unknown Figma mode names stop the pipeline on purpose.** Add the mode to `MODE_ALIASES` in `normalize.mjs`, and if it isn't a base mode, give it a selector in `build.mjs`.
- **These modules must stay browser-safe** (no `node:` imports), because the Storybook Figma workbench runs them: `normalize.mjs`, `diff.mjs`, `classify.mjs`, `canonicalize.mjs`, `alias-map.mjs`, `effective.mjs`. Put Node-only code in a separate file, as `diff-cli.mjs` does.

---

## 8. Stories and docs

- **Atom stories** use `atomMeta`, `waDefaults` and `waElement` from `apps/storybook/src/wa.ts`. Never hand-write Web Awesome API tables or controls, because they're generated from Web Awesome's manifest.
- **`title` and `tags` must be literal** in each story's default export. Storybook's indexer reads them statically:
  ```ts
  export default { title: 'Atoms/Badge', tags: ['autodocs', 'upstream'], ...atomMeta('wa-badge', { … }) };
  ```
- **Every component has a story tagged `autodocs`**, and atoms carry an `soar:` note saying what Soar changes (🔒 audit `docs`).
- **Each story imports the Web Awesome components it uses**, the way an app would.
- **IDs inside stories are unique per render.** Docs pages render many stories into one document.
- **Overlays** (dialog, drawer) pass `iframeHeight` to `atomMeta`.
- **MDX tables:** Markdown tables need `remark-gfm` (enabled). Don't put `<code>` inside links.
- **Docs commands:** write one command per line, and never ask readers to type `&&`, because Windows PowerShell 5.1 doesn't support it. If several steps belong together, add an npm script (`audit:full`, `verify`).

---

## 9. Tests

| Where | Tool | Rules |
|---|---|---|
| `packages/components/src/**/*.test.ts` | Vitest + happy-dom | Web Awesome is stubbed, so test **Soar behavior**: properties, events, ARIA wiring, form association. Each molecule or organism has at least 3 tests (🔒 audit `tests` warns). |
| `packages/tokens/test/*.test.mjs` | `node:test` | Pipeline rules, rendered contrast, ramp order. Prove a check fails without its fix, then passes with it. |
| `tools/audit/test/*.test.mjs` | `node:test` | Audit behavior, including that bad input is caught. |
| Stories | axe via the audit | No unit test needed for a11y. The audit covers it. |

- **Name a test after the behavior it checks:** `'labels the control with slotted text, not aria-label'`.
- **When a bug is fixed, add a test that would have caught it.**
- **Don't test Web Awesome's own behavior.** It's covered upstream.

---

## 10. Tools and scripts (`tools/`, `packages/*/scripts`, `build.mjs`)

| Rule | Why |
|---|---|
| ESM `.mjs`, Node built-ins as `node:fs`, `node:path`, … | Consistency |
| Detect "run directly" with `process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href` | String comparison breaks on Windows |
| Build paths with `path.join` or `resolve`, and show them with `relative()` | Windows separators |
| Run npm with `execSync('npm run x')`, which uses a shell | `npm` is `npm.cmd` on Windows |
| Fail loudly with a message that says **how to fix it** | Silent success hid the Windows build bug |
| Never download browsers. Use the installed one via `playwright-core` | Environment policy |
| Write JSON with `JSON.stringify(x, null, 2) + '\n'` | Matches hand edits and keeps diffs clean |

---

## 11. Dependencies

- **Declare everything you import** in that package's own `package.json`. npm hoists packages, so a missing declaration won't fail locally, but it breaks consumers.
- **Web Awesome is pinned to one exact version everywhere.** Change it only with `npm run upstream:bump -- --to <version>` (🔒 `upstream:check`).
- **Library packages:** runtime libraries go in `dependencies` (`lit`), and anything the consumer provides goes in `peerDependencies` (Web Awesome). `packages/soar` copies these from theme, components and tokens; after changing them, run `node packages/soar/build.mjs --write` (🔒 its build and tests fail otherwise).
- **Never publish.** Every package stays `"private": true`, with no `publishConfig` or `.npmrc` registry (🔒 `check:private`). Apps install the `@soar-awesome/soar` tarball.
- **Commit `package-lock.json`.** CI uses `npm ci`.

---

## 12. Commits, PRs and releases

- **Branch from `main`.** One topic per PR.
- **Write commit messages in the imperative,** with a short subject, then a body explaining *why*.
- **Add a changeset** for anything in `packages/*`: patch for a fix or a Figma value change, minor for a new component, token or owned property, major for a removed or renamed token, tag or API.
- **CODEOWNERS** require design-system review for `alias-map.mjs`, `inherited.json`, `parts.css`, the upstream snapshots, `exceptions.json` and the release files.

---

## Review checklist

- [ ] `npm run verify` and `npm run audit:full` pass
- [ ] No hand-written colors or lengths; no edits to generated files
- [ ] New component: `exports`, `index.ts`, story (`autodocs`), JSDoc on every public API, at least 3 tests
- [ ] `waDependencies` matches the template and imports
- [ ] Every control has an accessible name that reaches the real input; keyboard and focus work
- [ ] Any exception is registered with a reason, owner and review date
- [ ] Docs updated (README section or Storybook guide) and use no typed `&&`
- [ ] Changeset added for changes in `packages/*`
