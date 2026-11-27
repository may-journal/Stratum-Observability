import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { addGlobalStratumSnapshotListener, addStratumSnapshotListener, GLOBAL_LISTENER_KEY } from '../src';
import * as utils from '../src/utils/general';
import { globalWindow, PRODUCT_NAME } from './utils/constants';
import { createSampleService, createService, mockCrypto, resetStratum } from './utils/helpers';

describe('0008 Snapshot Listeners', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it('0008.1 the listeners for every product come first', () => {
    const stratum = createSampleService();
    const serviceListener = vi.fn();
    const globalListener = vi.fn();

    stratum.addSnapshotListener(serviceListener);
    expect(stratum.injector.getExternalSnapshotListeners()).toStrictEqual([serviceListener]);
    addGlobalStratumSnapshotListener(globalListener);

    expect(stratum.injector.getExternalSnapshotListeners()).toStrictEqual([globalListener, serviceListener]);
  });

  it('0008.2 the call returns false', () => {
    const stratum = createSampleService();
    vi.spyOn(utils, 'isDefined').mockImplementation(() => {
      throw new Error();
    });
    expect(stratum.addSnapshotListener(() => {})).toBe(false);
  });

  it('0008.3 each listener is stored on the page in order', () => {
    const scopes = [
      {
        scope: 'service',
        key: `stratum_config_${PRODUCT_NAME}`,
        add: (fn: Mock) => addStratumSnapshotListener(PRODUCT_NAME, fn)
      },
      {
        scope: 'service instance',
        key: `stratum_config_${PRODUCT_NAME}`,
        add: (fn: Mock) => createService().addSnapshotListener(fn)
      },
      { scope: 'global', key: GLOBAL_LISTENER_KEY, add: addGlobalStratumSnapshotListener }
    ];

    for (const { scope, key, add } of scopes) {
      resetStratum();
      const listeners = [vi.fn(), vi.fn()];
      for (const listener of listeners) {
        expect.soft(add(listener), scope).toBe(true);
      }
      expect.soft(globalWindow[key].listeners, scope).toStrictEqual(listeners);
    }
  });
});
