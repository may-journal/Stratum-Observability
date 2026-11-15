import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StratumService } from '../src';
import { AB_TEST_SCHEMA } from './utils/constants';
import { captureSnapshot, createSampleService, mockCrypto, resetStratum } from './utils/helpers';

describe('0009 A/B Tests', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    resetStratum();
  });

  it('0009.1 the service lists the started test', () => {
    const stratum = createSampleService();
    expect(stratum.abTests).toEqual([]);
    stratum.startAbTest(AB_TEST_SCHEMA);
    expect(stratum.abTests.map((test) => test.data)).toEqual([AB_TEST_SCHEMA]);
  });

  it('0009.2 the service no longer lists the ended tests', () => {
    const actions = [
      { action: 'ending one test', end: (s: StratumService) => s.endAbTest(s.abTests[0].id) },
      {
        action: 'ending all tests',
        end: (s: StratumService) => {
          s.startAbTest(AB_TEST_SCHEMA);
          s.endAllAbTests();
        }
      }
    ];

    for (const { action, end } of actions) {
      resetStratum();
      const stratum = createSampleService();
      stratum.startAbTest(AB_TEST_SCHEMA);
      end(stratum);
      expect.soft(stratum.abTests, action).toEqual([]);
    }
  });

  it('0009.3 that event carries them and the service does not keep them', async () => {
    const shapes = [
      { shape: 'a single schema', abTestSchemas: () => AB_TEST_SCHEMA },
      {
        shape: 'a list of tests and schemas',
        abTestSchemas: () => [{ id: 'started', data: AB_TEST_SCHEMA }, AB_TEST_SCHEMA]
      }
    ];

    for (const { shape, abTestSchemas } of shapes) {
      resetStratum();
      const stratum = createSampleService();
      const transient = abTestSchemas();
      const { snapshot } = await captureSnapshot(stratum, () => stratum.publish(1, { abTestSchemas: transient }));

      expect.soft(snapshot.abTestSchemas, shape).toHaveLength([transient].flat().length);
      expect.soft(stratum.abTests, shape).toEqual([]);
    }
  });
});
