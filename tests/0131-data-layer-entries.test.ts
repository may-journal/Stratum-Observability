import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DATA_LAYER_EVENT_NAME,
  type DataLayerEntry,
  DataLayerPluginFactory,
  DataLayerPublisher,
  DEFAULT_DATA_LAYER_NAME
} from '../src/plugins/data-layer';
import { BASE_CATALOG } from './utils/catalog';
import { CATALOG_METADATA, PRODUCT_NAME, PRODUCT_VERSION, WINDOW_GLOBAL } from './utils/constants';
import { createService, resetStratum } from './utils/helpers';

const CUSTOM_LAYER_NAME = 'analyticsLayer';

const EXPECTED_ENTRY: DataLayerEntry = {
  event: DATA_LAYER_EVENT_NAME,
  stratum: {
    eventType: BASE_CATALOG[1].eventType,
    id: BASE_CATALOG[1].id,
    key: '1',
    productName: PRODUCT_NAME,
    productVersion: PRODUCT_VERSION
  }
};

function createDataLayerService(name?: string) {
  const plugins = [DataLayerPluginFactory(name ? { name } : undefined)];
  return createService({ catalog: { items: BASE_CATALOG, ...CATALOG_METADATA }, plugins });
}

describe('0131 Data Layer Entries', () => {
  afterEach(() => {
    resetStratum();
  });

  it('0131.1 the data layer ends with one entry named for Stratum', async () => {
    const existing = { event: 'page-view' };
    vi.stubGlobal(DEFAULT_DATA_LAYER_NAME, [existing]);

    expect(await createDataLayerService().publish(1)).toBe(true);
    expect(Reflect.get(globalThis, DEFAULT_DATA_LAYER_NAME)).toEqual([existing, EXPECTED_ENTRY]);
  });

  it('0131.2 the plugin creates the data layer and pushes the entry', async () => {
    vi.stubGlobal(DEFAULT_DATA_LAYER_NAME, undefined);

    expect(await createDataLayerService().publish(1)).toBe(true);
    expect(Reflect.get(globalThis, DEFAULT_DATA_LAYER_NAME)).toEqual([EXPECTED_ENTRY]);
  });

  it('0131.3 the entry lands in the array I named', async () => {
    vi.stubGlobal(DEFAULT_DATA_LAYER_NAME, undefined);
    vi.stubGlobal(CUSTOM_LAYER_NAME, undefined);

    expect(await createDataLayerService(CUSTOM_LAYER_NAME).publish(1)).toBe(true);
    expect(Reflect.get(globalThis, CUSTOM_LAYER_NAME)).toEqual([EXPECTED_ENTRY]);
    expect(Reflect.get(globalThis, DEFAULT_DATA_LAYER_NAME)).toBeUndefined();
  });

  it('0131.4 Stratum reports the data layer destination unavailable', async () => {
    vi.stubGlobal(WINDOW_GLOBAL, undefined);
    expect(await new DataLayerPublisher().isAvailable()).toBe(false);
  });
});
