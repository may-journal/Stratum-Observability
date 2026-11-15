import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BASE_EVENT_TYPE, BaseEventModel, DEBUG_LOG_PREFIX } from '../src';
import { BrowserConsolePlugin } from '../src/plugins/browser-console';
import type { StratumCatalog } from '../src/types';
import { BASE_CATALOG, INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import { CATALOG_ID, DEFAULT_CATALOG_ID, MODEL_KEY } from './utils/constants';
import {
  createCatalog,
  createInjector,
  createModel,
  createService,
  enableDebugMode,
  mockCrypto,
  resetStratum,
  spyOnConsoleDebug
} from './utils/helpers';
import { PluginAFactory } from './utils/sample-plugin';

const KEY_WITHOUT_ID = 'app-loaded';

describe('0002 Catalog Validation', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it('0002.1 the catalog is valid and every item can be published', () => {
    const catalog = createService().addCatalog({ items: BASE_CATALOG });
    expect(catalog.isValid).toBe(true);
    expect(Object.keys(catalog.validModels)).toStrictEqual(['1', '2']);
  });

  it('0002.2 the item uses its key as its ID', () => {
    const stratum = createService({
      plugins: [new BrowserConsolePlugin()],
      catalog: {
        items: {
          [KEY_WITHOUT_ID]: { eventType: BASE_EVENT_TYPE, description: 'Application loaded' },
          'user-login': { eventType: BASE_EVENT_TYPE, description: 'User logged in', id: 'custom-id' }
        }
      }
    });

    const catalog = stratum.defaultCatalog;
    expect(catalog?.isValid).toBe(true);
    expect(catalog?.validModels[KEY_WITHOUT_ID].id).toBe(KEY_WITHOUT_ID);
    expect(catalog?.validModels['user-login'].id).toBe('custom-id');
  });

  it('0002.3 each item is held back with one error and the catalog is invalid', () => {
    const cases = [
      {
        step: 'construction',
        create: () => createCatalog(createInjector(), INVALID_SAMPLE_CATALOG),
        validCount: 1,
        errorCount: 4
      },
      {
        step: 'addItems',
        create: () => createCatalog(createInjector()).addItems(INVALID_SAMPLE_CATALOG as StratumCatalog),
        validCount: Object.keys(SAMPLE_A_CATALOG).length,
        errorCount: Object.keys(INVALID_SAMPLE_CATALOG).length
      }
    ];

    for (const { step, create, validCount, errorCount } of cases) {
      const catalog = create();

      expect.soft(catalog.isValid, step).toBe(false);
      expect.soft(Object.keys(catalog.validModels), step).toHaveLength(validCount);
      expect.soft(Object.keys(catalog.errors), step).toHaveLength(errorCount);
      for (const { errors } of Object.values(catalog.errors)) {
        expect.soft(errors, step).toHaveLength(1);
      }
    }
  });

  it('0002.4 the item is held back as having an invalid ID', () => {
    const injector = createInjector();

    for (const id of [-1, '', true]) {
      const model = createModel(injector, { id });
      expect.soft(model.isValid, String(id)).toBe(false);
      expect.soft(model.validationErrors, String(id)).toStrictEqual(['An invalid id was provided']);
    }
  });

  it('0002.5 the item is held back as having an unexpected format', () => {
    const item = Object.assign(() => undefined, { eventType: BASE_EVENT_TYPE, description: 'fn', id: 1 });
    const model = new BaseEventModel(MODEL_KEY, item, CATALOG_ID, createInjector());
    expect(model.isValid).toBe(false);
    expect(model.validationErrors).toStrictEqual(['Catalog item has an unexpected format']);
  });

  it('0002.6 one debug line names the count and keys held back', () => {
    enableDebugMode(true);
    const consoleSpy = spyOnConsoleDebug();

    createService({ catalog: { items: INVALID_SAMPLE_CATALOG }, plugins: [PluginAFactory()] });

    expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(
      DEBUG_LOG_PREFIX,
      `4 invalid items were removed when registering catalog "${DEFAULT_CATALOG_ID}": 0, 1, 3, duplicate`
    );
  });
});
