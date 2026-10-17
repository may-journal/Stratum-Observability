import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE_EVENT_TYPE, BaseEventModel, BasePlugin, type Injector, type StratumService } from '../src';
import { NewRelicPlusPluginFactory } from '../src/plugins/new-relic-plus';
import type { PluginContext, PluginHooks } from '../src/types';
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
  PluginBFactory,
  SampleEventType,
  SamplePublisher,
  VAR1
} from './utils/sample-plugin';

const UNKNOWN_VAR = 'var3';
const CUSTOM_VAR = 'myCustomVar';

type ContextPlugin = BasePlugin<PluginContext, never>;

const CONTEXT_PLUGINS = [
  { name: 'the sample plugin', create: () => PluginAFactory() as unknown as ContextPlugin, key: VAR1 },
  {
    name: 'New Relic Plus',
    create: () =>
      NewRelicPlusPluginFactory({ defaultContext: { [CUSTOM_VAR]: undefined } }) as unknown as ContextPlugin,
    key: CUSTOM_VAR
  }
];

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
    it('0004.1 registers a plugin at run time and populates the publishing flow', async () => {
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

    it('0004.4 lets plugin b publishers receive events from plugin a via acceptedEventModels', async () => {
      stratum.addPlugin(PluginBFactory({ pluginOptions: PLUGIN_B_OPTIONS, acceptedEventModels: [AModel] }));
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));

      expect(getPublishers(stratum)).toHaveLength(2);
      expect(Object.keys(snapshot.plugins)).toStrictEqual([PLUGIN_A_NAME, PLUGIN_B_NAME]);
      expect(snapshot.plugins[PLUGIN_B_NAME].options).toStrictEqual(PLUGIN_B_OPTIONS);
    });

    it('0004.3 ignores an event type that another plugin already registered', () => {
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
    it.each(CONTEXT_PLUGINS)('0006.1 sets a declared context key on $name', ({ create, key }) => {
      const plugin = create();
      expect(plugin.setContext(key, UPDATED_CONTEXT_VALUE)).toBe(true);
      expect(plugin.getContext(key)).toBe(UPDATED_CONTEXT_VALUE);
    });

    it.each(CONTEXT_PLUGINS)('0006.2 refuses an undeclared context key on $name', ({ create }) => {
      const plugin = create();
      expect(plugin.setContext(UNKNOWN_VAR, '456')).toBe(false);
      expect(plugin.getContext(UNKNOWN_VAR)).toBeUndefined();
    });
  });

  describe('plugin publishing', () => {
    it('0006.3 keeps context keys unprefixed when useGlobalContextPrefix is false', async () => {
      pluginA.useGlobalContextPrefix = false;
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));
      expect(snapshot.globalContext[PLUGIN_A_NAME]).toStrictEqual({ [VAR1]: DEFAULT_VAR1 });
    });

    it('0004.5 restricts publishing to plugin-specific models by default', () => {
      expect(pluginA.publishers[0].acceptedEventModels).toStrictEqual([EmptyModel, AModel]);
    });

    it('0004.7 accepts every event model when a publisher outside any plugin sets no acceptedEventModels', () => {
      const model = stratum.defaultCatalog?.validModels[1] as BaseEventModel;
      expect(new SamplePublisher('unregistered').shouldPublishEvent(model)).toBe(true);
    });
  });

  describe('plugin lifecycle hooks', () => {
    it('0004.6 lets a plugin register and publish from a catalog via hooks.addCatalog', async () => {
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
});
