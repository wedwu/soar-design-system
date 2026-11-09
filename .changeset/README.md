# Changesets

Run `npm run changeset` for any change to a package in `packages/`. The five packages (`tokens`, `theme`, `components`, `cdn`, `soar`) are versioned together (`fixed` in `config.json`), so one version number means one consistent set of Figma tokens, WA pin and components. It's also the version in the self-hosted CDN path (`/soar-awesome/<version>/`).

Nothing is published to npmjs or any registry. All packages are `private` (`privatePackages.version` lets Changesets version them anyway). A release builds the `@soar-awesome/soar` tarball that apps install by URL (`npm run cdn:stage`).

Guidance for bumps:

- **Figma value change**: patch. **New token or newly owned WA property**: minor.
- **Removed or renamed token**: major, because consumers may reference `--ax-*` directly.
- **Web Awesome minor bump**: at least minor. Inherited defaults may have changed, so say so in the changeset.
