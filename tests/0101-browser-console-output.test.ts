import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { StratumService } from '../src';
import { type BrowserConsolePlugin, BrowserConsolePluginFactory } from '../src/plugins/browser-console';
import { BASE_CATALOG } from './utils/catalog';
import { CATALOG_METADATA } from './utils/constants';
import { createService, resetStratum, spyOnPublish } from './utils/helpers';

describe('0101 Browser Console Output', () => {
  let stratum: StratumService;
  let plugin: BrowserConsolePlugin;
  let consoleSpy: Mock;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    plugin = BrowserConsolePluginFactory();
    stratum = createService({ catalog: { items: BASE_CATALOG, ...CATALOG_METADATA }, plugins: [plugin] });
  });

  afterEach(() => {
    resetStratum();
  });

  it("0101.1 the console shows one line naming the plugin, with the event's type, ID and key", async () => {
    const publishSpy = spyOnPublish(plugin.publishers[0]);
    const expectedContent = JSON.stringify({ eventType: BASE_CATALOG[1].eventType, id: BASE_CATALOG[1].id, key: '1' });

    expect(await stratum.publish(1)).toBe(true);
    expect(publishSpy).toHaveBeenCalledExactlyOnceWith(expectedContent, expect.anything());
    expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(`BrowserConsolePlugin: ${expectedContent}`);
  });
});
