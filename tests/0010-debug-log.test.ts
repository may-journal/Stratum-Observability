import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEBUG_LOG_PREFIX, debugModeEnabled, Logger } from '../src';
import { enableDebugMode, resetStratum, spyOnConsoleDebug } from './utils/helpers';

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
    expect(() => debugModeEnabled()).not.toThrow();
    expect(debugModeEnabled()).toEqual(false);
  });
});
