import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StratumService } from '../src';
import type { AbTest, StratumSnapshot } from '../src/types';
import { SAMPLE_A_CATALOG } from './utils/catalog';
import { AB_TEST_SCHEMA, UPDATED_CONTEXT_VALUE } from './utils/constants';
import { captureSnapshot, createService, enableDebugMode, restoreStratumMocks } from './utils/helpers';
import { DEFAULT_VAR1, PLUGIN_A_NAME, type PluginA, PluginAFactory, VAR1 } from './utils/sample-plugin';

interface PublishState {
  stratum: StratumService;
  pluginA: PluginA;
  abTest: AbTest;
}

describe('event publishing', () => {
  let state: PublishState;

  beforeEach(() => {
    enableDebugMode(true);
    const pluginA = PluginAFactory();
    const stratum = createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: pluginA });
    state = { stratum, pluginA, abTest: stratum.startAbTest(AB_TEST_SCHEMA) };
  });

  afterEach(() => {
    restoreStratumMocks();
    vi.restoreAllMocks();
  });

  it.each([
    {
      change: 'plugin context',
      act: ({ pluginA }: PublishState) => pluginA.setContext(VAR1, UPDATED_CONTEXT_VALUE),
      read: (snapshot: StratumSnapshot) => [
        snapshot.plugins[PLUGIN_A_NAME].context[VAR1],
        snapshot.globalContext[PLUGIN_A_NAME][`${PLUGIN_A_NAME}_${VAR1}`]
      ],
      atPublish: [DEFAULT_VAR1, DEFAULT_VAR1],
      afterChange: [UPDATED_CONTEXT_VALUE, UPDATED_CONTEXT_VALUE]
    },
    {
      change: 'A/B tests',
      act: ({ stratum, abTest }: PublishState) => stratum.endAbTest(abTest),
      read: (snapshot: StratumSnapshot) => snapshot.abTestSchemas,
      atPublish: [AB_TEST_SCHEMA],
      afterChange: []
    }
  ])('0007.6 keeps the $change from the moment of publishing', async ({ act, read, atPublish, afterChange }) => {
    const { stratum } = state;
    const first = await captureSnapshot(stratum, () => {
      stratum.publish(1);
      act(state);
    });
    expect(first.listener).toHaveBeenCalledTimes(1);
    expect(read(first.snapshot)).toStrictEqual(atPublish);

    const second = await captureSnapshot(stratum, () => stratum.publish(1));
    expect(read(second.snapshot)).toStrictEqual(afterChange);
  });
});
