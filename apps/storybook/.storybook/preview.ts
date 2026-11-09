import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import customElements from '@soar-awesome/components/custom-elements.json';
import { breakpoints } from '@soar-awesome/tokens';

// Same load order a consuming app uses: Web Awesome, then the Soar theme.
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@soar-awesome/theme/soar.css';
import './preview.css';

// Atoms: each story imports the Web Awesome components it uses, as an app would.

// Molecules and organisms are ours.
import '@soar-awesome/components';

// Docs-only <ax-docs-updated>, for any MDX page or story, and the badge it renders.
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '../src/updated-badge';

setCustomElementsManifest(customElements);

const preview: Preview = {
  globalTypes: {
    scheme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { scheme: 'light' },
  decorators: [
    (story, context) => {
      const dark = context.globals.scheme === 'dark';
      document.documentElement.classList.toggle('wa-dark', dark);
      document.documentElement.classList.toggle('wa-light', !dark);
      return story();
    },
  ],
  parameters: {
    layout: 'padded',
    // Viewport toolbar: Soar's breakpoints from Figma (min widths, at a 16px root).
    viewport: {
      options: Object.fromEntries(
        Object.entries(breakpoints).map(([name, value]) => {
          const px = Math.round(parseFloat(value) * (value.endsWith('rem') ? 16 : 1));
          return [`soar-${name}`, { name: `Soar ${name} (${px}px)`, styles: { width: `${px}px`, height: '100%' }, type: px < 768 ? 'mobile' : px < 1024 ? 'tablet' : 'desktop' }];
        }),
      ),
    },
    controls: { expanded: true },
    options: {
      storySort: {
        order: ['Introduction', 'Guides', ['Available Components', 'Component Audit', 'Figma Generation', 'Breakpoints', 'Slots', 'CSS Shadow Parts', 'Font Licensing', 'Terms'], 'Foundations', 'Atoms', 'Molecules', 'Organisms'],
      },
    },
  },
};

export default preview;
