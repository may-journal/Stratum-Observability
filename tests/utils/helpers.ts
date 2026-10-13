import { webcrypto } from 'node:crypto';
import { expect, type MockInstance, vi } from 'vitest';
import {
  type BasePublisher,
  DEBUG_KEY,
  GLOBAL_LISTENER_KEY,
  Logger,
  STORED_SESSION_ID_KEY,
  StratumService,
  type StratumServiceOptions,
  type StratumSnapshot
} from '../../src';
import type { GenericPlugin } from '../../src/types';
import { globalWindow, PRODUCT_NAME, PRODUCT_VERSION, SESSION_ID } from './constants';
import { PLUGIN_B_OPTIONS, PluginA, PluginB, SamplePublisher } from './sample-plugin';

const NEW_RELIC_METHODS = ['end', 'interaction', 'save', 'setAttribute', 'setName'] as const;

export type NewRelicSpies = Record<(typeof NEW_RELIC_METHODS)[number], MockInstance>;

export function createService(options: Partial<StratumServiceOptions> = {}) {
  return new StratumService({ productName: PRODUCT_NAME, productVersion: PRODUCT_VERSION, ...options });
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

export function spyOnDebugLog() {
  return vi.spyOn(Logger.prototype, 'debug');
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
  globalWindow.newrelic = Object.fromEntries(NEW_RELIC_METHODS.map((method) => [method, () => globalWindow.newrelic]));
}

export function spyOnNewRelic(): NewRelicSpies {
  return Object.fromEntries(
    NEW_RELIC_METHODS.map((method) => [method, vi.spyOn(globalWindow.newrelic, method)])
  ) as NewRelicSpies;
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
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  });
}

export function setGlobalPlugins(globalPlugins?: GenericPlugin[]) {
  globalWindow[GLOBAL_LISTENER_KEY] = globalPlugins ? { globalPlugins } : {};
}

export function createSamplePlugins(): [PluginA, PluginB] {
  return [new PluginA(), new PluginB(PLUGIN_B_OPTIONS, new SamplePublisher('sample'))];
}

export function restoreStratumMocks() {
  Object.keys(globalWindow).forEach((k) => {
    if (k.startsWith('stratum')) {
      delete globalWindow[k];
    }
  });
  delete globalWindow[GLOBAL_LISTENER_KEY];
  delete globalWindow.newrelic;
  localStorage.clear();
  sessionStorage.clear();

  delete globalWindow.crypto;
}

export function removeAllPublishers(stratum: StratumService) {
  while (stratum.publishers.length > 0) {
    stratum.publishers.pop();
  }
}

export function mockSessionId(id?: string) {
  sessionStorage.setItem(STORED_SESSION_ID_KEY, id ? id : SESSION_ID);
}
