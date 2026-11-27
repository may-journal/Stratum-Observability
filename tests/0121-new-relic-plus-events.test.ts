import { afterEach, describe, expect, it } from 'vitest';
import type { StratumService } from '../src';
import { NewRelicPluginFactory } from '../src/plugins/new-relic';
import {
  NewRelicApiResponseEventModel,
  NewRelicErrorEventModel,
  NewRelicEventModel,
  NewRelicPlusPluginFactory
} from '../src/plugins/new-relic-plus';
import { NR_API_KEY, NR_API_NAME, NR_CATALOG, NR_ERROR_NAME, NR_EVENT_NAME, SAMPLE_A_CATALOG } from './utils/catalog';
import { AB_TEST_SCHEMA, CUSTOM_VAR, PLACEHOLDERS } from './utils/constants';
import { NR_MOCK, SAMPLE_EVENT_OPTIONS } from './utils/fixtures';
import {
  createService,
  expectNewRelicEvent,
  mockNewRelic,
  mockSessionId,
  newRelicAttributes,
  resetStratum,
  spyOnNewRelic,
  spyOnPublish
} from './utils/helpers';
import { PluginAFactory } from './utils/sample-plugin';

const NR_EVENT_KEY = 'nrEventValid';
const CUSTOM_VAR_2 = 'myCustomVar2';

/**
 * A service with New Relic Plus ahead of the New Relic plugin, the New
 * Relic catalog and one running A/B test.
 */
function createNewRelicPlusService() {
  mockSessionId();
  mockNewRelic();
  const stratum = createService({
    catalog: { items: NR_CATALOG },
    plugins: [NewRelicPlusPluginFactory(), NewRelicPluginFactory()]
  });
  stratum.startAbTest(AB_TEST_SCHEMA);
  return stratum;
}

/**
 * A service with New Relic Plus alone, declaring one unset and one set
 * context value.
 */
function createCustomContextService() {
  mockSessionId();
  mockNewRelic();
  const nrpPlugin = NewRelicPlusPluginFactory({
    defaultContext: { [CUSTOM_VAR]: undefined, [CUSTOM_VAR_2]: 'initial' }
  });
  const stratum = createService({ catalog: { items: NR_CATALOG }, plugins: [nrpPlugin] });
  return { stratum, nrpPlugin };
}

describe('0121 New Relic Plus Events', () => {
  afterEach(() => {
    resetStratum();
  });

  it('0121.1 each item is held back with one error per missing field', () => {
    const stratum = createNewRelicPlusService();
    const cases = [
      { key: 'nrEventInvalid', errorCount: 1 },
      { key: 'nrApiInvalid', errorCount: 2 },
      { key: 'nrErrorInvalid', errorCount: 2 }
    ];

    for (const { key, errorCount } of cases) {
      expect.soft(stratum.defaultCatalog?.errors[key].errors, key).toHaveLength(errorCount);
    }
  });

  it("0121.2 New Relic saves one interaction with that type's fields", async () => {
    const cases = [
      { key: NR_EVENT_KEY, model: NewRelicEventModel, attributes: NR_MOCK.event, name: NR_EVENT_NAME },
      { key: NR_API_KEY, model: NewRelicApiResponseEventModel, attributes: NR_MOCK.api, name: NR_API_NAME },
      { key: 'nrErrorValid', model: NewRelicErrorEventModel, attributes: NR_MOCK.error, name: NR_ERROR_NAME }
    ];

    for (const { key, model, attributes, name } of cases) {
      resetStratum();
      const stratum = createNewRelicPlusService();
      expect.soft(Object.keys(stratum.injector.plugins), key).toHaveLength(1);
      expect.soft(stratum.defaultCatalog?.validModels[key], key).toBeInstanceOf(model);
      const publisherSpy = spyOnPublish(stratum.publishers[0]);
      const spies = spyOnNewRelic();

      expect.soft(await stratum.publish(key), key).toBe(true);
      expect.soft(publisherSpy, key).toHaveBeenCalledTimes(1);
      expectNewRelicEvent(spies, attributes, name);
    }
  });

  it('0121.3 the interaction leaves that value out', async () => {
    for (const value of [undefined, null]) {
      resetStratum();
      const { stratum, nrpPlugin } = createCustomContextService();
      nrpPlugin.setContext(CUSTOM_VAR, value);
      const spies = spyOnNewRelic();
      await stratum.publish(NR_EVENT_KEY);
      const attributeNames = Object.keys(newRelicAttributes(spies));
      expect.soft(attributeNames, String(value)).not.toContain(`stratum_${CUSTOM_VAR}`);
      expect.soft(attributeNames, String(value)).toContain(`stratum_${CUSTOM_VAR_2}`);
    }
  });

  it('0121.4 the interaction carries each value with the `stratum_` prefix', async () => {
    const events = [
      { event: 'a New Relic event', publish: (s: StratumService) => s.publish(NR_EVENT_KEY) },
      {
        event: "another plugin's event",
        publish: (s: StratumService) => {
          s.addPlugin(PluginAFactory());
          const id = s.addCatalog({ items: SAMPLE_A_CATALOG, componentName: 'noop' }).id;
          return s.publishFromCatalog(id, 1);
        }
      }
    ];

    for (const { event, publish } of events) {
      resetStratum();
      const { stratum, nrpPlugin } = createCustomContextService();
      const spies = spyOnNewRelic();
      nrpPlugin.setContext(CUSTOM_VAR, 'custom');
      nrpPlugin.setContext(CUSTOM_VAR_2, false);
      await publish(stratum);
      const attributes = newRelicAttributes(spies);
      expect.soft(attributes[`stratum_${CUSTOM_VAR}`], event).toBe('custom');
      expect.soft(attributes[`stratum_${CUSTOM_VAR_2}`], event).toBe(false);
    }
  });

  it('0121.5 the interaction carries the replaced request fields', async () => {
    const stratum = createNewRelicPlusService();
    const spies = spyOnNewRelic();
    expect(await stratum.publish('nrApiPlaceholders', SAMPLE_EVENT_OPTIONS)).toBe(true);

    const publishData: Record<string, unknown> = { ...newRelicAttributes(spies), name: spies.setName.mock.calls[0][0] };
    const replaced = Object.entries(NR_CATALOG.nrApiPlaceholders).flatMap(([key, value]) => {
      const placeholder = /^\{\{(\w+)\}\}$/.exec(String(value))?.[1];
      return placeholder ? [{ key, placeholder }] : [];
    });

    expect(replaced).not.toHaveLength(0);
    for (const { key, placeholder } of replaced) {
      expect.soft(publishData[key], key).toBe(PLACEHOLDERS[placeholder]);
    }
  });
});
