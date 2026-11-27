import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RegisteredStratumCatalog } from '../src';
import type { CatalogMetadata, StratumCatalog } from '../src/types';
import { ADDED_KEY, INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG, SAMPLE_A_CATALOG_2 } from './utils/catalog';
import {
  CATALOG_METADATA,
  DEFAULT_CATALOG_ID,
  DEFAULT_CATALOG_ID_W_CATALOG_VERSION,
  METADATA_CATALOG_ID,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  UNKNOWN_CATALOG_ID
} from './utils/constants';
import {
  captureSnapshot,
  createCatalog,
  createInjector,
  createSampleService,
  createService,
  mockCrypto,
  resetStratum
} from './utils/helpers';
import { AModel, PluginAFactory } from './utils/sample-plugin';

const catalog1Length = Object.keys(SAMPLE_A_CATALOG).length;
const SAMPLE_A_IDS = Object.fromEntries(Object.values(SAMPLE_A_CATALOG).map((item) => [item.id, true]));
const { catalogVersion, componentName, componentVersion } = CATALOG_METADATA;
const CATALOG_ID_CASES: { options: Partial<CatalogMetadata>; expected: string }[] = [
  { options: { catalogVersion, componentName, componentVersion }, expected: `${componentName}:${catalogVersion}` },
  { options: { catalogVersion, componentVersion }, expected: `${PRODUCT_NAME}:${catalogVersion}` },
  { options: { componentName, componentVersion }, expected: `${componentName}:${componentVersion}` },
  { options: {}, expected: DEFAULT_CATALOG_ID }
];

describe('0003 Catalog Identity and Changes', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it("0003.1 the catalog's ID comes from that component, its metadata comes from that component and its items use the plugin's event types", () => {
    const dynamic = createService({ plugins: [PluginAFactory()] });
    const catalog = dynamic.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });

    expect(catalog.id).toEqual(METADATA_CATALOG_ID);
    expect(dynamic.defaultCatalog).toBeUndefined();
    expect(catalog.isValid).toBe(true);
    expect(catalog.metadata).toStrictEqual(CATALOG_METADATA);
    expect(Object.keys(catalog.errors)).toHaveLength(0);
    expect(Object.values(catalog.validModels)).toHaveLength(catalog1Length);
    for (const model of Object.values(catalog.validModels)) {
      expect.soft(model).toBeInstanceOf(AModel);
    }
    expect(dynamic.injector.registeredEventIds).toEqual({ [METADATA_CATALOG_ID]: SAMPLE_A_IDS });
  });

  it('0003.2 the catalog ID is the component name, or product, and the most specific version', () => {
    for (const { options, expected } of CATALOG_ID_CASES) {
      const service = createService({ catalog: { items: SAMPLE_A_CATALOG, ...options }, plugins: [PluginAFactory()] });
      const catalog = service.defaultCatalog as RegisteredStratumCatalog;

      expect.soft(catalog.isValid, expected).toBe(true);
      expect.soft(catalog.id, expected).toBe(expected);
      expect.soft(catalog.metadata, expected).toStrictEqual({
        catalogVersion: options.catalogVersion ?? '',
        componentName: options.componentName ?? PRODUCT_NAME,
        componentVersion: options.componentVersion ?? PRODUCT_VERSION
      });
      expect.soft(service.injector.registeredEventIds, expected).toEqual({ [expected]: SAMPLE_A_IDS });
    }
  });

  it("0003.3 the new catalog's items join the existing catalog", () => {
    const stratum = createSampleService();
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

  it('0003.4 I can publish the new keys', async () => {
    const stratum = createSampleService();
    const catalog = stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    const extended = catalog.addItems(SAMPLE_A_CATALOG_2);
    const { snapshot } = await captureSnapshot(stratum, () => extended.publish(ADDED_KEY));

    expect(snapshot.event.key).toBe(ADDED_KEY);
  });

  it("0003.5 the item's new errors join the old ones", () => {
    const catalog = createCatalog(createInjector(), { 1: INVALID_SAMPLE_CATALOG[1] });
    catalog.addItems({ 1: INVALID_SAMPLE_CATALOG[1] } as StratumCatalog);

    expect(catalog.errors[1].errors).toHaveLength(2);
  });

  it('0003.6 the catalog turns valid again', () => {
    const catalog = createCatalog(createInjector(), { 1: INVALID_SAMPLE_CATALOG[1] });
    expect(catalog.isValid).toBe(false);

    catalog.addItems(SAMPLE_A_CATALOG);

    expect(catalog.isValid).toBe(true);
    expect(Object.keys(catalog.errors)).toHaveLength(0);
  });

  it('0003.7 publishing from the removed catalog resolves false', async () => {
    const stratum = createService({
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

  it('0003.8 every registered catalog stays', () => {
    const stratum = createSampleService();
    stratum.removeCatalog(UNKNOWN_CATALOG_ID);
    expect(Object.keys(stratum.catalogs)).toStrictEqual([DEFAULT_CATALOG_ID]);
  });
});
