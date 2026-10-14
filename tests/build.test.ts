// @vitest-environment node
import { expect, it } from 'vitest';

it('0001.8 injects the package version without build metadata', async () => {
  const { default: config } = await import('../rollup.config.mjs');
  const replacer = config.plugins.find((plugin: { name: string }) => plugin.name === 'replace');
  const built = replacer.transform("readonly version = '__stratumLibraryVersion__';", 'injector.ts');
  expect(built.code).toMatch(/'\d+\.\d+\.\d+'/);
  expect(built.code).not.toContain('+');
});
