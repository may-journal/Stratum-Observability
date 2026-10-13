import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE_EVENT_TYPE, BaseEventModel, BasePlugin, Injector, type StratumService } from '../src';
import type { PluginHooks } from '../src/types';
import { SAMPLE_A_CATALOG } from './utils/catalog';
import { UPDATED_CONTEXT_VALUE } from './utils/constants';
import {
  captureSnapshot,
  createService,
  enableDebugMode,
  getPublishers,
  restoreStratumMocks,
  spyOnDebugLog
} from './utils/helpers';
import {
  AModel,
  DEFAULT_VAR1,
  EmptyModel,
  PLUGIN_A_NAME,
  PLUGIN_B_NAME,
  PLUGIN_B_OPTIONS,
  type PluginA,
  PluginAFactory,
  PluginB,
  PluginBFactory,
  SampleEventType,
  SamplePublisher,
  VAR1
} from './utils/sample-plugin';

const UNKNOWN_VAR = 'var3';

describe('stratum base plugin functionality', () => {
  let stratum: StratumService;
  let pluginA: PluginA;

  beforeEach(() => {
    enableDebugMode(true);
    pluginA = PluginAFactory();
    stratum = createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: [pluginA] });
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  describe('run time plugin registration', () => {
    it('should allow run time plugin registration and populate across the publishing flow', async () => {
      stratum.addPlugin(PluginBFactory({ pluginOptions: PLUGIN_B_OPTIONS }));
      const { listener, snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));

      expect(Object.keys(stratum.injector.plugins)).toStrictEqual([PLUGIN_A_NAME, PLUGIN_B_NAME]);
      expect(Object.keys(stratum.injector.eventTypeModelMap).sort()).toStrictEqual([
        SampleEventType.A,
        SampleEventType.B,
        BASE_EVENT_TYPE,
        'empty'
      ]);
      expect(stratum.injector.eventTypeModelMap.empty.pluginName).toEqual(PLUGIN_A_NAME);
      expect(getPublishers(stratum)).toHaveLength(2);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(Object.keys(snapshot.plugins)).toStrictEqual([PLUGIN_A_NAME]);
    });

    it('should allow plugin b publishers to intercept events from plugin a via acceptedEventModels', async () => {
      stratum.addPlugin(PluginBFactory({ pluginOptions: PLUGIN_B_OPTIONS, acceptedEventModels: [AModel] }));
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));

      expect(getPublishers(stratum)).toHaveLength(2);
      expect(Object.keys(snapshot.plugins)).toStrictEqual([PLUGIN_A_NAME, PLUGIN_B_NAME]);
      expect(snapshot.plugins[PLUGIN_B_NAME].options).toStrictEqual(PLUGIN_B_OPTIONS);
    });

    it('should ignore an event type that another plugin already registered', () => {
      const debugSpy = spyOnDebugLog();
      class DuplicateTypePlugin extends BasePlugin<never, never> {
        name = 'duplicate-type';
        eventTypes = { [BASE_EVENT_TYPE]: AModel };
      }

      stratum.addPlugin(new DuplicateTypePlugin());

      expect(stratum.injector.eventTypeModelMap[BASE_EVENT_TYPE].model).toBe(BaseEventModel);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('plugin context', () => {
    it('should handle setting valid context vars', () => {
      expect(pluginA.getContext(VAR1)).toBe(DEFAULT_VAR1);
      expect(pluginA.setContext(VAR1, UPDATED_CONTEXT_VALUE)).toBe(true);
      expect(pluginA.getContext(VAR1)).toBe(UPDATED_CONTEXT_VALUE);
    });

    it('should handle setting invalid context vars', () => {
      // @ts-expect-error testing runtime handling with invalid types
      expect(pluginA.setContext(UNKNOWN_VAR, '456')).toBe(false);
      // @ts-expect-error testing runtime handling with invalid types
      expect(pluginA.getContext(UNKNOWN_VAR)).toBeUndefined();
    });
  });

  describe('plugin publishing', () => {
    it('should keep context keys unprefixed when useGlobalContextPrefix is false', async () => {
      pluginA.useGlobalContextPrefix = false;
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));
      expect(snapshot.globalContext[PLUGIN_A_NAME]).toStrictEqual({ [VAR1]: DEFAULT_VAR1 });
    });

    it('should restrict publishing to plugin-specific models by default', () => {
      expect(pluginA.publishers[0].acceptedEventModels).toStrictEqual([EmptyModel, AModel]);
    });

    it('should accept every event model when a publisher sets no acceptedEventModels', () => {
      const model = stratum.defaultCatalog?.validModels[1] as BaseEventModel;
      expect(new SamplePublisher('unregistered').shouldPublishEvent(model)).toBe(true);
    });
  });

  describe('plugin lifecycle hooks', () => {
    it('should fire onRegister when plugin is loaded into the StratumService', () => {
      const onRegisterHookSpy = vi.spyOn(PluginB.prototype, 'onRegister');
      const pluginB = PluginBFactory({ pluginOptions: PLUGIN_B_OPTIONS });
      expect(onRegisterHookSpy).toHaveBeenCalledTimes(0);
      stratum.addPlugin(pluginB);
      expect(onRegisterHookSpy).toHaveBeenCalledWith(
        expect.any(Injector),
        expect.objectContaining({ addCatalog: expect.any(Function) })
      );
    });

    it('should allow a plugin to register and publish from a catalog via hooks.addCatalog', async () => {
      let publishRef: () => Promise<boolean> = async () => false;

      class HooksPlugin extends BasePlugin<never, never> {
        name = 'hooks';
        onRegister(_injector: Injector, hooks: PluginHooks) {
          const catalog = hooks.addCatalog({ items: SAMPLE_A_CATALOG, componentName: 'hooks-test' });
          publishRef = () => catalog.publish(1);
        }
      }

      stratum.addPlugin(new HooksPlugin());
      const { listener, snapshot } = await captureSnapshot(stratum, () => publishRef());

      expect(listener).toHaveBeenCalledTimes(1);
      expect(snapshot.event.id).toBe(1);
    });
  });

  describe('atomic publishing', () => {
    it('should preserve plugin vars at the time publish was called', async () => {
      const first = await captureSnapshot(stratum, () => {
        stratum.publish(1);
        pluginA.setContext(VAR1, UPDATED_CONTEXT_VALUE);
      });
      expect(first.snapshot.plugins[PLUGIN_A_NAME].context.var1).toEqual(DEFAULT_VAR1);

      const second = await captureSnapshot(stratum, () => stratum.publish(1));
      expect(second.snapshot.plugins[PLUGIN_A_NAME].context.var1).toEqual(UPDATED_CONTEXT_VALUE);
    });
  });
});
