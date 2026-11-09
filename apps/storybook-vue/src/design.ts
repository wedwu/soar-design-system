/// <reference types="vite/client" />
// Design tabs (@storybook/addon-designs) for a component's stories.
//
//   Web Awesome docs  always: the upstream docs page for the atom
//   Figma             only when STORYBOOK_FIGMA_FILE_URL is set: the frame, embedded
//   Open in Figma     same: a link, for when the embed needs a sign-in
//
// The Figma file URL comes from the environment (apps/storybook-vue/.env, see
// .env.example), never from the repo, so the file key isn't committed. Each
// component's frame is its `design.figmaNodeId` in its .data.json.

export interface ComponentDesign {
  /** Figma frame id from the URL's node-id, e.g. "12-34". Empty: the whole file. */
  figmaNodeId?: string;
  /** Web Awesome docs slug, e.g. "drawer" for webawesome.com/docs/components/drawer. */
  webAwesomeDocs: string;
}

const FIGMA_FILE_URL = import.meta.env.STORYBOOK_FIGMA_FILE_URL as string | undefined;

function figmaUrl(nodeId?: string) {
  if (!FIGMA_FILE_URL) return undefined;
  const url = new URL(FIGMA_FILE_URL);
  if (nodeId) url.searchParams.set('node-id', nodeId);
  return url.toString();
}

/** The `parameters.design` value: one Design tab per entry. */
export function designTabs({ figmaNodeId, webAwesomeDocs }: ComponentDesign) {
  const figma = figmaUrl(figmaNodeId);
  return [
    ...(figma ? [{ name: 'Figma', type: 'figma', url: figma }] : []),
    { name: 'Web Awesome docs', type: 'iframe', url: `https://webawesome.com/docs/components/${webAwesomeDocs}` },
    ...(figma ? [{ name: 'Open in Figma', type: 'link', url: figma, label: 'Open in Figma' }] : []),
  ];
}
