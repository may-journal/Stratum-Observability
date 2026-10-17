import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  addGlobalPlugin,
  addGlobalStratumSnapshotListener,
  addStratumSnapshotListener,
  BASE_EVENT_TYPE,
  BaseEventModel,
  DEBUG_LOG_PREFIX,
  debugModeEnabled,
  GLOBAL_LISTENER_KEY,
  generateDefaultSessionId,
  generateStratumSnapshot,
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
import { INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import { CATALOG_METADATA, globalWindow, PRODUCT_NAME, PRODUCT_VERSION } from './utils/constants';
import {
  createSamplePlugins,
  createService,
  enableDebugMode,
  isUuid,
  mockCrypto,
  restoreStratumMocks,
  setGlobalPlugins,
  spyOnConsoleDebug
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

    describe('RegisteredStratumCatalog', () => {
      function createCatalog(items: StratumCatalog | object = SAMPLE_A_CATALOG) {
        const options = { items: items as StratumCatalog, ...CATALOG_METADATA };
        return new RegisteredStratumCatalog(CATALOG_ID, options, injector, vi.fn());
      }

      it.each([
        {
          step: 'construction',
          create: () => createCatalog(INVALID_SAMPLE_CATALOG),
          validCount: 1,
          errorCount: 4
        },
        {
          step: 'addItems',
          create: () => createCatalog().addItems(INVALID_SAMPLE_CATALOG as StratumCatalog),
          validCount: Object.keys(SAMPLE_A_CATALOG).length,
          errorCount: Object.keys(INVALID_SAMPLE_CATALOG).length
        }
      ])('0002.3 holds back invalid items on $step with one error each', ({ create, validCount, errorCount }) => {
        const catalog = create();

        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toHaveLength(validCount);
        expect(Object.keys(catalog.errors)).toHaveLength(errorCount);
        for (const { errors } of Object.values(catalog.errors)) {
          expect(errors).toHaveLength(1);
        }
      });

      it('0003.5 appends errors when an invalid key is added again', () => {
        const catalog = createCatalog({ 1: INVALID_SAMPLE_CATALOG[1] });
        catalog.addItems({ 1: INVALID_SAMPLE_CATALOG[1] } as StratumCatalog);

        expect(catalog.errors[1].errors).toHaveLength(2);
      });

      it('0007.7 leaves plugin data out of snapshots for publishers without a plugin', () => {
        const catalog = createCatalog();
        const publishers = [new SamplePublisher('unregistered')];
        const snapshot = generateStratumSnapshot(injector, catalog.validModels[1], catalog, publishers);
        expect(snapshot.plugins).toStrictEqual({});
      });

      it('0003.6 recovers isValid when failed keys are re-added successfully', () => {
        const catalog = createCatalog({ 1: INVALID_SAMPLE_CATALOG[1] });
        expect(catalog.isValid).toBe(false);

        catalog.addItems(SAMPLE_A_CATALOG);

        expect(catalog.isValid).toBe(true);
        expect(Object.keys(catalog.errors)).toHaveLength(0);
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

    it.each([{ id: -1 }, { id: '' }, { id: true }])('0002.4 rejects the invalid id $id', ({ id }) => {
      const model = createModel({ id });
      expect(model.isValid).toBe(false);
      expect(model.validationErrors).toStrictEqual(['An invalid id was provided']);
    });

    it('0002.5 rejects a catalog item that is not a plain object', () => {
      const item = Object.assign(() => undefined, { eventType: BASE_EVENT_TYPE, description: 'fn', id: 1 });
      const model = new BaseEventModel(MODEL_KEY, item, CATALOG_ID, injector);
      expect(model.isValid).toBe(false);
      expect(model.validationErrors).toStrictEqual(['Catalog item has an unexpected format']);
    });

    it.each([
      {
        replacement: 'a value in a nested field',
        item: { details: { label: LABEL_PLACEHOLDER } },
        replacements: { LABEL: 'nested' },
        read: (data: { details: { label: string } }) => data.details.label,
        expected: 'nested'
      },
      {
        replacement: 'a function',
        item: { description: '{{KEY}}' },
        replacements: { KEY: (m: BaseEventModel) => m.key },
        read: (data: { description: string }) => data.description,
        expected: MODEL_KEY
      }
    ])('0007.4 replaces placeholders with $replacement', ({ item, replacements, read, expected }) => {
      const data = createModel({ id: 1, ...item }).getData({ replacements });
      expect(read(data)).toBe(expected);
    });

    it.each([
      { kind: 'a null value', value: () => null, expected: null },
      { kind: 'a list', value: () => [LABEL_PLACEHOLDER], expected: [LABEL_PLACEHOLDER] }
    ])('0007.8 leaves $kind passed to performReplacements unchanged', ({ value, expected }) => {
      const target = value();
      performReplacements(createModel({ id: 1 }), target, { LABEL: 'replaced' });
      expect(target).toStrictEqual(expected);
    });

    it('0007.5 marks circular references when converting to JSON', () => {
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
      {
        scope: 'service instance',
        key: `stratum_config_${PRODUCT_NAME}`,
        add: (fn: Mock) => createService().addSnapshotListener(fn)
      },
      { scope: 'global', key: GLOBAL_LISTENER_KEY, add: addGlobalStratumSnapshotListener }
    ])('0008.3 adds every $scope snapshot listener to globalThis in order', ({ key, add }) => {
      const listeners = [vi.fn(), vi.fn()];
      for (const listener of listeners) {
        expect(add(listener)).toBe(true);
      }
      expect(globalWindow[key].listeners).toStrictEqual(listeners);
    });

    describe('generateDefaultSessionId()', () => {
      it('0001.4 creates a new random session id and stores it in session storage', () => {
        expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toBeNull();
        const first = generateDefaultSessionId();
        expect(isUuid(first)).toBe(true);
        expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toEqual(first);

        sessionStorage.clear();
        const second = generateDefaultSessionId();
        expect(isUuid(second)).toBe(true);
        expect(second).not.toEqual(first);
      });

      it('0001.6 returns a random uuid if session storage fails', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error();
        });
        expect(isUuid(generateDefaultSessionId())).toBe(true);
      });
    });

    it('0010.1 executes console.debug only if debug mode is enabled', () => {
      const logger = new Logger();
      const consoleSpy = spyOnConsoleDebug();
      const message = 'test-string';

      logger.debug(message);
      expect(consoleSpy).toHaveBeenCalledTimes(0);

      enableDebugMode(true);
      logger.debug(message);
      expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(DEBUG_LOG_PREFIX, message);
    });

    it('0010.2 turns debug mode off if session storage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error();
      });
      expect(debugModeEnabled()).toEqual(false);
    });

    it('0001.7 returns the nil UUID if the crypto library is unavailable', () => {
      delete globalWindow.crypto;
      expect(uuid()).toEqual('00000000-0000-0000-0000-000000000000');
    });
  });

  describe('global-plugins', () => {
    it.each([
      { state: 'no', existing: null },
      { state: 'an empty', existing: undefined },
      { state: 'a populated', existing: [new PluginA()] }
    ])('0005.2 appends a plugin to $state global plugin list', ({ existing }) => {
      if (existing !== null) {
        setGlobalPlugins(existing && [...existing]);
      }
      const plugin = new PluginA();
      const expected = [...(existing ?? []), plugin];

      expect(addGlobalPlugin(plugin)).toEqual(expected);
      expect(globalWindow[GLOBAL_LISTENER_KEY].globalPlugins).toEqual(expected);
    });

    it.each([
      { name: PLUGIN_A_NAME, remaining: (plugins: unknown[]) => plugins.slice(1) },
      { name: 'pluginC', remaining: (plugins: unknown[]) => plugins }
    ])('0005.3 removes only a registered plugin named $name', ({ name, remaining }) => {
      const plugins = createSamplePlugins();
      setGlobalPlugins([...plugins]);
      expect(removeGlobalPlugin(name)).toEqual(remaining(plugins));
    });

    it('0005.4 returns no plugins when removing without a global namespace', () => {
      expect(removeGlobalPlugin(PLUGIN_A_NAME)).toEqual([]);
    });
  });
});
