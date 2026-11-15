import { webcrypto } from 'node:crypto';
import type { CatalogEvent, GenericPlugin, StratumCatalog } from '@types';
import { expect, type MockInstance, vi } from 'vitest';
import {
  BASE_EVENT_TYPE,
  BaseEventModel,
  type BasePublisher,
  DEBUG_KEY,
  GLOBAL_LISTENER_KEY,
  Injector,
  Logger,
  RegisteredStratumCatalog,
  STORED_SESSION_ID_KEY,
  StratumService,
  type StratumServiceOptions,
  type StratumSnapshot
} from '@';
import { SAMPLE_A_CATALOG } from './catalog';
import {
  CATALOG_ID,
  CATALOG_METADATA,
  globalWindow,
  MODEL_KEY,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  SESSION_ID
} from './constants';
import { PLUGIN_B_OPTIONS, PluginA, PluginAFactory, PluginB, SamplePublisher } from './sample-plugin';

const NEW_RELIC_METHODS = ['end', 'interaction', 'save', 'setAttribute', 'setName'] as const;

export type NewRelicSpies = Record<(typeof NEW_RELIC_METHODS)[number], MockInstance>;

type NewRelicApi = Record<(typeof NEW_RELIC_METHODS)[number], () => NewRelicApi>;

export function createService(options: Partial<StratumServiceOptions> = {}) {
  return new StratumService({ productName: PRODUCT_NAME, productVersion: PRODUCT_VERSION, ...options });
}

/**
 * A service holding the sample catalog as its default catalog and the
 * sample plugin.
 */
export function createSampleService() {
  return createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: [PluginAFactory()] });
}

/**
 * An injector with the sample plugin registered, for building catalogs
 * and items without a service.
 */
export function createInjector() {
  const injector = new Injector(PRODUCT_NAME, PRODUCT_VERSION);
  injector.registerPlugin(PluginAFactory());
  return injector;
}

export function createCatalog(injector: Injector, items: StratumCatalog<CatalogEvent> | object = SAMPLE_A_CATALOG) {
  const options = { items: items as StratumCatalog<CatalogEvent>, ...CATALOG_METADATA };
  return new RegisteredStratumCatalog(CATALOG_ID, options, injector, vi.fn());
}

export function createModel(injector: Injector, item: object) {
  return new BaseEventModel(
    MODEL_KEY,
    { eventType: BASE_EVENT_TYPE, description: 'model', ...item },
    CATALOG_ID,
    injector
  );
}

export function getPublishers(service: StratumService) {
  return Object.values(service.publishers);
}

export function enableDebugMode(value: boolean) {
  sessionStorage.setItem(DEBUG_KEY, `${value}`);
}

export function isUuid(uuid: string) {
  const regExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regExp.test(uuid);
}

const DEBUG_METHOD = 'debug';

/**
 * Silences Stratum's debug logger and returns its spy, to assert on the
 * lines it would write.
 */
export function spyOnDebugLog() {
  return vi.spyOn(Logger.prototype, DEBUG_METHOD).mockImplementation(() => {});
}

/**
 * Silences console.debug and returns its spy, to assert on the debug
 * lines a user would see.
 */
export function spyOnConsoleDebug() {
  return vi.spyOn(console, DEBUG_METHOD).mockImplementation(() => {});
}

export function spyOnPublish(publisher: BasePublisher) {
  return vi.spyOn(publisher, 'publish');
}

/**
 * Registers a listener, runs `act` and resolves with the first
 * snapshot the service hands to that listener.
 */
export async function captureSnapshot(stratum: StratumService, act: () => unknown) {
  const listener = vi.fn();
  const snapshot = await new Promise<StratumSnapshot>((resolve) => {
    listener.mockImplementation(resolve);
    stratum.addSnapshotListener(listener);
    act();
  });
  return { listener, snapshot };
}

export function mockNewRelic() {
  const newrelic = {} as NewRelicApi;
  for (const method of NEW_RELIC_METHODS) {
    newrelic[method] = () => newrelic;
  }
  vi.stubGlobal('newrelic', newrelic);
}

export function spyOnNewRelic(): NewRelicSpies {
  const newrelic: NewRelicApi = globalWindow.newrelic;
  return {
    end: vi.spyOn(newrelic, 'end'),
    interaction: vi.spyOn(newrelic, 'interaction'),
    save: vi.spyOn(newrelic, 'save'),
    setAttribute: vi.spyOn(newrelic, 'setAttribute'),
    setName: vi.spyOn(newrelic, 'setName')
  };
}

export function newRelicAttributes(spies: NewRelicSpies): Record<string, unknown> {
  return Object.fromEntries(spies.setAttribute.mock.calls);
}

/**
 * Asserts that one New Relic interaction was saved with exactly these
 * attributes and this name.
 */
export function expectNewRelicEvent(spies: NewRelicSpies, attributes: object, name: string) {
  expect(spies.setAttribute).toHaveBeenCalledTimes(Object.keys(attributes).length);
  expect(newRelicAttributes(spies)).toMatchObject(attributes);
  expect(spies.setName).toHaveBeenCalledExactlyOnceWith(name);
  expect(spies.save).toHaveBeenCalledTimes(1);
  expect(spies.interaction).toHaveBeenCalledTimes(2);
  expect(spies.end).toHaveBeenCalledTimes(2);
}

export function mockCrypto() {
  vi.stubGlobal('crypto', webcrypto);
}

export function setGlobalPlugins(globalPlugins?: GenericPlugin[]) {
  globalWindow[GLOBAL_LISTENER_KEY] = globalPlugins ? { globalPlugins } : {};
}

export function createSamplePlugins(): [PluginA, PluginB] {
  return [new PluginA(), new PluginB(PLUGIN_B_OPTIONS, new SamplePublisher('sample'))];
}

/**
 * Clears Stratum's globals, session storage, every spy and every stubbed
 * global, so the next case of a test starts clean.
 */
export function resetStratum() {
  for (const key of Reflect.ownKeys(globalThis)) {
    if (typeof key === 'string' && key.startsWith('stratum')) {
      Reflect.deleteProperty(globalThis, key);
    }
  }
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
}

export function removeAllPublishers(stratum: StratumService) {
  while (stratum.publishers.length > 0) {
    stratum.publishers.pop();
  }
}

export function mockSessionId(id?: string) {
  sessionStorage.setItem(STORED_SESSION_ID_KEY, id ? id : SESSION_ID);
}
