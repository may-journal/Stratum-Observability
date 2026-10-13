import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratumService } from '../src';
import type { AbTest } from '../src/types';
import { SAMPLE_A_CATALOG } from './utils/catalog';
import { AB_TEST_SCHEMA, UPDATED_CONTEXT_VALUE } from './utils/constants';
import {
  captureSnapshot,
  createService,
  enableDebugMode,
  removeAllPublishers,
  restoreStratumMocks
} from './utils/helpers';
import { PLUGIN_A_NAME, type PluginA, PluginAFactory, VAR2 } from './utils/sample-plugin';

describe('event publishing', () => {
  let stratum: StratumService;
  let activeAbTest: AbTest;
  let pluginA: PluginA;

  beforeEach(() => {
    enableDebugMode(true);
    pluginA = PluginAFactory();
    stratum = createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: pluginA });
    activeAbTest = stratum.startAbTest(AB_TEST_SCHEMA);
    removeAllPublishers(stratum);
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  it('should preserve global context set at the time publish is called', async () => {
    pluginA.setContext(VAR2, UPDATED_CONTEXT_VALUE);

    const { listener, snapshot } = await captureSnapshot(stratum, () => {
      stratum.publish(1);
      pluginA.setContext(VAR2, 'Next');
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshot.globalContext[PLUGIN_A_NAME][`${PLUGIN_A_NAME}_${VAR2}`]).toBe(UPDATED_CONTEXT_VALUE);
    expect(pluginA.getContext(VAR2)).toBe('Next');
  });

  it('should preserve ab tests at the time publish was called', async () => {
    const { listener, snapshot } = await captureSnapshot(stratum, () => {
      stratum.publish(1);
      stratum.endAbTest(activeAbTest);
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshot.abTestSchemas).toHaveLength(1);
    expect(stratum.abTests).toHaveLength(0);
  });
});
