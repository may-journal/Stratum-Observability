import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratumService } from '../../src';
import { NEW_RELIC_PLUGIN_NAME, NewRelicPluginFactory, NewRelicPublisher } from '../../src/plugins/new-relic';
import { NewRelicPlusPluginFactory } from '../../src/plugins/new-relic-plus';
import { NR_API_KEY, NR_CATALOG, SAMPLE_A_CATALOG } from '../utils/catalog';
import { AB_TEST_SCHEMA, CATALOG_METADATA, METADATA_CATALOG_ID } from '../utils/constants';
import { NR_MOCK, PLUGIN_A_CONTEXT } from '../utils/fixtures';
import {
  createService,
  expectNewRelicEvent,
  mockCrypto,
  mockNewRelic,
  mockSessionId,
  newRelicAttributes,
  restoreStratumMocks,
  spyOnNewRelic
} from '../utils/helpers';
import { PLUGIN_A_NAME, type PluginA, PluginAFactory } from '../utils/sample-plugin';

describe('publishing events via NewRelicPublisher', () => {
  let stratum: StratumService;
  let pluginA: PluginA;

  beforeEach(() => {
    mockCrypto();
    mockNewRelic();
    mockSessionId();
    pluginA = PluginAFactory({ defaultContext: PLUGIN_A_CONTEXT });
    stratum = createService({ plugins: [pluginA, NewRelicPluginFactory()] });
    stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    stratum.startAbTest(AB_TEST_SCHEMA);
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  it('should send the event, its context and ab test data to window.newrelic', async () => {
    const spies = spyOnNewRelic();
    const eventName = 'testEvent';

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      replacements: { PLACEHOLDER_2: eventName }
    });

    expect(result).toBe(true);
    expectNewRelicEvent(spies, NR_MOCK.sampleA, eventName);
  });

  it('should apply isValid attribute, if provided', async () => {
    const spies = spyOnNewRelic();

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      pluginData: { [NEW_RELIC_PLUGIN_NAME]: { isValid: true } }
    });

    expect(result).toBe(true);
    expect(newRelicAttributes(spies).isValid).toBe(true);
  });

  it('should apply context data from other plugins', async () => {
    stratum = createService({ plugins: [pluginA] });
    stratum.addPlugin(NewRelicPlusPluginFactory());
    const spies = spyOnNewRelic();
    const id = stratum.addCatalog({ items: NR_CATALOG, ...CATALOG_METADATA }).id;

    expect(await stratum.publishFromCatalog(id, NR_API_KEY)).toBe(true);
    for (const [key, value] of Object.entries(PLUGIN_A_CONTEXT)) {
      expect(spies.setAttribute).toHaveBeenCalledWith(`${PLUGIN_A_NAME}_${key}`, value);
    }
  });

  it('should be unavailable outside a browser window', async () => {
    vi.stubGlobal('window', undefined);
    expect(await new NewRelicPublisher().isAvailable()).toBe(false);
  });
});
