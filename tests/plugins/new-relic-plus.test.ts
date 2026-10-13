import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratumService } from '../../src';
import { NEW_RELIC_PLUGIN_NAME, NewRelicPluginFactory, NewRelicPublisher } from '../../src/plugins/new-relic';
import {
  NewRelicApiResponseEventModel,
  NewRelicErrorEventModel,
  NewRelicEventModel,
  type NewRelicPlusPlugin,
  NewRelicPlusPluginFactory
} from '../../src/plugins/new-relic-plus';
import { NR_API_KEY, NR_API_NAME, NR_CATALOG, NR_ERROR_NAME, NR_EVENT_NAME, SAMPLE_A_CATALOG } from '../utils/catalog';
import { AB_TEST_SCHEMA, PLACEHOLDERS } from '../utils/constants';
import { NR_MOCK, SAMPLE_EVENT_OPTIONS } from '../utils/fixtures';
import {
  createService,
  expectNewRelicEvent,
  getPublishers,
  mockNewRelic,
  mockSessionId,
  newRelicAttributes,
  restoreStratumMocks,
  spyOnNewRelic,
  spyOnPublish
} from '../utils/helpers';
import { PluginAFactory } from '../utils/sample-plugin';

const NR_EVENT_KEY = 'nrEventValid';
const CUSTOM_VAR = 'myCustomVar';
const CUSTOM_VAR_2 = 'myCustomVar2';

describe('NewRelicPlusPublisher', () => {
  let stratum: StratumService;
  let nrpPlugin: NewRelicPlusPlugin;

  beforeEach(() => {
    mockSessionId();
    mockNewRelic();
    nrpPlugin = NewRelicPlusPluginFactory();
    stratum = createService({ catalog: { items: NR_CATALOG }, plugins: [nrpPlugin, NewRelicPluginFactory()] });
    stratum.startAbTest(AB_TEST_SCHEMA);
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  it('should not register both the NewRelic and NewRelicPlus plugin', () => {
    expect(Object.keys(stratum.injector.plugins)).toStrictEqual([NEW_RELIC_PLUGIN_NAME]);
  });

  it('should initialize the NewRelic publisher', () => {
    expect(getPublishers(stratum)[0]).toBeInstanceOf(NewRelicPublisher);
  });

  it('should set the acceptedEventModels of NewRelicPlusPublisher to NR-events only', () => {
    expect(getPublishers(stratum)[0].acceptedEventModels).toEqual([
      NewRelicApiResponseEventModel,
      NewRelicErrorEventModel,
      NewRelicEventModel
    ]);
  });

  it.each([
    { key: NR_EVENT_KEY, model: NewRelicEventModel },
    { key: NR_API_KEY, model: NewRelicApiResponseEventModel },
    { key: 'nrErrorValid', model: NewRelicErrorEventModel }
  ])('should load the valid catalog item $key as its event model', ({ key, model }) => {
    expect(stratum.defaultCatalog?.validModels[key]).toBeInstanceOf(model);
  });

  it.each([
    { key: 'nrEventInvalid', errorCount: 1 },
    { key: 'nrApiInvalid', errorCount: 2 },
    { key: 'nrErrorInvalid', errorCount: 2 }
  ])('should record $errorCount validation errors for the invalid catalog item $key', ({ key, errorCount }) => {
    expect(stratum.defaultCatalog?.errors[key].errors).toHaveLength(errorCount);
  });

  it.each([
    { key: NR_EVENT_KEY, attributes: NR_MOCK.event, name: NR_EVENT_NAME },
    { key: NR_API_KEY, attributes: NR_MOCK.api, name: NR_API_NAME },
    { key: 'nrErrorValid', attributes: NR_MOCK.error, name: NR_ERROR_NAME }
  ])('should publish the $key event to New Relic', async ({ key, attributes, name }) => {
    const publisherSpy = spyOnPublish(stratum.publishers[0]);
    const spies = spyOnNewRelic();

    expect(await stratum.publish(key)).toBe(true);
    expect(publisherSpy).toHaveBeenCalledTimes(1);
    expectNewRelicEvent(spies, attributes, name);
  });

  it('should handle placeholders within the nrApi event type', async () => {
    const spies = spyOnNewRelic();
    expect(await stratum.publish('nrApiPlaceholders', SAMPLE_EVENT_OPTIONS)).toBe(true);

    const publishData = { ...newRelicAttributes(spies), name: spies.setName.mock.calls[0][0] };
    for (const [key, value] of Object.entries(NR_CATALOG.nrApiPlaceholders)) {
      const placeholder = /^\{\{(\w+)\}\}$/.exec(String(value))?.[1];
      if (placeholder) {
        expect(publishData[key]).toBe(PLACEHOLDERS[placeholder]);
      }
    }
  });

  describe('custom context', () => {
    beforeEach(() => {
      nrpPlugin = NewRelicPlusPluginFactory({
        defaultContext: { [CUSTOM_VAR]: undefined, [CUSTOM_VAR_2]: 'initial' }
      });
      stratum = createService({ catalog: { items: NR_CATALOG }, plugins: [nrpPlugin] });
    });

    it('should set the default context', () => {
      expect(stratum.injector.plugins[NEW_RELIC_PLUGIN_NAME].context).toMatchObject({
        [CUSTOM_VAR]: undefined,
        [CUSTOM_VAR_2]: 'initial'
      });
    });

    it('should only allow overriding default context keys', () => {
      expect(nrpPlugin.setContext('unknownVar', 1234)).toBe(false);
      expect(nrpPlugin.setContext(CUSTOM_VAR, 1234)).toBe(true);
      expect(nrpPlugin.setContext(CUSTOM_VAR_2, 678)).toBe(true);
      expect(stratum.injector.plugins[NEW_RELIC_PLUGIN_NAME].context).toMatchObject({
        [CUSTOM_VAR]: 1234,
        [CUSTOM_VAR_2]: 678
      });
    });

    it.each([undefined, null])('should not publish a context variable set to %s', async (value) => {
      nrpPlugin.setContext(CUSTOM_VAR, value);
      const spies = spyOnNewRelic();
      await stratum.publish(NR_EVENT_KEY);
      const attributeNames = Object.keys(newRelicAttributes(spies));
      expect(attributeNames).not.toContain(`stratum_${CUSTOM_VAR}`);
      expect(attributeNames).toContain(`stratum_${CUSTOM_VAR_2}`);
    });

    it('should pass prefixed context variables when publishing nr events', async () => {
      const spies = spyOnNewRelic();
      nrpPlugin.setContext(CUSTOM_VAR, 'custom');
      nrpPlugin.setContext(CUSTOM_VAR_2, false);
      await stratum.publish(NR_EVENT_KEY);
      const attributes = newRelicAttributes(spies);
      expect(attributes[`stratum_${CUSTOM_VAR}`]).toBe('custom');
      expect(attributes[`stratum_${CUSTOM_VAR_2}`]).toBe(false);
    });

    it('should include the default context when publishing other events', async () => {
      const spies = spyOnNewRelic();
      stratum.addPlugin(PluginAFactory());
      nrpPlugin.setContext(CUSTOM_VAR, 'test1');
      nrpPlugin.setContext(CUSTOM_VAR_2, 'test2');
      const id = stratum.addCatalog({ items: SAMPLE_A_CATALOG, componentName: 'noop' }).id;
      await stratum.publishFromCatalog(id, 1);
      const attributes = newRelicAttributes(spies);
      expect(attributes[`stratum_${CUSTOM_VAR}`]).toBe('test1');
      expect(attributes[`stratum_${CUSTOM_VAR_2}`]).toBe('test2');
    });
  });
});
