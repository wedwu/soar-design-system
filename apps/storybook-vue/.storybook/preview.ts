import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';

// Docs-only <ax-docs-updated>, for any MDX page or story.
import '../../storybook/src/updated-badge';

// wa-* and ax-* tags are custom elements loaded from the CDN, not Vue
// components, so Vue must leave them to the browser.
setup((app) => {
  app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('wa-') || tag.startsWith('ax-');
});

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    // Sidebar: guides first, then the atoms.
    options: { storySort: { order: ['Guides', ['Available Components'], 'Atoms'] } },
  },
};

export default preview;
