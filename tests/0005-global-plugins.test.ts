import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addGlobalPlugin, GLOBAL_LISTENER_KEY, removeGlobalPlugin } from '../src';
import { BrowserConsolePlugin, BrowserConsolePublisher } from '../src/plugins/browser-console';
import { globalWindow } from './utils/constants';
import { createSamplePlugins, createSampleService, mockCrypto, resetStratum, setGlobalPlugins } from './utils/helpers';
import { PLUGIN_A_NAME, PluginA, SamplePublisher } from './utils/sample-plugin';

describe('0005 Global Plugins', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it("0005.1 the global plugin's publisher is registered after them", () => {
    addGlobalPlugin(new BrowserConsolePlugin());
    const stratum = createSampleService();

    expect(stratum.publishers).toHaveLength(2);
    expect(stratum.publishers[0]).toBeInstanceOf(SamplePublisher);
    expect(stratum.publishers[1]).toBeInstanceOf(BrowserConsolePublisher);
  });

  it('0005.2 the plugin is added to the end of the list', () => {
    const cases = [
      { state: 'no', existing: null },
      { state: 'a namespace with no', existing: undefined },
      { state: 'an empty', existing: [] },
      { state: 'a populated', existing: [new PluginA()] }
    ];

    for (const { state, existing } of cases) {
      resetStratum();
      if (existing !== null) {
        setGlobalPlugins(existing && [...existing]);
      }
      const plugin = new PluginA();
      const expected = [...(existing ?? []), plugin];

      expect.soft(addGlobalPlugin(plugin), state).toEqual(expected);
      expect.soft(globalWindow[GLOBAL_LISTENER_KEY].globalPlugins, state).toEqual(expected);
    }
  });

  it('0005.3 only a plugin with that name leaves the list', () => {
    const cases = [
      { name: PLUGIN_A_NAME, remaining: (plugins: unknown[]) => plugins.slice(1) },
      { name: 'pluginC', remaining: (plugins: unknown[]) => plugins }
    ];

    for (const { name, remaining } of cases) {
      resetStratum();
      const plugins = createSamplePlugins();
      setGlobalPlugins([...plugins]);
      expect.soft(removeGlobalPlugin(name), name).toEqual(remaining(plugins));
    }
  });

  it('0005.4 the call returns an empty list', () => {
    expect(removeGlobalPlugin(PLUGIN_A_NAME)).toEqual([]);
  });
});
