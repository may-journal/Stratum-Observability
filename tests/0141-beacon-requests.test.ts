import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import { BEACON_CONTENT_TYPE, BeaconPluginFactory, BeaconPublisher } from '../src/plugins/beacon';
import { BASE_CATALOG } from './utils/catalog';
import { CATALOG_METADATA, PRODUCT_NAME } from './utils/constants';
import { createService, resetStratum } from './utils/helpers';

const COLLECTOR_URL = 'https://collector.example.com/events';
const NAVIGATOR_GLOBAL = 'navigator';
const FETCH_GLOBAL = 'fetch';

const EXPECTED_SNAPSHOT = {
  event: { eventType: BASE_CATALOG[1].eventType, id: BASE_CATALOG[1].id, key: '1' },
  productName: PRODUCT_NAME
};

const EXPECTED_REQUEST = {
  headers: { 'Content-Type': BEACON_CONTENT_TYPE },
  keepalive: true,
  method: 'POST'
};

function createBeaconService() {
  const plugins = [BeaconPluginFactory({ url: COLLECTOR_URL })];
  return createService({ catalog: { items: BASE_CATALOG, ...CATALOG_METADATA }, plugins });
}

function stubBeacon(accepted: boolean): Mock {
  const sendBeacon = vi.fn(() => accepted);
  vi.stubGlobal(NAVIGATOR_GLOBAL, { sendBeacon });
  return sendBeacon;
}

function stubFetch(result: Promise<unknown> = Promise.resolve({ ok: true })): Mock {
  const fetchSpy = vi.fn(() => result);
  vi.stubGlobal(FETCH_GLOBAL, fetchSpy);
  return fetchSpy;
}

function expectKeepaliveRequest(fetchSpy: Mock) {
  expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(COLLECTOR_URL, expect.objectContaining(EXPECTED_REQUEST));
  expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toMatchObject(EXPECTED_SNAPSHOT);
}

describe('0141 Beacon Requests', () => {
  afterEach(() => {
    resetStratum();
  });

  it('0141.1 the browser queues one beacon to my URL', async () => {
    const sendBeacon = stubBeacon(true);
    const fetchSpy = stubFetch();

    expect(await createBeaconService().publish(1)).toBe(true);
    expect(sendBeacon).toHaveBeenCalledExactlyOnceWith(COLLECTOR_URL, expect.any(Blob));
    const blob: Blob = sendBeacon.mock.calls[0][1];
    expect(blob.type).toBe(BEACON_CONTENT_TYPE);
    expect(JSON.parse(await blob.text())).toMatchObject(EXPECTED_SNAPSHOT);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('0141.2 the plugin posts the same JSON to my URL with a keepalive request', async () => {
    const sendBeacon = stubBeacon(false);
    const fetchSpy = stubFetch();

    expect(await createBeaconService().publish(1)).toBe(true);
    expect(sendBeacon).toHaveBeenCalledOnce();
    expectKeepaliveRequest(fetchSpy);
  });

  it('0141.3 the plugin posts the JSON to my URL with a keepalive request', async () => {
    vi.stubGlobal(NAVIGATOR_GLOBAL, undefined);
    const fetchSpy = stubFetch();

    expect(await createBeaconService().publish(1)).toBe(true);
    expectKeepaliveRequest(fetchSpy);
  });

  it('0141.4 the publish reports failure and nothing is thrown into my app', async () => {
    vi.stubGlobal(NAVIGATOR_GLOBAL, {});
    const fetchSpy = stubFetch(Promise.reject(new Error('collector unreachable')));

    expect(await createBeaconService().publish(1)).toBe(false);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('0141.6 the publish reports failure for the refused event', async () => {
    vi.stubGlobal(NAVIGATOR_GLOBAL, undefined);
    const fetchSpy = stubFetch(Promise.resolve({ ok: false, status: 500 }));

    expect(await createBeaconService().publish(1)).toBe(false);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('0141.5 Stratum reports the collector destination unavailable', async () => {
    vi.stubGlobal(NAVIGATOR_GLOBAL, undefined);
    vi.stubGlobal(FETCH_GLOBAL, undefined);

    expect(await new BeaconPublisher(COLLECTOR_URL).isAvailable()).toBe(false);
  });
});
