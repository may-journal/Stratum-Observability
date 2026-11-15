import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratumService } from '../src';
import { NEW_RELIC_PLUGIN_NAME, NewRelicPluginFactory, NewRelicPublisher } from '../src/plugins/new-relic';
import { NewRelicPlusPluginFactory } from '../src/plugins/new-relic-plus';
import { NR_API_KEY, NR_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import { AB_TEST_SCHEMA, CATALOG_METADATA, METADATA_CATALOG_ID } from './utils/constants';
import { NR_MOCK, PLUGIN_A_CONTEXT } from './utils/fixtures';
import {
  createService,
  expectNewRelicEvent,
  mockCrypto,
  mockNewRelic,
  mockSessionId,
  newRelicAttributes,
  resetStratum,
  spyOnNewRelic
} from './utils/helpers';
import { PLUGIN_A_NAME, type PluginA, PluginAFactory } from './utils/sample-plugin';

describe('0111 New Relic Interactions', () => {
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
    resetStratum();
  });

  it("0111.1 New Relic saves one interaction with that name and Stratum's attributes", async () => {
    const spies = spyOnNewRelic();
    const eventName = 'testEvent';

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      replacements: { PLACEHOLDER_2: eventName }
    });

    expect(result).toBe(true);
    expectNewRelicEvent(spies, NR_MOCK.sampleA, eventName);
  });

  it('0111.2 the interaction is saved as valid', async () => {
    const spies = spyOnNewRelic();

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      pluginData: { [NEW_RELIC_PLUGIN_NAME]: { isValid: true } }
    });

    expect(result).toBe(true);
    expect(newRelicAttributes(spies).isValid).toBe(true);
  });

  it("0111.3 the interaction carries that plugin's prefixed context", async () => {
    stratum = createService({ plugins: [pluginA] });
    stratum.addPlugin(NewRelicPlusPluginFactory());
    const spies = spyOnNewRelic();
    const id = stratum.addCatalog({ items: NR_CATALOG, ...CATALOG_METADATA }).id;

    expect(await stratum.publishFromCatalog(id, NR_API_KEY)).toBe(true);
    for (const [key, value] of Object.entries(PLUGIN_A_CONTEXT)) {
      expect.soft(spies.setAttribute).toHaveBeenCalledWith(`${PLUGIN_A_NAME}_${key}`, value);
    }
  });

  it('0111.4 Stratum reports the New Relic destination unavailable', async () => {
    vi.stubGlobal('window', undefined);
    expect(await new NewRelicPublisher().isAvailable()).toBe(false);
  });
});
