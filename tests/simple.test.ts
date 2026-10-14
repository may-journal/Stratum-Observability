import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src';
import { BASE_EVENT_TYPE, DEBUG_LOG_PREFIX, type RegisteredStratumCatalog, type StratumService } from '../src';
import { BrowserConsolePlugin } from '../src/plugins/browser-console';
import * as newRelic from '../src/plugins/new-relic';
import { BASE_CATALOG, INVALID_SAMPLE_CATALOG } from './utils/catalog';
import { DEFAULT_CATALOG_ID } from './utils/constants';
import { BASE_EVENT_MOCK } from './utils/fixtures';
import {
  captureSnapshot,
  createService,
  enableDebugMode,
  mockSessionId,
  restoreStratumMocks,
  spyOnConsoleDebug
} from './utils/helpers';
import { PluginAFactory } from './utils/sample-plugin';

const KEY_WITHOUT_ID = 'app-loaded';
const PLUGIN_ENTRY_POINTS = ['./plugins/browser-console', './plugins/new-relic', './plugins/new-relic-plus'];

describe('load stratum without plugins', () => {
  let stratum: StratumService;

  beforeEach(() => {
    enableDebugMode(true);
    mockSessionId();
    stratum = createService();
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  it('0001.1 loads the core and one plugin entry point without the other plugins', () => {
    const { exports } = JSON.parse(readFileSync('package.json', 'utf8'));

    expect(Object.keys(exports).sort()).toStrictEqual(['.', ...PLUGIN_ENTRY_POINTS]);
    expect(core.StratumService).toBeDefined();
    expect(Object.keys(core).filter((name) => /NewRelic|BrowserConsole/.test(name))).toStrictEqual([]);
    expect(newRelic.NewRelicPluginFactory).toBeDefined();
    expect(Object.keys(newRelic).filter((name) => /Plus|BrowserConsole/.test(name))).toStrictEqual([]);
  });

  it('0002.1 registers a catalog of well-formed base events as valid', () => {
    const catalog = stratum.addCatalog({ items: BASE_CATALOG });
    expect(catalog.isValid).toBe(true);
    expect(Object.keys(catalog.validModels)).toStrictEqual(['1', '2']);
  });

  it('0002.2 uses the event key as id when the id field is omitted', () => {
    const stratumWithPlugin = createService({
      plugins: [new BrowserConsolePlugin()],
      catalog: {
        items: {
          [KEY_WITHOUT_ID]: { eventType: BASE_EVENT_TYPE, description: 'Application loaded' },
          'user-login': { eventType: BASE_EVENT_TYPE, description: 'User logged in', id: 'custom-id' }
        }
      }
    });

    const catalog = stratumWithPlugin.defaultCatalog;
    expect(catalog?.isValid).toBe(true);
    expect(catalog?.validModels[KEY_WITHOUT_ID].id).toBe(KEY_WITHOUT_ID);
    expect(catalog?.validModels['user-login'].id).toBe('custom-id');
  });

  it('0002.6 logs one debug line naming the count and keys held back', () => {
    const consoleSpy = spyOnConsoleDebug();

    createService({ catalog: { items: INVALID_SAMPLE_CATALOG }, plugins: [PluginAFactory()] });

    expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(
      DEBUG_LOG_PREFIX,
      `4 invalid items were removed when registering catalog "${DEFAULT_CATALOG_ID}": 0, 1, 3, duplicate`
    );
  });

  it.each([
    {
      entry: 'stratum.publishFromCatalog',
      publish: (s: StratumService, c: RegisteredStratumCatalog) => s.publishFromCatalog(c.id, 1)
    },
    { entry: 'catalog.publish', publish: (_s: StratumService, c: RegisteredStratumCatalog) => c.publish(1) }
  ])('0007.1 publishes base events to the listener through $entry', async ({ publish }) => {
    const catalog = stratum.addCatalog({ items: BASE_CATALOG });
    const { listener, snapshot } = await captureSnapshot(stratum, () => publish(stratum, catalog));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual(BASE_EVENT_MOCK);
  });
});
