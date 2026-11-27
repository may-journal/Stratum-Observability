import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import { loadConfigFile } from 'rollup/loadConfigFile';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src';
import { generateDefaultSessionId, STORED_SESSION_ID_KEY, uuid } from '../src';
import * as newRelic from '../src/plugins/new-relic';
import { globalWindow, PRODUCT_NAME, PRODUCT_VERSION, STRATUM_LIBRARY_VERSION_PLACEHOLDER } from './utils/constants';
import { createSampleService, createService, getPublishers, isUuid, mockCrypto, resetStratum } from './utils/helpers';

const PLUGIN_ENTRY_POINTS = ['./plugins/browser-console', './plugins/new-relic', './plugins/new-relic-plus'];

describe('0001 Install and Construct', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it('0001.1 both load without the other plugins', () => {
    const { exports } = JSON.parse(readFileSync('package.json', 'utf8'));

    expect(Object.keys(exports).sort()).toStrictEqual(['.', ...PLUGIN_ENTRY_POINTS]);
    expect(core.StratumService).toBeDefined();
    expect(Object.keys(core).filter((name) => /NewRelic|BrowserConsole/.test(name))).toStrictEqual([]);
    expect(newRelic.NewRelicPluginFactory).toBeDefined();
    expect(Object.keys(newRelic).filter((name) => /Plus|BrowserConsole/.test(name))).toStrictEqual([]);
  });

  it('0001.2 the service reports the product name, the product version and the library version', () => {
    const stratum = createSampleService();

    expect(stratum.id).toEqual(PRODUCT_NAME);
    expect(stratum.version).toEqual(STRATUM_LIBRARY_VERSION_PLACEHOLDER);
    expect(stratum.injector.productName).toEqual(PRODUCT_NAME);
    expect(stratum.injector.productVersion).toEqual(PRODUCT_VERSION);
  });

  it('0001.3 the service holds no catalogs, plugins, publishers or listeners', () => {
    const empty = createService();

    expect(getPublishers(empty)).toEqual([]);
    expect(Object.keys(empty.injector.eventTypeModelMap)).toHaveLength(1);
    expect(Object.keys(empty.catalogs)).toHaveLength(0);
    expect(empty.defaultCatalog).toBeUndefined();
    expect(Object.keys(empty.injector.plugins)).toHaveLength(0);
    expect(empty.injector.getExternalSnapshotListeners()).toEqual([]);
  });

  it('0001.4 each creates a new random session ID and each stores it for the tab', () => {
    expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toBeNull();
    const first = generateDefaultSessionId();
    expect(isUuid(first)).toBe(true);
    expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toEqual(first);

    sessionStorage.clear();
    const second = generateDefaultSessionId();
    expect(isUuid(second)).toBe(true);
    expect(second).not.toEqual(first);
  });

  it('0001.5 the service uses that stored ID', () => {
    sessionStorage.setItem(STORED_SESSION_ID_KEY, 'test-id');
    expect(createService().stratumSessionId).toEqual('test-id');
  });

  it('0001.6 the service still gets a random session ID', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error();
    });
    expect(isUuid(generateDefaultSessionId())).toBe(true);
  });

  it('0001.7 the ID is all zeros', () => {
    delete globalWindow.crypto;
    expect(uuid()).toEqual('00000000-0000-0000-0000-000000000000');
  });

  it('0001.8 the built library reports its version without that metadata', async () => {
    const fromRoot = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url));
    const { options, warnings } = await loadConfigFile(fromRoot('rollup.config.mjs'), {});
    warnings.flush();
    const bundle = await rollup({ ...options[0], input: fromRoot('src/utils/injector.ts'), external: () => true });
    const { output } = await bundle.generate({ format: 'es' });
    await bundle.close();
    const [, version] = output[0].code.match(/version = ["'](.+?)["']/) ?? [];
    const { version: packageVersion } = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8'));
    expect(version).toBe(packageVersion.split('+')[0]);
    expect(version).not.toContain('+');
  });
});
