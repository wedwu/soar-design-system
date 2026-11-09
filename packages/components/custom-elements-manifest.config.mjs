// Config for `cem analyze` (custom-elements.json drives Storybook docs and the
// component audit's docs check).
export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
  litelement: true,
  plugins: [
    {
      // The analyzer misreads two things as public API. Clean them up so docs
      // only show what consumers can actually use:
      //  - AxElement.emit(name, ...) dispatches `new CustomEvent(name)`, which the
      //    analyzer records as an event literally called "name" on every component.
      //  - Reactive *state* (protected/private fields in `static properties`) is
      //    listed as attributes.
      name: 'soar-clean-public-api',
      packageLinkPhase({ customElementsManifest }) {
        for (const mod of customElementsManifest.modules ?? []) {
          for (const decl of mod.declarations ?? []) {
            if (decl.events) decl.events = decl.events.filter((e) => !(e.name === 'name' && e.inheritedFrom?.name === 'AxElement'));
            const hidden = new Set((decl.members ?? []).filter((m) => m.privacy === 'protected' || m.privacy === 'private').map((m) => m.name));
            if (decl.attributes) decl.attributes = decl.attributes.filter((a) => !hidden.has(a.fieldName));
          }
        }
      },
    },
  ],
};
