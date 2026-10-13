import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  addGlobalPlugin,
  addGlobalStratumSnapshotListener,
  addStratumSnapshotListener,
  BASE_EVENT_TYPE,
  BaseEventModel,
  debugModeEnabled,
  GLOBAL_LISTENER_KEY,
  generateCatalogId,
  generateDefaultSessionId,
  generateStratumSnapshot,
  getGlobalPlugins,
  Injector,
  Logger,
  performReplacements,
  RegisteredStratumCatalog,
  removeGlobalPlugin,
  STORED_SESSION_ID_KEY,
  safeStringify,
  uuid
} from '../src';
import type { StratumCatalog } from '../src/types';
import { ADDED_KEY, INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG, SAMPLE_A_CATALOG_2 } from './utils/catalog';
import { CATALOG_METADATA, globalWindow, PRODUCT_NAME, PRODUCT_VERSION, SESSION_ID } from './utils/constants';
import {
  createSamplePlugins,
  enableDebugMode,
  isUuid,
  mockCrypto,
  restoreStratumMocks,
  setGlobalPlugins
} from './utils/helpers';
import { PLUGIN_A_NAME, PluginA, PluginAFactory, SamplePublisher } from './utils/sample-plugin';

const CATALOG_ID = 'catalog-id';
const MODEL_KEY = 'key';
const LABEL_PLACEHOLDER = '{{LABEL}}';

describe('util functions', () => {
  let injector: Injector;

  function createInjector() {
    const created = new Injector(PRODUCT_NAME, PRODUCT_VERSION);
    created.registerPlugin(PluginAFactory());
    return created;
  }

  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  describe('catalog', () => {
    beforeEach(() => {
      injector = createInjector();
    });

    const { catalogVersion, componentName, componentVersion } = CATALOG_METADATA;

    it.each([
      { options: { catalogVersion, componentName, componentVersion }, expected: `${componentName}:${catalogVersion}` },
      { options: { catalogVersion, componentVersion }, expected: `${PRODUCT_NAME}:${catalogVersion}` },
      { options: { componentName, componentVersion }, expected: `${componentName}:${componentVersion}` },
      { options: {}, expected: `${PRODUCT_NAME}:${PRODUCT_VERSION}` }
    ])('should generate the catalog id $expected from the provided metadata', ({ options, expected }) => {
      expect(generateCatalogId({ items: {}, ...options }, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
    });

    describe('RegisteredStratumCatalog', () => {
      let publishFn: Mock;

      function createCatalog(items: StratumCatalog | object = SAMPLE_A_CATALOG) {
        const options = { items: items as StratumCatalog, ...CATALOG_METADATA };
        return new RegisteredStratumCatalog(CATALOG_ID, options, injector, publishFn);
      }

      beforeEach(() => {
        publishFn = vi.fn();
      });

      it('should handle validating a stratum catalog on construction', () => {
        const catalog = createCatalog();
        expect(catalog.id).toEqual(CATALOG_ID);
        expect(catalog.isValid).toBe(true);
      });

      it('should show validation errors for invalid events', () => {
        const catalog = createCatalog(INVALID_SAMPLE_CATALOG);

        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toStrictEqual(['correct']);
        expect(Object.keys(catalog.errors)).toHaveLength(4);
        for (const key of [0, 1, 3, 'duplicate']) {
          expect(catalog.errors[key].errors).toHaveLength(1);
        }
      });

      it('should add new valid models via addItems at runtime', () => {
        const catalog = createCatalog();
        catalog.addItems(SAMPLE_A_CATALOG_2);

        expect(Object.keys(catalog.validModels)).toHaveLength(Object.keys(SAMPLE_A_CATALOG).length + 1);
        expect(catalog.validModels[ADDED_KEY]).toBeDefined();
        expect(catalog.isValid).toBe(true);
      });

      it('should reject invalid items via addItems at runtime', () => {
        const catalog = createCatalog();
        catalog.addItems(INVALID_SAMPLE_CATALOG as StratumCatalog);

        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toHaveLength(Object.keys(SAMPLE_A_CATALOG).length);
        expect(Object.keys(catalog.errors)).toHaveLength(Object.keys(INVALID_SAMPLE_CATALOG).length);
      });

      it('should append errors when an invalid key is added again', () => {
        const catalog = createCatalog({ 1: INVALID_SAMPLE_CATALOG[1] });
        catalog.addItems({ 1: INVALID_SAMPLE_CATALOG[1] } as StratumCatalog);

        expect(catalog.errors[1].errors).toHaveLength(2);
      });

      it('should recover isValid when failed keys are re-added successfully', () => {
        const catalog = createCatalog({ 1: INVALID_SAMPLE_CATALOG[1] });
        expect(catalog.isValid).toBe(false);

        catalog.addItems(SAMPLE_A_CATALOG);

        expect(catalog.isValid).toBe(true);
        expect(Object.keys(catalog.errors)).toHaveLength(0);
      });

      it('should leave plugin data out of snapshots for publishers without a plugin', () => {
        const catalog = createCatalog();
        const publishers = [new SamplePublisher('unregistered')];
        const snapshot = generateStratumSnapshot(injector, catalog.validModels[1], catalog, publishers);
        expect(snapshot.plugins).toStrictEqual({});
      });

      it('should delegate publish to the provided publishFn', async () => {
        publishFn.mockResolvedValue(true);
        expect(await createCatalog().publish(1)).toBe(true);
        expect(publishFn).toHaveBeenCalledWith(CATALOG_ID, 1, undefined);
      });
    });
  });

  describe('event models', () => {
    beforeEach(() => {
      injector = createInjector();
    });

    function createModel(item: object) {
      return new BaseEventModel(
        MODEL_KEY,
        { eventType: BASE_EVENT_TYPE, description: 'model', ...item },
        CATALOG_ID,
        injector
      );
    }

    it.each([{ id: -1 }, { id: '' }, { id: true }])('should reject the invalid id $id', ({ id }) => {
      const model = createModel({ id });
      expect(model.isValid).toBe(false);
      expect(model.validationErrors).toStrictEqual(['An invalid id was provided']);
    });

    it('should reject a catalog item that is not a plain object', () => {
      const item = Object.assign(() => undefined, { eventType: BASE_EVENT_TYPE, description: 'fn', id: 1 });
      const model = new BaseEventModel(MODEL_KEY, item, CATALOG_ID, injector);
      expect(model.isValid).toBe(false);
      expect(model.validationErrors).toStrictEqual(['Catalog item has an unexpected format']);
    });

    it('should replace placeholders with the result of a replacement function', () => {
      const model = createModel({ id: 1 });
      const data = model.getData({ replacements: { KEY: (m: BaseEventModel) => m.key } });
      expect(data.description).toBe(MODEL_KEY);
    });

    it('should replace placeholders inside nested objects', () => {
      const model = createModel({ id: 1, details: { label: LABEL_PLACEHOLDER } });
      expect(model.getData({ replacements: { LABEL: 'nested' } }).details.label).toBe('nested');
    });

    it('should leave arrays passed to performReplacements unchanged', () => {
      const list = [LABEL_PLACEHOLDER];
      performReplacements(createModel({ id: 1 }), list, { LABEL: 'replaced' });
      expect(list).toStrictEqual([LABEL_PLACEHOLDER]);
    });

    it('should mark circular references when stringifying', () => {
      const node: Record<string, unknown> = {};
      node.self = node;
      expect(safeStringify(node)).toBe('{"self":"[Circular]"}');
    });
  });

  describe('env', () => {
    it.each([
      {
        scope: 'service',
        key: `stratum_config_${PRODUCT_NAME}`,
        add: (fn: Mock) => addStratumSnapshotListener(PRODUCT_NAME, fn)
      },
      { scope: 'global', key: GLOBAL_LISTENER_KEY, add: addGlobalStratumSnapshotListener }
    ])('should add every $scope snapshot listener to globalThis', ({ key, add }) => {
      const listeners = [vi.fn(), vi.fn()];
      for (const listener of listeners) {
        expect(add(listener)).toBe(true);
      }
      expect(globalWindow[key].listeners).toStrictEqual(listeners);
    });

    describe('generateDefaultSessionId()', () => {
      it('should generate a valid UUID (non NIL) by default', () => {
        expect(isUuid(generateDefaultSessionId())).toBe(true);
      });

      it('should store the default session id in session storage', () => {
        expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toBeNull();
        const id = generateDefaultSessionId();
        expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toEqual(id);
      });

      it('should return the session id from session storage if available', () => {
        sessionStorage.setItem(STORED_SESSION_ID_KEY, SESSION_ID);
        expect(generateDefaultSessionId()).toEqual(SESSION_ID);
      });

      it('should return a random uuid if an error is encountered', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error();
        });
        expect(isUuid(generateDefaultSessionId())).toBe(true);
      });
    });

    it('should execute console.debug only if debugModeEnabled', () => {
      const logger = new Logger();
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const message = 'test-string';

      logger.debug(message);
      expect(consoleSpy).toHaveBeenCalledTimes(0);

      enableDebugMode(true);
      logger.debug(message);
      expect(consoleSpy).toHaveBeenCalledExactlyOnceWith('[Stratum]', message);
    });

    describe('debugModeEnabled()', () => {
      it('should return true if debug mode flag is found in session storage', () => {
        expect(debugModeEnabled()).toBe(false);
        enableDebugMode(true);
        expect(debugModeEnabled()).toBe(true);
      });

      it('should return false if session storage is unavailable', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error();
        });
        expect(debugModeEnabled()).toEqual(false);
      });
    });

    describe('uuid()', () => {
      it('should return a random UUID', () => {
        const first = uuid();
        const second = uuid();

        expect(isUuid(first)).toBe(true);
        expect(isUuid(second)).toBe(true);
        expect(first).not.toEqual(second);
      });

      it('should return the nil UUID if crypto library is unavailable', () => {
        delete globalWindow.crypto;
        expect(uuid()).toEqual('00000000-0000-0000-0000-000000000000');
      });
    });
  });

  describe('global-plugins', () => {
    it('should get global plugins', () => {
      const plugins = createSamplePlugins();
      setGlobalPlugins(plugins);
      expect(getGlobalPlugins()).toEqual(plugins);
    });

    it('should create the global namespace when adding the first plugin', () => {
      const plugin = new PluginA();
      expect(addGlobalPlugin(plugin)).toEqual([plugin]);
      expect(globalWindow[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin]);
    });

    it.each([
      { state: 'an empty', existing: undefined },
      { state: 'a populated', existing: [new PluginA()] }
    ])('should append a plugin to $state global plugin list', ({ existing }) => {
      setGlobalPlugins(existing && [...existing]);
      const plugin = new PluginA();
      expect(addGlobalPlugin(plugin)).toEqual([...(existing ?? []), plugin]);
    });

    it.each([
      { name: PLUGIN_A_NAME, remaining: (plugins: unknown[]) => plugins.slice(1) },
      { name: 'pluginC', remaining: (plugins: unknown[]) => plugins }
    ])('should remove only a registered plugin named $name', ({ name, remaining }) => {
      const plugins = createSamplePlugins();
      setGlobalPlugins([...plugins]);
      expect(removeGlobalPlugin(name)).toEqual(remaining(plugins));
    });

    it('should return no plugins when removing without a global namespace', () => {
      expect(removeGlobalPlugin(PLUGIN_A_NAME)).toEqual([]);
    });
  });
});
