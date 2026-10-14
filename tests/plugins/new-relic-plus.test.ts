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

  it('0004.2 registers only the first of the NewRelic and NewRelicPlus plugins', () => {
    expect(Object.keys(stratum.injector.plugins)).toStrictEqual([NEW_RELIC_PLUGIN_NAME]);
    expect(stratum.injector.plugins[NEW_RELIC_PLUGIN_NAME]).toBe(nrpPlugin);
    expect(getPublishers(stratum)).toStrictEqual(nrpPlugin.publishers);
    expect(getPublishers(stratum)[0]).toBeInstanceOf(NewRelicPublisher);
  });

  it.each([
    { key: 'nrEventInvalid', errorCount: 1 },
    { key: 'nrApiInvalid', errorCount: 2 },
    { key: 'nrErrorInvalid', errorCount: 2 }
  ])('0121.1 records $errorCount validation errors for the invalid catalog item $key', ({ key, errorCount }) => {
    expect(stratum.defaultCatalog?.errors[key].errors).toHaveLength(errorCount);
  });

  it.each([
    { key: NR_EVENT_KEY, model: NewRelicEventModel, attributes: NR_MOCK.event, name: NR_EVENT_NAME },
    { key: NR_API_KEY, model: NewRelicApiResponseEventModel, attributes: NR_MOCK.api, name: NR_API_NAME },
    { key: 'nrErrorValid', model: NewRelicErrorEventModel, attributes: NR_MOCK.error, name: NR_ERROR_NAME }
  ])('0121.2 loads $key as its event model and publishes it to New Relic', async ({ key, model, attributes, name }) => {
    expect(stratum.defaultCatalog?.validModels[key]).toBeInstanceOf(model);
    const publisherSpy = spyOnPublish(stratum.publishers[0]);
    const spies = spyOnNewRelic();

    expect(await stratum.publish(key)).toBe(true);
    expect(publisherSpy).toHaveBeenCalledTimes(1);
    expectNewRelicEvent(spies, attributes, name);
  });

  it('0121.5 replaces placeholders within the nrApi request fields', async () => {
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

    it.each([undefined, null])('0121.3 does not publish a context variable set to %s', async (value) => {
      nrpPlugin.setContext(CUSTOM_VAR, value);
      const spies = spyOnNewRelic();
      await stratum.publish(NR_EVENT_KEY);
      const attributeNames = Object.keys(newRelicAttributes(spies));
      expect(attributeNames).not.toContain(`stratum_${CUSTOM_VAR}`);
      expect(attributeNames).toContain(`stratum_${CUSTOM_VAR_2}`);
    });

    it.each([
      { event: 'a New Relic event', publish: (s: StratumService) => s.publish(NR_EVENT_KEY) },
      {
        event: "another plugin's event",
        publish: (s: StratumService) => {
          s.addPlugin(PluginAFactory());
          const id = s.addCatalog({ items: SAMPLE_A_CATALOG, componentName: 'noop' }).id;
          return s.publishFromCatalog(id, 1);
        }
      }
    ])('0121.4 passes prefixed context variables when publishing $event', async ({ publish }) => {
      const spies = spyOnNewRelic();
      nrpPlugin.setContext(CUSTOM_VAR, 'custom');
      nrpPlugin.setContext(CUSTOM_VAR_2, false);
      await publish(stratum);
      const attributes = newRelicAttributes(spies);
      expect(attributes[`stratum_${CUSTOM_VAR}`]).toBe('custom');
      expect(attributes[`stratum_${CUSTOM_VAR_2}`]).toBe(false);
    });
  });
});
