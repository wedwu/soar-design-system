// Atoms are Web Awesome's. Make sure the elements we document still exist in
// the Web Awesome version we ship (the snapshot), so an upgrade that removes or
// renames one fails here instead of leaving a broken docs page.
export default {
  id: 'upstream',
  title: 'Upstream',
  description: 'The Web Awesome elements an atom documents still exist in the shipped Web Awesome version.',
  appliesTo: ['atom'],
  run(component, ctx) {
    return component.tags
      .filter((tag) => !ctx.parts.elements[tag])
      .map((tag) => ({ level: 'error', rule: 'upstream', file: component.storyFile, message: `<${tag}> isn't in Web Awesome ${ctx.upstream.version}` }));
  },
};
