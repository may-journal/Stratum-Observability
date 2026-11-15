import { afterEach, describe, expect, it } from 'vitest';
import type { BasePlugin } from '../src';
import { NewRelicPlusPluginFactory } from '../src/plugins/new-relic-plus';
import type { PluginContext } from '../src/types';
import { SAMPLE_A_CATALOG } from './utils/catalog';
import { CUSTOM_VAR, UPDATED_CONTEXT_VALUE } from './utils/constants';
import { captureSnapshot, createService, enableDebugMode, resetStratum } from './utils/helpers';
import { DEFAULT_VAR1, PLUGIN_A_NAME, PluginAFactory, VAR1 } from './utils/sample-plugin';

const UNKNOWN_VAR = 'var3';

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

describe('0006 Plugin Context', () => {
  afterEach(() => {
    resetStratum();
  });

  it('0006.1 the plugin reports the new value', () => {
    for (const { name, create, key } of CONTEXT_PLUGINS) {
      const plugin = create();
      expect.soft(plugin.setContext(key, UPDATED_CONTEXT_VALUE), name).toBe(true);
      expect.soft(plugin.getContext(key), name).toBe(UPDATED_CONTEXT_VALUE);
    }
  });

  it('0006.2 the plugin refuses it and keeps no value', () => {
    for (const { name, create } of CONTEXT_PLUGINS) {
      const plugin = create();
      expect.soft(plugin.setContext(UNKNOWN_VAR, '456'), name).toBe(false);
      expect.soft(plugin.getContext(UNKNOWN_VAR), name).toBeUndefined();
    }
  });

  it("0006.3 the event's context keys carry no plugin name", async () => {
    enableDebugMode(true);
    const pluginA = PluginAFactory();
    const stratum = createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: [pluginA] });
    pluginA.useGlobalContextPrefix = false;

    const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1));
    expect(snapshot.globalContext[PLUGIN_A_NAME]).toStrictEqual({ [VAR1]: DEFAULT_VAR1 });
  });
});
