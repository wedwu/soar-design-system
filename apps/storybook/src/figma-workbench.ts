// Docs-only widget for the "Figma Generation" page. Not shipped.
//
// It runs the REAL token pipeline in the browser (normalize, diff, canonicalize
// and the alias map from @soar-awesome/tokens), so what it shows is exactly
// what `npm run figma:pull` followed by `npm run tokens` would produce.
//
// Three tabs:
//   Look up a token     search any token and see everything about it
//   Retrieve from Figma fetch live variables with a personal access token
//                       (or load a JSON export) and diff against the repo
//   Add a variable      preview a new variable end to end; optionally create it in Figma
//
// The access token lives only in this element's memory. It is sent only to
// api.figma.com and is never stored or logged.

import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import committedExport from '@soar-awesome/tokens/figma/export.json';
import { normalize, cssVarFor } from '@soar-awesome/tokens/src/normalize.mjs';
import { diffFigma } from '@soar-awesome/tokens/src/diff.mjs';
import { canonicalize } from '@soar-awesome/tokens/src/canonicalize.mjs';
import { owned, appFacing } from '@soar-awesome/tokens/src/alias-map.mjs';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';

// ---------------------------------------------------------------------------
// Types for the Figma Variables REST payload (only what we use)

type Rgba = { r: number; g: number; b: number; a?: number };
type Alias = { type: 'VARIABLE_ALIAS'; id: string };
type FigmaValue = Rgba | Alias | number | string | boolean;
interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, FigmaValue>;
  variableCollectionId: string;
  description?: string;
  scopes?: string[];
}
interface FigmaCollection {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  variableIds: string[];
}
interface FigmaExport {
  meta: { variableCollections: Record<string, FigmaCollection>; variables: Record<string, FigmaVariable> };
}
interface Token {
  id: string;
  name: string;
  cssVar: string;
  type: string;
  collection: string;
  description?: string;
  values: Record<string, string>;
}

const API = 'https://api.figma.com/v1';
const COMMITTED = committedExport as unknown as FigmaExport;
const COMMITTED_LABEL = 'the repo (packages/tokens/figma/export.json)';

const feedsByName = new Map<string, string[]>();
for (const [wa, name] of Object.entries(owned as Record<string, string>)) feedsByName.set(name, [...(feedsByName.get(name) ?? []), wa]);

const isAlias = (v: unknown): v is Alias => !!v && typeof v === 'object' && (v as Alias).type === 'VARIABLE_ALIAS';

function hexToRgba(hex: string): Rgba {
  const h = hex.replace('#', '');
  const n = (i: number) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 10000) / 10000;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
}

/** File key from a raw key or any figma.com file/design URL. */
export function parseFileKey(input: string) {
  const m = /figma\.com\/(?:file|design|board)\/([A-Za-z0-9]+)/.exec(input);
  return (m ? m[1] : input).trim();
}

function download(name: string, text: string) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([text], { type: 'application/json' })),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------------------------------------------------------------------------

export class AxDocsFigmaWorkbench extends LitElement {
  static override properties = {
    source: { state: true },
    sourceLabel: { state: true },
    query: { state: true },
    selected: { state: true },
    fileKey: { state: true },
    accessToken: { state: true },
    status: { state: true },
    retrieved: { state: true },
    draft: { state: true },
    createResult: { state: true },
  };

  /** The export everything on the page reads from. Starts as the repo's committed file. */
  source: FigmaExport = COMMITTED;
  sourceLabel = COMMITTED_LABEL;
  query = '';
  selected = '';
  fileKey = '';
  accessToken = '';
  status: { kind: 'idle' | 'loading' | 'ok' | 'error'; message?: string } = { kind: 'idle' };
  retrieved: FigmaExport | null = null;
  draft = {
    collectionId: Object.keys(COMMITTED.meta.variableCollections)[0],
    name: '',
    type: 'COLOR' as FigmaVariable['resolvedType'],
    description: '',
    values: {} as Record<string, string>, // modeId -> hex | number | text | "alias:<id>"
  };
  createResult: { kind: 'ok' | 'error'; message: string } | null = null;

  // ---- derived ------------------------------------------------------------

  #tokensCache = new WeakMap<FigmaExport, { tokens: Token[]; error?: string }>();
  tokensOf(exp: FigmaExport) {
    let entry = this.#tokensCache.get(exp);
    if (!entry) {
      try {
        entry = { tokens: normalize(exp) as Token[] };
      } catch (e) {
        entry = { tokens: [], error: (e as Error).message };
      }
      this.#tokensCache.set(exp, entry);
    }
    return entry;
  }

  get tokens() {
    return this.tokensOf(this.source).tokens;
  }

  resolve(token: Token, mode: string): string {
    const byVar = new Map(this.tokens.map((t) => [t.cssVar, t]));
    let t: Token | undefined = token;
    let v = t.values[mode] ?? t.values.base;
    for (let i = 0; v?.startsWith('var(--ax-') && i < 20; i++) {
      t = byVar.get(v.slice(4, -1));
      if (!t) break;
      v = t.values[mode] ?? t.values.base;
    }
    return v;
  }

  // ---- styles -------------------------------------------------------------

  static override styles = css`
    :host {
      display: block;
      font-family: var(--wa-font-family-body);
      color: var(--wa-color-text-normal);
      border: var(--wa-border-width-s) solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
      background: var(--wa-color-surface-default);
      padding: var(--wa-space-s) var(--wa-space-l) var(--wa-space-l);
    }
    .source {
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-quiet);
      margin: var(--wa-space-s) 0;
    }
    .stack {
      display: grid;
      gap: var(--wa-space-m);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--wa-space-s);
      align-items: end;
    }
    .row > wa-input,
    .row > wa-select {
      flex: 1 1 14rem;
    }
    .results {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: var(--wa-space-2xs);
      max-height: 9rem;
      overflow: auto;
    }
    .result {
      all: unset;
      cursor: pointer;
      font-family: var(--wa-font-family-code);
      font-size: var(--wa-font-size-xs);
      padding: var(--wa-space-3xs) var(--wa-space-xs);
      border-radius: var(--wa-border-radius-s);
      border: var(--wa-border-width-s) solid var(--wa-color-surface-border);
    }
    .result:hover,
    .result[aria-pressed='true'] {
      background: var(--wa-color-brand-fill-quiet);
      border-color: var(--wa-color-brand-border-normal);
    }
    .result:focus-visible {
      outline: var(--wa-focus-ring);
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--wa-space-2xs) var(--wa-space-m);
      margin: 0;
      font-size: var(--wa-font-size-s);
    }
    dt {
      color: var(--wa-color-text-quiet);
    }
    dd {
      margin: 0;
    }
    code,
    pre {
      font-family: var(--wa-font-family-code);
      font-size: var(--wa-font-size-xs);
    }
    pre {
      margin: 0;
      padding: var(--wa-space-s);
      background: var(--wa-color-surface-lowered);
      border-radius: var(--wa-border-radius-m);
      overflow: auto;
      max-height: 18rem;
    }
    .swatch {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: -0.15em;
      border-radius: var(--wa-border-radius-s);
      border: var(--wa-border-width-s) solid var(--wa-color-surface-border);
      margin-inline-end: var(--wa-space-2xs);
    }
    h4 {
      margin: var(--wa-space-s) 0 var(--wa-space-2xs);
      font-size: var(--wa-font-size-s);
    }
    ul {
      margin: 0;
      padding-inline-start: var(--wa-space-l);
      font-size: var(--wa-font-size-s);
    }
    .muted {
      color: var(--wa-color-text-quiet);
      font-size: var(--wa-font-size-s);
    }
  `;

  // ---- render -------------------------------------------------------------

  override render() {
    return html`
      <wa-tab-group>
        <wa-tab slot="nav" panel="lookup">Look up a token</wa-tab>
        <wa-tab slot="nav" panel="retrieve">Retrieve from Figma</wa-tab>
        <wa-tab slot="nav" panel="add">Add a variable</wa-tab>
        <wa-tab-panel name="lookup">${this.renderLookup()}</wa-tab-panel>
        <wa-tab-panel name="retrieve">${this.renderRetrieve()}</wa-tab-panel>
        <wa-tab-panel name="add">${this.renderAdd()}</wa-tab-panel>
      </wa-tab-group>
    `;
  }

  renderSourceLine() {
    const { tokens, error } = this.tokensOf(this.source);
    return html`<p class="source">
      Reading <strong>${tokens.length}</strong> variables from ${this.sourceLabel}.
      ${this.source !== COMMITTED
        ? html`<wa-button size="small" appearance="plain" @click=${() => this.useSource(COMMITTED, COMMITTED_LABEL)}>Back to the repo version</wa-button>`
        : nothing}
      ${error ? html`<wa-callout variant="danger">${error}</wa-callout>` : nothing}
    </p>`;
  }

  // ---- Look up --------------------------------------------------------------

  renderLookup() {
    const q = this.query.trim().toLowerCase();
    const matches = q
      ? this.tokens.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.cssVar.includes(q) ||
            (feedsByName.get(t.name) ?? []).some((wa) => wa.includes(q)),
        )
      : this.tokens;
    const token = this.tokens.find((t) => t.name === this.selected) ?? (matches.length === 1 ? matches[0] : undefined);

    return html`<div class="stack">
      ${this.renderSourceLine()}
      <wa-input
        label="Search"
        hint="A Figma name (color/brand/50), a CSS variable (--ax-space-m) or a Web Awesome property (--wa-color-text-link)"
        with-clear
        .value=${this.query}
        @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value ?? '')}
      ></wa-input>
      ${matches.length === 0
        ? html`<p class="muted">No matches.</p>`
        : html`<ul class="results" aria-label="Matching tokens">
            ${matches.slice(0, 120).map(
              (t) => html`<li>
                <button class="result" aria-pressed=${String(t.name === token?.name)} @click=${() => (this.selected = t.name)}>${t.name}</button>
              </li>`,
            )}
          </ul>`}
      ${token ? this.renderToken(token) : html`<p class="muted">Choose a token to see its data.</p>`}
    </div>`;
  }

  renderToken(t: Token): TemplateResult {
    const raw = this.source.meta.variables[t.id];
    const modes = Object.keys(t.values);
    const feeds = feedsByName.get(t.name) ?? [];
    const isApp = (appFacing as RegExp[]).some((re) => re.test(t.name));
    const where = modes.includes('base') ? 'tokens.css' : modes.map((m) => `${m}.css`).join(' and ');
    const scssName = `$${t.cssVar.slice(2)}`;

    return html`
      <h4>${t.name}</h4>
      <dl>
        <dt>CSS variable</dt><dd><code>${t.cssVar}</code></dd>
        <dt>Type</dt><dd>${t.type}</dd>
        <dt>Figma collection</dt><dd>${t.collection}</dd>
        <dt>Figma variable ID</dt><dd><code>${t.id}</code></dd>
        ${t.description ? html`<dt>Description</dt><dd>${t.description}</dd>` : nothing}
        ${modes.map(
          (m) => html`<dt>Value (${m})</dt>
            <dd>
              ${t.type === 'color' ? html`<span class="swatch" style=${`background:${this.resolve(t, m)}`}></span>` : nothing}
              <code>${t.values[m]}</code>
              ${t.values[m] !== this.resolve(t, m) ? html` → <code>${this.resolve(t, m)}</code>` : nothing}
            </dd>`,
        )}
        <dt>Drives Web Awesome</dt>
        <dd>
          ${feeds.length
            ? feeds.map((f) => html`<code>${f}</code> `)
            : isApp
              ? html`Nothing. This is an <strong>app-facing</strong> token, used directly by apps.`
              : html`Nothing yet. Add it to <code>alias-map.mjs</code> to make it set a <code>--wa-*</code> property.`}
        </dd>
      </dl>
      <h4>Generated code</h4>
      <pre>/* ${where} */
${modes.map((m) => `${t.cssVar}: ${t.values[m]};${modes.length > 1 ? `   /* ${m} */` : ''}`).join('\n')}
${feeds.length ? `\n/* webawesome.css */\n${feeds.map((f) => `${f}: var(${t.cssVar});`).join('\n')}\n` : ''}
/* use it */
color: var(${t.cssVar});                       /* CSS */
import { tokens } from '@soar-awesome/tokens';
tokens['${t.name}'].cssVar;                     /* JS */
${scssName}                                     /* SCSS */</pre>
      ${raw
        ? html`<details>
            <summary class="muted">Raw Figma variable</summary>
            <pre>${JSON.stringify(raw, null, 2)}</pre>
          </details>`
        : nothing}
    `;
  }

  // ---- Retrieve -------------------------------------------------------------

  async retrieve() {
    const key = parseFileKey(this.fileKey);
    if (!key || !this.accessToken) {
      this.status = { kind: 'error', message: 'Enter a Figma file key (or file URL) and a personal access token.' };
      return;
    }
    this.status = { kind: 'loading', message: 'Retrieving variables from Figma…' };
    try {
      const res = await fetch(`${API}/files/${encodeURIComponent(key)}/variables/local`, {
        headers: { 'X-Figma-Token': this.accessToken },
      });
      if (!res.ok) {
        const hint =
          res.status === 403
            ? 'The token was rejected or lacks the file_variables:read scope. The Variables API also requires a Figma Enterprise seat.'
            : res.status === 404
              ? 'No file with that key, or the token can\'t access it.'
              : '';
        throw new Error(`Figma responded ${res.status}. ${hint}`);
      }
      this.loadExport(await res.json(), `Figma file ${key} (retrieved ${new Date().toLocaleTimeString()})`);
    } catch (e) {
      const msg = (e as Error).message;
      this.status = {
        kind: 'error',
        message: msg.includes('Failed to fetch')
          ? 'Couldn\'t reach api.figma.com from this browser (network or CORS). Run `npm run figma:pull` instead, or load a JSON export below.'
          : msg,
      };
    }
  }

  async loadFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.loadExport(JSON.parse(await file.text()), `the file ${file.name}`);
    } catch (err) {
      this.status = { kind: 'error', message: `Couldn't read ${file.name}: ${(err as Error).message}` };
    }
  }

  loadExport(payload: unknown, label: string) {
    const p = payload as { meta?: unknown };
    if (!p?.meta) {
      this.status = { kind: 'error', message: 'That isn\'t a Figma Variables payload (no "meta" with variables and collections).' };
      return;
    }
    const canonical = canonicalize(payload) as FigmaExport;
    const { error } = this.tokensOf(canonical);
    if (error) {
      this.status = { kind: 'error', message: `Retrieved, but the token pipeline rejected it: ${error}` };
      return;
    }
    this.retrieved = canonical;
    this.useSource(canonical, label);
    this.status = { kind: 'ok', message: `Loaded ${Object.keys(canonical.meta.variables).length} variables from ${label}.` };
  }

  useSource(exp: FigmaExport, label: string) {
    this.source = exp;
    this.sourceLabel = label;
    this.selected = '';
  }

  renderRetrieve() {
    const diff = this.source !== COMMITTED ? this.safeDiff(COMMITTED, this.source) : null;
    return html`<div class="stack">
      <p class="muted">
        Retrieve your live Figma variables and compare them with the repo. The same pipeline runs here as in
        <code>npm run figma:pull</code>. Your token stays in this page's memory and is only sent to <code>api.figma.com</code>.
      </p>
      <div class="row">
        <wa-input
          label="Figma file key or URL"
          placeholder="https://www.figma.com/design/AbC123…/Soar"
          .value=${this.fileKey}
          @input=${(e: Event) => (this.fileKey = (e.target as HTMLInputElement).value ?? '')}
        ></wa-input>
        <wa-input
          label="Personal access token"
          type="password"
          password-toggle
          hint="Figma → Settings → Security → Personal access tokens (scope: file_variables:read)"
          .value=${this.accessToken}
          @input=${(e: Event) => (this.accessToken = (e.target as HTMLInputElement).value ?? '')}
        ></wa-input>
      </div>
      <div class="row">
        <wa-button variant="brand" ?loading=${this.status.kind === 'loading'} @click=${() => this.retrieve()}>Retrieve variables</wa-button>
        <wa-button appearance="outlined" @click=${() => (this.renderRoot.querySelector('#file') as HTMLInputElement).click()}>Load a JSON export…</wa-button>
        <input id="file" type="file" accept="application/json,.json" hidden @change=${(e: Event) => this.loadFile(e)} />
      </div>
      ${this.status.kind === 'error' ? html`<wa-callout variant="danger">${this.status.message}</wa-callout>` : nothing}
      ${this.status.kind === 'ok' ? html`<wa-callout variant="success">${this.status.message}</wa-callout>` : nothing}
      ${this.renderSourceLine()}
      ${diff ? this.renderDiff(diff) : html`<p class="muted">Retrieve or load an export to see how it differs from the repo.</p>`}
    </div>`;
  }

  safeDiff(a: FigmaExport, b: FigmaExport) {
    try {
      return diffFigma(a, b) as {
        added: Token[];
        removed: (Token & { feeds: string[] })[];
        renamed: { from: string; to: string; feeds: string[] }[];
        changed: { name: string; mode: string; from?: string; to?: string; feeds: string[] }[];
        blocking: string[];
      };
    } catch (e) {
      return { added: [], removed: [], renamed: [], changed: [], blocking: [(e as Error).message] };
    }
  }

  renderDiff(d: ReturnType<AxDocsFigmaWorkbench['safeDiff']>) {
    const none = !d.added.length && !d.removed.length && !d.renamed.length && !d.changed.length && !d.blocking.length;
    return html`
      <h4>Compared with the repo</h4>
      ${none ? html`<wa-callout variant="success">No differences. The repo is up to date with this export.</wa-callout>` : nothing}
      ${d.blocking.length
        ? html`<wa-callout variant="danger"><strong>Needs a decision before merging:</strong><ul>${d.blocking.map((b) => html`<li>${b}</li>`)}</ul></wa-callout>`
        : nothing}
      ${d.changed.length
        ? html`<h4>Changed values (${d.changed.length})</h4>
            <ul>${d.changed.map((c) => html`<li><code>${c.name}</code> [${c.mode}]: <code>${c.from}</code> → <code>${c.to}</code>${c.feeds.length ? html`, affects ${c.feeds.map((f) => html`<code>${f}</code> `)}` : nothing}</li>`)}</ul>`
        : nothing}
      ${d.added.length ? html`<h4>Added (${d.added.length})</h4><ul>${d.added.map((t) => html`<li><code>${t.name}</code> (${t.type}) → <code>${t.cssVar}</code></li>`)}</ul>` : nothing}
      ${d.renamed.length ? html`<h4>Renamed (${d.renamed.length})</h4><ul>${d.renamed.map((r) => html`<li><code>${r.from}</code> → <code>${r.to}</code></li>`)}</ul>` : nothing}
      ${d.removed.length ? html`<h4>Removed (${d.removed.length})</h4><ul>${d.removed.map((t) => html`<li><code>${t.name}</code></li>`)}</ul>` : nothing}
      ${none
        ? nothing
        : html`<div class="row">
            <wa-button appearance="outlined" @click=${() => download('export.json', JSON.stringify(this.source, null, 2) + '\n')}>Download export.json</wa-button>
            <span class="muted">Replace <code>packages/tokens/figma/export.json</code> with it, then run <code>npm run tokens</code>. Or run <code>npm run figma:pull</code>, which does both.</span>
          </div>`}
    `;
  }

  // ---- Add ------------------------------------------------------------------

  get draftCollection() {
    return this.source.meta.variableCollections[this.draft.collectionId] ?? Object.values(this.source.meta.variableCollections)[0];
  }

  setDraft(patch: Partial<AxDocsFigmaWorkbench['draft']>) {
    this.draft = { ...this.draft, ...patch };
    this.createResult = null;
  }

  /** The draft as a Figma variable, plus validation errors. */
  draftVariable(): { variable?: FigmaVariable; errors: string[] } {
    const errors: string[] = [];
    const { name, type, values, description } = this.draft;
    const coll = this.draftCollection;
    if (!/^[a-z0-9-]+(\/[a-z0-9-]+)+$/.test(name)) errors.push('Name must be lowercase segments separated by slashes, e.g. color/accent/50.');
    if (this.tokens.some((t) => t.name === name)) errors.push(`A variable named "${name}" already exists.`);
    else if (name && this.tokens.some((t) => t.cssVar === cssVarFor(name))) errors.push(`Another variable already produces ${cssVarFor(name)}.`);

    const valuesByMode: Record<string, FigmaValue> = {};
    for (const mode of coll.modes) {
      const v = values[mode.modeId] ?? '';
      if (v.startsWith('alias:')) valuesByMode[mode.modeId] = { type: 'VARIABLE_ALIAS', id: v.slice(6) };
      else if (type === 'COLOR') {
        if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)) errors.push(`${mode.name}: enter a hex color like #3355ff.`);
        else valuesByMode[mode.modeId] = hexToRgba(v);
      } else if (type === 'FLOAT') {
        if (v === '' || Number.isNaN(Number(v))) errors.push(`${mode.name}: enter a number (Figma numbers are unitless, e.g. 24 for 24px).`);
        else valuesByMode[mode.modeId] = Number(v);
      } else {
        if (!v) errors.push(`${mode.name}: enter a value.`);
        valuesByMode[mode.modeId] = v;
      }
    }
    if (errors.length) return { errors };
    return {
      errors,
      variable: {
        id: 'VariableID:preview:1',
        name,
        resolvedType: type,
        valuesByMode,
        variableCollectionId: coll.id,
        description,
        scopes: type === 'COLOR' ? ['ALL_SCOPES'] : [],
      },
    };
  }

  withDraft(variable: FigmaVariable): FigmaExport {
    const next = structuredClone(this.source);
    next.meta.variables[variable.id] = variable;
    next.meta.variableCollections[variable.variableCollectionId].variableIds.push(variable.id);
    return next;
  }

  /** Body for POST /v1/files/:key/variables that creates the draft in Figma. */
  createPayload(v: FigmaVariable) {
    const tempId = 'new_variable';
    return {
      variables: [{ action: 'CREATE', id: tempId, name: v.name, variableCollectionId: v.variableCollectionId, resolvedType: v.resolvedType, description: v.description ?? '' }],
      variableModeValues: Object.entries(v.valuesByMode).map(([modeId, value]) => ({ variableId: tempId, modeId, value })),
    };
  }

  async createInFigma(v: FigmaVariable) {
    const key = parseFileKey(this.fileKey);
    if (!window.confirm(`Create "${v.name}" in Figma file ${key}? This writes to the real Figma file.`)) return;
    try {
      const res = await fetch(`${API}/files/${encodeURIComponent(key)}/variables`, {
        method: 'POST',
        headers: { 'X-Figma-Token': this.accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(this.createPayload(v)),
      });
      const body = await res.text();
      if (!res.ok) throw new Error(`Figma responded ${res.status}: ${body.slice(0, 300)}${res.status === 403 ? ' (needs the file_variables:write scope and an Enterprise seat)' : ''}`);
      this.createResult = { kind: 'ok', message: `Created "${v.name}" in Figma. Retrieving the file again…` };
      await this.retrieve();
    } catch (e) {
      this.createResult = { kind: 'error', message: (e as Error).message };
    }
  }

  renderAdd() {
    const coll = this.draftCollection;
    const { variable, errors } = this.draftVariable();
    let token: Token | undefined;
    let pipelineError = '';
    if (variable) {
      const result = this.tokensOf(this.withDraft(variable));
      pipelineError = result.error ?? '';
      token = result.tokens.find((t) => t.name === variable.name);
    }
    const sameType = this.tokens.filter((t) => this.source.meta.variables[t.id]?.resolvedType === this.draft.type);
    const canCreate = !!variable && !!this.accessToken && !!parseFileKey(this.fileKey);

    return html`<div class="stack">
      <p class="muted">
        Sketch a new Figma variable and see exactly what the pipeline will generate from it. Nothing changes until you choose
        <em>Add to this page</em>, which adds it to this page's working copy only, or <em>Create in Figma</em>.
      </p>
      <div class="row">
        <wa-select label="Collection" .value=${coll.id} @change=${(e: Event) => this.setDraft({ collectionId: (e.target as HTMLSelectElement).value, values: {} })}>
          ${Object.values(this.source.meta.variableCollections).map(
            (c) => html`<wa-option value=${c.id}>${c.name} (${c.modes.map((m) => m.name).join(', ')})</wa-option>`,
          )}
        </wa-select>
        <wa-select label="Type" .value=${this.draft.type} @change=${(e: Event) => this.setDraft({ type: (e.target as HTMLSelectElement).value as FigmaVariable['resolvedType'], values: {} })}>
          <wa-option value="COLOR">Color</wa-option>
          <wa-option value="FLOAT">Number</wa-option>
          <wa-option value="STRING">String</wa-option>
        </wa-select>
      </div>
      <div class="row">
        <wa-input
          label="Name"
          placeholder="color/accent/50"
          hint=${this.draft.name ? `Becomes ${cssVarFor(this.draft.name)}` : 'Lowercase, slash-separated, as in Figma'}
          .value=${this.draft.name}
          @input=${(e: Event) => this.setDraft({ name: ((e.target as HTMLInputElement).value ?? '').trim() })}
        ></wa-input>
        <wa-input label="Description (optional)" .value=${this.draft.description} @input=${(e: Event) => this.setDraft({ description: (e.target as HTMLInputElement).value ?? '' })}></wa-input>
      </div>
      ${coll.modes.map((mode) => {
        const v = this.draft.values[mode.modeId] ?? '';
        const setValue = (value: string) => this.setDraft({ values: { ...this.draft.values, [mode.modeId]: value } });
        return html`<div class="row">
          <wa-input
            label=${`Value: ${mode.name}`}
            placeholder=${this.draft.type === 'COLOR' ? '#3355ff' : this.draft.type === 'FLOAT' ? '24' : 'Inter, sans-serif'}
            .value=${v.startsWith('alias:') ? '' : v}
            ?disabled=${v.startsWith('alias:')}
            @input=${(e: Event) => setValue((e.target as HTMLInputElement).value ?? '')}
          ></wa-input>
          <wa-select
            label="…or alias another variable"
            with-clear
            .value=${v.startsWith('alias:') ? v.slice(6) : ''}
            @change=${(e: Event) => {
              const id = (e.target as HTMLSelectElement).value;
              setValue(id ? `alias:${id}` : '');
            }}
          >
            ${sameType.map((t) => html`<wa-option value=${t.id}>${t.name}</wa-option>`)}
          </wa-select>
        </div>`;
      })}
      ${this.draft.name && errors.length ? html`<wa-callout variant="warning"><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></wa-callout>` : nothing}
      ${pipelineError ? html`<wa-callout variant="danger">The pipeline rejected this variable: ${pipelineError}</wa-callout>` : nothing}
      ${token && variable
        ? html`
            <h4>What the pipeline generates</h4>
            ${this.renderToken(token)}
            <h4>Next steps</h4>
            <ul>
              <li>To make it drive Web Awesome, add a line to <code>packages/tokens/src/alias-map.mjs</code>, e.g. <code>'--wa-…': '${token.name}'</code>.</li>
              <li>Once it exists in Figma, <code>npm run figma:pull</code> (or the nightly Figma sync PR) brings it into the repo.</li>
            </ul>
            <h4>Figma REST request that would create it</h4>
            <pre>POST ${API}/files/${parseFileKey(this.fileKey) || '{file_key}'}/variables
${JSON.stringify(this.createPayload(variable), null, 2)}</pre>
            <div class="row">
              <wa-button
                variant="brand"
                @click=${() => {
                  this.useSource(this.withDraft({ ...variable, id: `VariableID:preview:${Date.now()}` }), 'this page\'s working copy (includes your added variable)');
                  this.selected = variable.name;
                  this.query = '';
                  this.setDraft({ name: '', values: {}, description: '' });
                  // Show the result: switch to the Look up tab.
                  (this.renderRoot.querySelector('wa-tab-group') as HTMLElement & { active: string }).active = 'lookup';
                }}
              >Add to this page</wa-button>
              <wa-button appearance="outlined" ?disabled=${!canCreate} @click=${() => this.createInFigma(variable)}>Create in Figma</wa-button>
              ${canCreate ? nothing : html`<span class="muted">To create it in Figma, enter a file key and access token on the <em>Retrieve from Figma</em> tab.</span>`}
            </div>
            ${this.createResult ? html`<wa-callout variant=${this.createResult.kind === 'ok' ? 'success' : 'danger'}>${this.createResult.message}</wa-callout>` : nothing}
          `
        : nothing}
    </div>`;
  }
}

if (!customElements.get('ax-docs-figma-workbench')) customElements.define('ax-docs-figma-workbench', AxDocsFigmaWorkbench);
