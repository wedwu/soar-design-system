// Single-file CDN entry: every Soar component (Lit inlined, Web Awesome not)
// plus the autoloader that asks WA's loader for each component's dependencies.
export * from '@soar-awesome/components';
import { startAutoloader } from './autoloader.js';

startAutoloader();
