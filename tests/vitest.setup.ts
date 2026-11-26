import { WINDOW_GLOBAL } from './utils/constants';

/**
 * Alias window to globalThis during test runs where window is not available.
 * Window is still referenced directly in NR plugins.
 */
Object.defineProperty(globalThis, WINDOW_GLOBAL, {
  value: globalThis,
  configurable: true,
  writable: true
});
