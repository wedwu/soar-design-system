// Soar components carry their own unit tests. Atoms are tested upstream by
// Web Awesome, so this check doesn't apply to them.
import { read } from '../context.mjs';

const MIN_TESTS = 3;

export default {
  id: 'tests',
  title: 'Unit tests',
  description: `Soar components have a *.test.ts file with at least ${MIN_TESTS} tests.`,
  appliesTo: ['molecule', 'organism'],
  run(component) {
    if (!component.testFile) {
      return [{ level: 'warn', rule: 'missing', message: `No ${component.tag}.test.ts next to the component.` }];
    }
    const count = (read(component.testFile).match(/\bit\(/g) ?? []).length;
    return count < MIN_TESTS
      ? [{ level: 'warn', rule: 'too-few', file: component.testFile, message: `Only ${count} test(s); aim for at least ${MIN_TESTS}.` }]
      : [{ level: 'info', rule: 'count', file: component.testFile, message: `${count} tests` }];
  },
};
