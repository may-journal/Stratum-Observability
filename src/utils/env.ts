import { DEBUG_KEY, DEBUG_LOG_PREFIX, GLOBAL_LISTENER_KEY, STORED_SESSION_ID_KEY } from '../constants';
import type { StratumSnapshotListenerFn } from '../types';
import { isDefined } from './general';

/**
 * Helper function to append a listener callback to globalThis (or the provided host) under `stratum_config_${STRATUM_ID}` for one application or `stratum_global` for any instance.
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
function _instantiateStratumSnapshotListener(key: string, fn: StratumSnapshotListenerFn, host?: any): boolean {
  try {
    if (!isDefined(host)) {
      host = globalThis;
    }
    if (!isDefined(host[key])) {
      host[key] = {};
    }
    if (!Array.isArray(host[key].listeners)) {
      host[key].listeners = [];
    }
    host[key].listeners.push(fn);
    return true;
  } catch {
    return false;
  }
}

/**
 * Function to add a Stratum snapshot listener callback to a parent, run when a StratumService with a matching id publishes, without overwriting others.
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export function addStratumSnapshotListener(id: string, fn: StratumSnapshotListenerFn, host?: any): boolean {
  return _instantiateStratumSnapshotListener(`stratum_config_${id}`, fn, host);
}

/**
 * Global function to add a Stratum snapshot listener callback to the global parent, run on any published event, without overwriting parallel listeners.
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export function addGlobalStratumSnapshotListener(fn: StratumSnapshotListenerFn, host?: any): boolean {
  return _instantiateStratumSnapshotListener(GLOBAL_LISTENER_KEY, fn, host);
}

/**
 * Function to generate a new id using Stratum's default session id logic, preferring a stored session value.
 * Without one, a random uuid is generated and kept in session storage for future retrievals.
 */
export function generateDefaultSessionId(): string {
  let id = '';
  try {
    const storedId = sessionStorage.getItem(STORED_SESSION_ID_KEY);
    if (isDefined(storedId)) {
      id = storedId;
    } else {
      id = uuid();
      sessionStorage.setItem(STORED_SESSION_ID_KEY, id);
    }
  } catch {
    id = uuid();
  }
  return id;
}

/**
 * Utility class to write to the console.
 *
 * This class serves as a layer so that logs emitted throughout
 * the package are subject to debug mode checks.
 */
export class Logger {
  /**
   * Write warnings to the console only if debug mode is enabled
   */
  debug(...args: unknown[]) {
    if (debugModeEnabled()) {
      console.debug(DEBUG_LOG_PREFIX, ...args);
    }
  }
}

/**
 * Utility function to check if the Stratum debug key is set in session storage, which enables console logging and custom event listeners.
 *
 * @return {boolean} Flag indicating if debug mode is enabled.
 */
export function debugModeEnabled(): boolean {
  try {
    return sessionStorage.getItem(DEBUG_KEY)?.toLowerCase() === 'true';
  } catch {
    return false;
  }
}

/**
 * Utility function to return a random uuid, or a nil uuid if generation fails.
 *
 * @return {string} Random or nil uuid string
 */
export function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return '00000000-0000-0000-0000-000000000000';
  }
}
