import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE_EVENT_TYPE, type StratumService } from '../src';
import { BrowserConsolePlugin } from '../src/plugins/browser-console';
import { BASE_CATALOG } from './utils/catalog';
import { BASE_EVENT_MOCK } from './utils/fixtures';
import { captureSnapshot, createService, enableDebugMode, mockSessionId, restoreStratumMocks } from './utils/helpers';

const KEY_WITHOUT_ID = 'app-loaded';

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

  it('should allow adding catalogs containing base events', () => {
    const catalog = stratum.addCatalog({ items: BASE_CATALOG });
    expect(catalog.isValid).toBe(true);
    expect(Object.keys(catalog.validModels)).toStrictEqual(['1', '2']);
  });

  it('should use event key as id when id field is omitted', () => {
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

  it('should allow publishing base events', async () => {
    const id = stratum.addCatalog({ items: BASE_CATALOG }).id;
    const { listener, snapshot } = await captureSnapshot(stratum, () => stratum.publishFromCatalog(id, 1));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual(BASE_EVENT_MOCK);
  });
});
