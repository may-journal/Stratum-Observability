import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addGlobalPlugin,
  addGlobalStratumSnapshotListener,
  type RegisteredStratumCatalog,
  STORED_SESSION_ID_KEY,
  type StratumService
} from '../src';
import { BrowserConsolePlugin, BrowserConsolePublisher } from '../src/plugins/browser-console';
import { NewRelicPluginFactory } from '../src/plugins/new-relic';
import * as utils from '../src/utils/general';
import { ADDED_KEY, SAMPLE_A_CATALOG, SAMPLE_A_CATALOG_2 } from './utils/catalog';
import {
  AB_TEST_SCHEMA,
  CATALOG_METADATA,
  DEFAULT_CATALOG_ID,
  DEFAULT_CATALOG_ID_W_CATALOG_VERSION,
  GENERATED_DEFAULT_METADATA,
  globalWindow,
  METADATA_CATALOG_ID,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  STRATUM_LIBRARY_VERSION_PLACEHOLDER
} from './utils/constants';
import {
  captureSnapshot,
  createService,
  enableDebugMode,
  getPublishers,
  mockCrypto,
  restoreStratumMocks,
  spyOnDebugLog
} from './utils/helpers';
import { AModel, PluginAFactory, SamplePublisher } from './utils/sample-plugin';

const UNKNOWN_CATALOG_ID = 'unknown-catalog-id';
const catalog1Length = Object.keys(SAMPLE_A_CATALOG).length;
const SAMPLE_A_IDS = Object.fromEntries(Object.values(SAMPLE_A_CATALOG).map((item) => [item.id, true]));

function createSampleService() {
  return createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: [PluginAFactory()] });
}

describe('stratum service base functionality', () => {
  let stratum: StratumService;

  beforeEach(() => {
    mockCrypto();
    stratum = createSampleService();
  });

  afterEach(() => {
    enableDebugMode(false);
    vi.restoreAllMocks();
    restoreStratumMocks();
  });

  it('should set the stratum service id, version and product details', () => {
    expect(stratum.id).toEqual(PRODUCT_NAME);
    expect(stratum.version).toEqual(STRATUM_LIBRARY_VERSION_PLACEHOLDER);
    expect(stratum.injector.productName).toEqual(PRODUCT_NAME);
    expect(stratum.injector.productVersion).toEqual(PRODUCT_VERSION);
  });

  it('should expect a default service instance to be empty', () => {
    const empty = createService();
    expect(getPublishers(empty)).toEqual([]);
    expect(Object.keys(empty.injector.eventTypeModelMap)).toHaveLength(1);
    expect(Object.keys(empty.catalogs)).toHaveLength(0);
    expect(empty.defaultCatalog).toBeUndefined();
    expect(Object.keys(empty.injector.plugins)).toHaveLength(0);
  });

  it('should create the expected models for a dynamically loaded StratumCatalog', () => {
    const dynamic = createService({ plugins: [PluginAFactory()] });
    const catalog = dynamic.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });

    expect(catalog.id).toEqual(METADATA_CATALOG_ID);
    expect(dynamic.defaultCatalog).toBeUndefined();
    expect(catalog.isValid).toBe(true);
    expect(catalog.metadata).toStrictEqual(CATALOG_METADATA);
    expect(Object.keys(catalog.errors)).toHaveLength(0);
    expect(Object.values(catalog.validModels)).toHaveLength(catalog1Length);
    for (const model of Object.values(catalog.validModels)) {
      expect(model).toBeInstanceOf(AModel);
    }
    expect(dynamic.injector.registeredEventIds).toEqual({ [METADATA_CATALOG_ID]: SAMPLE_A_IDS });
  });

  it('should infer the metadata of a default StratumCatalog from the product', () => {
    const catalog = stratum.defaultCatalog as RegisteredStratumCatalog;
    expect(catalog.isValid).toBe(true);
    expect(catalog.id).toBe(DEFAULT_CATALOG_ID);
    expect(catalog.metadata).toStrictEqual(GENERATED_DEFAULT_METADATA);
    expect(Object.keys(catalog.validModels)).toHaveLength(catalog1Length);
    expect(stratum.injector.registeredEventIds).toEqual({ [DEFAULT_CATALOG_ID]: SAMPLE_A_IDS });
  });

  it('should register global plugins if available', () => {
    addGlobalPlugin(new BrowserConsolePlugin());
    stratum = createSampleService();

    expect(stratum.publishers).toHaveLength(2);
    expect(stratum.publishers[0]).toBeInstanceOf(SamplePublisher);
    expect(stratum.publishers[1]).toBeInstanceOf(BrowserConsolePublisher);
  });

  it('should return an existing catalog and add items for duplicate catalog ids', () => {
    const first = stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    expect(Object.keys(stratum.catalogs)).toHaveLength(2);

    const duplicate = stratum.addCatalog({ items: SAMPLE_A_CATALOG_2, ...CATALOG_METADATA });
    expect(duplicate).toBe(first);
    expect(Object.keys(stratum.catalogs)).toHaveLength(2);
    expect(Object.keys(first.validModels)).toHaveLength(catalog1Length + 1);

    const different = stratum.addCatalog({ items: SAMPLE_A_CATALOG_2, ...CATALOG_METADATA, catalogVersion: 'other' });
    expect(different.isValid).toBe(true);
    expect(Object.keys(stratum.catalogs)).toHaveLength(3);
  });

  it('should handle removing catalogs at run-time', async () => {
    stratum = createService({
      catalog: { items: SAMPLE_A_CATALOG, catalogVersion: CATALOG_METADATA.catalogVersion },
      plugins: [PluginAFactory()]
    });
    const catalog = stratum.addCatalog({ items: SAMPLE_A_CATALOG_2, ...CATALOG_METADATA });
    const defaultId = stratum.defaultCatalog?.id as string;

    expect(defaultId).toBe(DEFAULT_CATALOG_ID_W_CATALOG_VERSION);
    expect(Object.keys(stratum.injector.registeredEventIds).sort()).toEqual([defaultId, catalog.id].sort());

    stratum.removeCatalog(defaultId);

    expect(Object.keys(stratum.catalogs)).toStrictEqual([catalog.id]);
    expect(Object.keys(stratum.injector.registeredEventIds)).toStrictEqual([catalog.id]);
    expect(stratum.defaultCatalog).toBeUndefined();
    expect(await catalog.publish(ADDED_KEY)).toBe(true);

    stratum.removeCatalog(catalog.id);

    expect(Object.keys(stratum.catalogs)).toHaveLength(0);
    expect(Object.keys(stratum.injector.registeredEventIds)).toHaveLength(0);
    expect(await catalog.publish(ADDED_KEY)).toBe(false);
  });

  it('should ignore removing an unknown catalog id', () => {
    stratum.removeCatalog(UNKNOWN_CATALOG_ID);
    expect(Object.keys(stratum.catalogs)).toStrictEqual([DEFAULT_CATALOG_ID]);
  });

  describe('direct catalog publishing', () => {
    let catalog: RegisteredStratumCatalog;

    beforeEach(() => {
      catalog = stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    });

    it('should publish an event via catalog.publish and fire the snapshot listener', async () => {
      const { listener, snapshot } = await captureSnapshot(stratum, () => catalog.publish(1));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(snapshot.catalog.id).toEqual(METADATA_CATALOG_ID);
      expect(snapshot.event.key).toBe('1');
    });

    it('should return false when publishing an invalid key', async () => {
      expect(await catalog.publish('noop')).toBe(false);
    });

    it('should allow publishing new keys after addItems at runtime', async () => {
      const extended = catalog.addItems(SAMPLE_A_CATALOG_2);
      const { snapshot } = await captureSnapshot(stratum, () => extended.publish(ADDED_KEY));

      expect(snapshot.event.key).toBe(ADDED_KEY);
    });
  });

  describe('service publish unhappy paths', () => {
    it.each([
      { reason: 'no default catalog exists', act: () => createService().publish(1) },
      { reason: 'the catalog is unknown', act: (s: StratumService) => s.publishFromCatalog(UNKNOWN_CATALOG_ID, 1) },
      { reason: 'the key is unknown', act: (s: StratumService) => s.publishFromCatalog(DEFAULT_CATALOG_ID, 'missing') },
      {
        reason: 'a publisher is unavailable',
        act: (s: StratumService) => {
          s.addPlugin(NewRelicPluginFactory());
          return s.publish(1);
        }
      }
    ])('should return false and log when $reason', async ({ act }) => {
      const debugSpy = spyOnDebugLog();
      expect(await act(stratum)).toBe(false);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ab test manager', () => {
    it('should return started ab tests', () => {
      expect(stratum.abTests).toEqual([]);
      stratum.startAbTest(AB_TEST_SCHEMA);
      expect(stratum.abTests.map((test) => test.data)).toEqual([AB_TEST_SCHEMA]);
    });

    it('should remove ab test from manager after end', () => {
      const test = stratum.startAbTest(AB_TEST_SCHEMA);
      stratum.endAbTest(test.id);
      expect(stratum.abTests).toEqual([]);
    });

    it('should remove all ab tests from manager', () => {
      stratum.startAbTest(AB_TEST_SCHEMA);
      stratum.startAbTest(AB_TEST_SCHEMA);
      stratum.endAllAbTests();
      expect(stratum.abTests).toEqual([]);
    });

    it.each([
      { shape: 'a single schema', abTestSchemas: () => AB_TEST_SCHEMA },
      {
        shape: 'a list of tests and schemas',
        abTestSchemas: () => [{ id: 'started', data: AB_TEST_SCHEMA }, AB_TEST_SCHEMA]
      }
    ])('should add one-time ab tests passed to publish as $shape', async ({ abTestSchemas }) => {
      const transient = abTestSchemas();
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1, { abTestSchemas: transient }));

      expect(snapshot.abTestSchemas).toHaveLength([transient].flat().length);
      expect(stratum.abTests).toEqual([]);
    });
  });

  it('should use the session id stored in session storage', () => {
    sessionStorage.setItem(STORED_SESSION_ID_KEY, 'test-id');
    expect(createService().stratumSessionId).toEqual('test-id');
  });

  describe('globalThis events', () => {
    it('should not load any event listeners until one is added', () => {
      expect(stratum.injector.getExternalSnapshotListeners()).toEqual([]);
    });

    it('should fail to add event listener if an error occurs', () => {
      vi.spyOn(utils, 'isDefined').mockImplementation(() => {
        throw new Error();
      });
      expect(stratum.addSnapshotListener(() => {})).toBe(false);
    });

    it('should add event listener to the global object', () => {
      const mock = vi.fn();
      expect(stratum.addSnapshotListener(mock)).toBe(true);
      expect(globalWindow[`stratum_config_${PRODUCT_NAME}`].listeners).toStrictEqual([mock]);
    });

    it('should read global listeners before service listeners', () => {
      const serviceListener = vi.fn();
      const globalListener = vi.fn();

      stratum.addSnapshotListener(serviceListener);
      addGlobalStratumSnapshotListener(globalListener);

      expect(stratum.injector.getExternalSnapshotListeners()).toStrictEqual([globalListener, serviceListener]);
    });
  });
});
