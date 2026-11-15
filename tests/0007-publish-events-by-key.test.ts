import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type BaseEventModel,
  generateStratumSnapshot,
  performReplacements,
  type RegisteredStratumCatalog,
  type StratumService,
  safeStringify
} from '../src';
import { NewRelicPluginFactory } from '../src/plugins/new-relic';
import type { EventOptions, StratumSnapshot } from '../src/types';
import { BASE_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import {
  AB_TEST_SCHEMA,
  DEFAULT_CATALOG_ID,
  MODEL_KEY,
  UNKNOWN_CATALOG_ID,
  UPDATED_CONTEXT_VALUE
} from './utils/constants';
import { BASE_EVENT_MOCK } from './utils/fixtures';
import {
  captureSnapshot,
  createCatalog,
  createInjector,
  createModel,
  createSampleService,
  createService,
  enableDebugMode,
  mockCrypto,
  mockSessionId,
  resetStratum,
  spyOnDebugLog
} from './utils/helpers';
import { DEFAULT_VAR1, PLUGIN_A_NAME, PluginAFactory, SamplePublisher, VAR1 } from './utils/sample-plugin';

interface ReplacementCase {
  replacement: string;
  item: object;
  replacements: EventOptions['replacements'];
  read: (data: ReturnType<BaseEventModel['getData']>) => unknown;
  expected: string;
}

const LABEL_PLACEHOLDER = '{{LABEL}}';

describe('0007 Publish Events by Key', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it('0007.1 the listener gets one event with the item, product, session, catalog ID and key', async () => {
    const entries = [
      {
        entry: 'stratum.publishFromCatalog',
        publish: (s: StratumService, c: RegisteredStratumCatalog) => s.publishFromCatalog(c.id, 1)
      },
      { entry: 'catalog.publish', publish: (_s: StratumService, c: RegisteredStratumCatalog) => c.publish(1) }
    ];

    for (const { entry, publish } of entries) {
      resetStratum();
      enableDebugMode(true);
      mockSessionId();
      const stratum = createService();
      const catalog = stratum.addCatalog({ items: BASE_CATALOG });
      const { listener, snapshot } = await captureSnapshot(stratum, () => publish(stratum, catalog));

      expect.soft(listener, entry).toHaveBeenCalledTimes(1);
      expect.soft(snapshot, entry).toEqual(BASE_EVENT_MOCK);
    }
  });

  it('0007.3 the call resolves false and logs why in debug mode', async () => {
    const cases = [
      { reason: 'no default catalog exists', act: () => createService().publish(1) },
      { reason: 'the catalog is unknown', act: (s: StratumService) => s.publishFromCatalog(UNKNOWN_CATALOG_ID, 1) },
      { reason: 'the key is unknown', act: (s: StratumService) => s.publishFromCatalog(DEFAULT_CATALOG_ID, 'missing') },
      {
        reason: 'a publisher is unavailable',
        act: (s: StratumService) => {
          s.addPlugin(NewRelicPluginFactory());
          return s.publish(1);
        }
      }
    ];

    for (const { reason, act } of cases) {
      resetStratum();
      const stratum = createSampleService();
      const debugSpy = spyOnDebugLog();

      expect.soft(await act(stratum), reason).toBe(false);
      expect.soft(debugSpy, reason).toHaveBeenCalledTimes(1);
    }
  });

  it('0007.4 the event carries the value, or what the function returns for that event', () => {
    const injector = createInjector();
    const cases: ReplacementCase[] = [
      {
        replacement: 'a value in a nested field',
        item: { details: { label: LABEL_PLACEHOLDER } },
        replacements: { LABEL: 'nested' },
        read: (data: { details: { label: string } }) => data.details.label,
        expected: 'nested'
      },
      {
        replacement: 'a function',
        item: { description: '{{KEY}}' },
        replacements: { KEY: (m: BaseEventModel) => m.key },
        read: (data: { description: string }) => data.description,
        expected: MODEL_KEY
      }
    ];

    for (const { replacement, item, replacements, read, expected } of cases) {
      const data = createModel(injector, { id: 1, ...item }).getData({ replacements });
      expect.soft(read(data), replacement).toBe(expected);
    }
  });

  it('0007.5 the loop is marked as circular and the copy succeeds', () => {
    const node: Record<string, unknown> = {};
    node.self = node;
    expect(safeStringify(node)).toBe('{"self":"[Circular]"}');
  });

  it('0007.6 the event carries the context and A/B tests from the moment of publishing', async () => {
    const changes = [
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
    ];

    for (const { change, act, read, atPublish, afterChange } of changes) {
      resetStratum();
      const state = createPublishState();
      const { stratum } = state;
      const first = await captureSnapshot(stratum, () => {
        stratum.publish(1);
        act(state);
      });
      expect.soft(first.listener, change).toHaveBeenCalledTimes(1);
      expect.soft(read(first.snapshot), change).toStrictEqual(atPublish);

      const second = await captureSnapshot(stratum, () => stratum.publish(1));
      expect.soft(read(second.snapshot), change).toStrictEqual(afterChange);
    }
  });

  it('0007.7 the snapshot holds no plugin data', () => {
    const injector = createInjector();
    const catalog = createCatalog(injector);
    const publishers = [new SamplePublisher('unregistered')];
    const snapshot = generateStratumSnapshot(injector, catalog.validModels[1], catalog, publishers);
    expect(snapshot.plugins).toStrictEqual({});
  });

  it('0007.8 replacement returns and leaves the value unchanged', () => {
    const model = createModel(createInjector(), { id: 1 });
    const cases = [
      { kind: 'a null value', value: () => null, expected: null },
      { kind: 'a list', value: () => [LABEL_PLACEHOLDER], expected: [LABEL_PLACEHOLDER] }
    ];

    for (const { kind, value, expected } of cases) {
      const target = value();
      performReplacements(model, target, { LABEL: 'replaced' });
      expect.soft(target, kind).toStrictEqual(expected);
    }
  });

  it('0007.9 the call resolves false and logs why in debug mode', async () => {
    const stratum = createSampleService();
    const debugSpy = spyOnDebugLog();
    vi.spyOn(stratum.publishers[0], 'publish').mockRejectedValue(new Error('publisher failed'));

    expect(await stratum.publish(1)).toBe(false);
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });
});

interface PublishState {
  stratum: StratumService;
  pluginA: ReturnType<typeof PluginAFactory>;
  abTest: ReturnType<StratumService['startAbTest']>;
}

/**
 * A service in debug mode with the sample plugin, the sample catalog and
 * one running A/B test.
 */
function createPublishState(): PublishState {
  enableDebugMode(true);
  const pluginA = PluginAFactory();
  const stratum = createService({ catalog: { items: SAMPLE_A_CATALOG }, plugins: pluginA });
  return { stratum, pluginA, abTest: stratum.startAbTest(AB_TEST_SCHEMA) };
}
