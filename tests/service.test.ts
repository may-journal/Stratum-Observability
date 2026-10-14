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
import type { CatalogMetadata } from '../src/types';
import * as utils from '../src/utils/general';
import { ADDED_KEY, SAMPLE_A_CATALOG, SAMPLE_A_CATALOG_2 } from './utils/catalog';
import {
  AB_TEST_SCHEMA,
  CATALOG_METADATA,
  DEFAULT_CATALOG_ID,
  DEFAULT_CATALOG_ID_W_CATALOG_VERSION,
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
const { catalogVersion, componentName, componentVersion } = CATALOG_METADATA;
const CATALOG_ID_CASES: { options: Partial<CatalogMetadata>; expected: string }[] = [
  { options: { catalogVersion, componentName, componentVersion }, expected: `${componentName}:${catalogVersion}` },
  { options: { catalogVersion, componentVersion }, expected: `${PRODUCT_NAME}:${catalogVersion}` },
  { options: { componentName, componentVersion }, expected: `${componentName}:${componentVersion}` },
  { options: {}, expected: DEFAULT_CATALOG_ID }
];

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

  it('0001.2 sets the stratum service id, version and product details', () => {
    expect(stratum.id).toEqual(PRODUCT_NAME);
    expect(stratum.version).toEqual(STRATUM_LIBRARY_VERSION_PLACEHOLDER);
    expect(stratum.injector.productName).toEqual(PRODUCT_NAME);
    expect(stratum.injector.productVersion).toEqual(PRODUCT_VERSION);
  });

  it('0001.3 constructs an empty service with no catalogs, plugins, publishers or listeners', () => {
    const empty = createService();
    expect(getPublishers(empty)).toEqual([]);
    expect(Object.keys(empty.injector.eventTypeModelMap)).toHaveLength(1);
    expect(Object.keys(empty.catalogs)).toHaveLength(0);
    expect(empty.defaultCatalog).toBeUndefined();
    expect(Object.keys(empty.injector.plugins)).toHaveLength(0);
    expect(empty.injector.getExternalSnapshotListeners()).toEqual([]);
  });

  it('0003.1 creates the expected models for a catalog added after construction', () => {
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

  it.each(CATALOG_ID_CASES)('0003.2 derives the catalog id $expected', ({ options, expected }) => {
    const service = createService({ catalog: { items: SAMPLE_A_CATALOG, ...options }, plugins: [PluginAFactory()] });
    const catalog = service.defaultCatalog as RegisteredStratumCatalog;

    expect(catalog.isValid).toBe(true);
    expect(catalog.id).toBe(expected);
    expect(catalog.metadata).toStrictEqual({
      catalogVersion: options.catalogVersion ?? '',
      componentName: options.componentName ?? PRODUCT_NAME,
      componentVersion: options.componentVersion ?? PRODUCT_VERSION
    });
    expect(service.injector.registeredEventIds).toEqual({ [expected]: SAMPLE_A_IDS });
  });

  it('0005.1 registers global plugins after the constructor plugins', () => {
    addGlobalPlugin(new BrowserConsolePlugin());
    stratum = createSampleService();

    expect(stratum.publishers).toHaveLength(2);
    expect(stratum.publishers[0]).toBeInstanceOf(SamplePublisher);
    expect(stratum.publishers[1]).toBeInstanceOf(BrowserConsolePublisher);
  });

  it('0003.3 returns an existing catalog and adds items for duplicate catalog ids', () => {
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

  it('0003.7 removes catalogs at run-time so they no longer publish', async () => {
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

  it('0003.8 ignores removing an unknown catalog id', () => {
    stratum.removeCatalog(UNKNOWN_CATALOG_ID);
    expect(Object.keys(stratum.catalogs)).toStrictEqual([DEFAULT_CATALOG_ID]);
  });

  describe('direct catalog publishing', () => {
    let catalog: RegisteredStratumCatalog;

    beforeEach(() => {
      catalog = stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    });

    it('0007.2 publishes an event via catalog.publish and fires the snapshot listener', async () => {
      const { listener, snapshot } = await captureSnapshot(stratum, () => catalog.publish(1));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(snapshot.catalog.id).toEqual(METADATA_CATALOG_ID);
      expect(snapshot.event.key).toBe('1');
    });

    it('0003.4 publishes new keys after addItems at runtime', async () => {
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
    ])('0007.3 returns false and logs when $reason', async ({ act }) => {
      const debugSpy = spyOnDebugLog();
      expect(await act(stratum)).toBe(false);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ab test manager', () => {
    it('0009.1 returns started ab tests', () => {
      expect(stratum.abTests).toEqual([]);
      stratum.startAbTest(AB_TEST_SCHEMA);
      expect(stratum.abTests.map((test) => test.data)).toEqual([AB_TEST_SCHEMA]);
    });

    it.each([
      {
        action: 'ending one test',
        end: (s: StratumService) => s.endAbTest(s.abTests[0].id)
      },
      {
        action: 'ending all tests',
        end: (s: StratumService) => {
          s.startAbTest(AB_TEST_SCHEMA);
          s.endAllAbTests();
        }
      }
    ])('0009.2 removes ab tests from the manager after $action', ({ end }) => {
      stratum.startAbTest(AB_TEST_SCHEMA);
      end(stratum);
      expect(stratum.abTests).toEqual([]);
    });

    it.each([
      { shape: 'a single schema', abTestSchemas: () => AB_TEST_SCHEMA },
      {
        shape: 'a list of tests and schemas',
        abTestSchemas: () => [{ id: 'started', data: AB_TEST_SCHEMA }, AB_TEST_SCHEMA]
      }
    ])('0009.3 adds one-time ab tests passed to publish as $shape', async ({ abTestSchemas }) => {
      const transient = abTestSchemas();
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1, { abTestSchemas: transient }));

      expect(snapshot.abTestSchemas).toHaveLength([transient].flat().length);
      expect(stratum.abTests).toEqual([]);
    });
  });

  it('0001.5 uses the session id stored in session storage', () => {
    sessionStorage.setItem(STORED_SESSION_ID_KEY, 'test-id');
    expect(createService().stratumSessionId).toEqual('test-id');
  });

  describe('globalThis events', () => {
    it('0008.2 fails to add a snapshot listener if an error occurs', () => {
      vi.spyOn(utils, 'isDefined').mockImplementation(() => {
        throw new Error();
      });
      expect(stratum.addSnapshotListener(() => {})).toBe(false);
    });

    it('0008.1 reads global listeners before service listeners', () => {
      const serviceListener = vi.fn();
      const globalListener = vi.fn();

      stratum.addSnapshotListener(serviceListener);
      addGlobalStratumSnapshotListener(globalListener);

      expect(stratum.injector.getExternalSnapshotListeners()).toStrictEqual([globalListener, serviceListener]);
    });
  });
});
