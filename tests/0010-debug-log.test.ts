import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEBUG_LOG_PREFIX, debugModeEnabled, Logger } from '../src';
import { createService, enableDebugMode, resetStratum, spyOnConsoleDebug } from './utils/helpers';

const UNKNOWN_KEY = 'missing-key';

describe('0010 Debug Log', () => {
  afterEach(() => {
    resetStratum();
  });

  it('0010.1 the console shows the line, marked as Stratum, only while the flag is on', () => {
    const logger = new Logger();
    const consoleSpy = spyOnConsoleDebug();
    const message = 'test-string';

    logger.debug(message);
    expect(consoleSpy).toHaveBeenCalledTimes(0);

    enableDebugMode(true);
    logger.debug(message);
    expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(DEBUG_LOG_PREFIX, message);
  });

  it('0010.2 debug mode is off and nothing fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error();
    });
    expect(debugModeEnabled()).toEqual(false);
  });

  it('0010.3 my logger receives the line', async () => {
    const logger = { debug: vi.fn() };
    const consoleSpy = spyOnConsoleDebug();

    expect(await createService({ logger }).publish(UNKNOWN_KEY)).toBe(false);
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(UNKNOWN_KEY));
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('0010.4 publishing carries on and nothing is thrown into my app', async () => {
    const debug = vi.fn(() => {
      throw new Error('logger failed');
    });

    expect(await createService({ logger: { debug } }).publish(UNKNOWN_KEY)).toBe(false);
    expect(debug).toHaveBeenCalledOnce();
  });
});
