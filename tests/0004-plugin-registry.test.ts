import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BASE_EVENT_TYPE, BaseEventModel, BasePlugin, type Injector, type StratumService } from '../src';
import { NEW_RELIC_PLUGIN_NAME, NewRelicPluginFactory, NewRelicPublisher } from '../src/plugins/new-relic';
import { NewRelicPlusPluginFactory } from '../src/plugins/new-relic-plus';
import type { PluginHooks } from '../src/types';
import { NR_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import {
  captureSnapshot,
  createService,
  enableDebugMode,
  getPublishers,
  mockNewRelic,
  mockSessionId,
  resetStratum,
  spyOnDebugLog
} from './utils/helpers';
import {
  AModel,
  EmptyModel,
  PLUGIN_A_NAME,
  PLUGIN_B_NAME,
  PLUGIN_B_OPTIONS,
  type PluginA,
  PluginAFactory,
  PluginBFactory,
  SampleEventType,
  SamplePublisher
} from './utils/sample-plugin';

describe('0004 Plugin Registry', () => {
  let stratum: StratumService;
  let pluginA: PluginA;

  beforeEach(() => {
    enableDebugMode(true);
    pluginA = PluginAFactory();
    stratum = createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: [pluginA] });
  });

  afterEach(() => {
    resetStratum();
  });

  it("0004.1 the plugin's event types validate items and its publisher gets events", async () => {
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

  it('0004.2 only the first plugin and its publisher are registered', () => {
    mockSessionId();
    mockNewRelic();
    const debugSpy = spyOnDebugLog();
    const nrpPlugin = NewRelicPlusPluginFactory();
    const service = createService({ catalog: { items: NR_CATALOG }, plugins: [nrpPlugin, NewRelicPluginFactory()] });

    expect(debugSpy).toHaveBeenCalledWith(`Unable to register plugin: duplicate name "${NEW_RELIC_PLUGIN_NAME}"`);
    expect(Object.keys(service.injector.plugins)).toStrictEqual([NEW_RELIC_PLUGIN_NAME]);
    expect(service.injector.plugins[NEW_RELIC_PLUGIN_NAME]).toBe(nrpPlugin);
    expect(getPublishers(service)).toStrictEqual(nrpPlugin.publishers);
    expect(getPublishers(service)[0]).toBeInstanceOf(NewRelicPublisher);
  });

  it('0004.3 the first plugin keeps the type and a debug line says why', () => {
    const debugSpy = spyOnDebugLog();
    class DuplicateTypePlugin extends BasePlugin<never, never> {
      name = 'duplicate-type';
      eventTypes = { [BASE_EVENT_TYPE]: AModel };
    }

    stratum.addPlugin(new DuplicateTypePlugin());

    expect(stratum.injector.eventTypeModelMap[BASE_EVENT_TYPE].model).toBe(BaseEventModel);
    expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
      `Unable to register plugin eventType: duplicate name "${BASE_EVENT_TYPE}"`
    );
  });

  it("0004.4 that publisher gets the event with its plugin's options", async () => {
    stratum.addPlugin(PluginBFactory({ pluginOptions: PLUGIN_B_OPTIONS, acceptedEventModels: [AModel] }));
    const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));

    expect(getPublishers(stratum)).toHaveLength(2);
    expect(Object.keys(snapshot.plugins)).toStrictEqual([PLUGIN_A_NAME, PLUGIN_B_NAME]);
    expect(snapshot.plugins[PLUGIN_B_NAME].options).toStrictEqual(PLUGIN_B_OPTIONS);
  });

  it("0004.5 the publisher accepts only its own plugin's event types", () => {
    expect(pluginA.publishers[0].acceptedEventModels).toStrictEqual([EmptyModel, AModel]);
  });

  it('0004.6 the snapshot listener gets the event', async () => {
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

  it('0004.7 the publisher accepts every event', () => {
    const model = stratum.defaultCatalog?.validModels[1] as BaseEventModel;
    expect(new SamplePublisher('unregistered').shouldPublishEvent(model)).toBe(true);
  });
});
