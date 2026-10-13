import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { StratumService } from '../../src';
import {
  type BrowserConsolePlugin,
  BrowserConsolePluginFactory,
  BrowserConsolePublisher
} from '../../src/plugins/browser-console';
import { BASE_CATALOG } from '../utils/catalog';
import { CATALOG_METADATA } from '../utils/constants';
import { createService, getPublishers, restoreStratumMocks, spyOnPublish } from '../utils/helpers';

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

  it('should initialize the BrowserConsole publisher', () => {
    expect(getPublishers(stratum)[0]).toBeInstanceOf(BrowserConsolePublisher);
  });

  it.each([
    { key: 1, id: BASE_CATALOG[1].id },
    { key: 2, id: '2' }
  ])('should publish and log event $key to the console', async ({ key, id }) => {
    const publishSpy = spyOnPublish(plugin.publishers[0]);
    const expectedContent = JSON.stringify({ eventType: BASE_CATALOG[key].eventType, id, key: String(key) });

    expect(await stratum.publish(key)).toBe(true);
    expect(publishSpy).toHaveBeenCalledExactlyOnceWith(expectedContent, expect.anything());
    expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(`BrowserConsolePlugin: ${expectedContent}`);
  });
});
