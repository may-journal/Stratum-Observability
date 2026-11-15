/**
 * Alias window to globalThis during test runs where window is not available.
 * Window is still referenced directly in NR plugins.
 */
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
  writable: true
});
