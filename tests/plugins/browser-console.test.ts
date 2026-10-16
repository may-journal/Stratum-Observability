import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { StratumService } from '../../src';
import { type BrowserConsolePlugin, BrowserConsolePluginFactory } from '../../src/plugins/browser-console';
import { BASE_CATALOG } from '../utils/catalog';
import { CATALOG_METADATA } from '../utils/constants';
import { createService, restoreStratumMocks, spyOnPublish } from '../utils/helpers';

describe('browser console plugin', () => {
  let stratum: StratumService;
  let plugin: BrowserConsolePlugin;
  let consoleSpy: Mock;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    plugin = BrowserConsolePluginFactory();
    stratum = createService({ catalog: { items: BASE_CATALOG, ...CATALOG_METADATA }, plugins: [plugin] });
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  it('0101.1 publishes and logs one line per event to the console', async () => {
    const publishSpy = spyOnPublish(plugin.publishers[0]);
    const expectedContent = JSON.stringify({ eventType: BASE_CATALOG[1].eventType, id: BASE_CATALOG[1].id, key: '1' });

    expect(await stratum.publish(1)).toBe(true);
    expect(publishSpy).toHaveBeenCalledExactlyOnceWith(expectedContent, expect.anything());
    expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(`BrowserConsolePlugin: ${expectedContent}`);
  });
});
