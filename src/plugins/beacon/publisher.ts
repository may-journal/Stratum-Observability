import { type BaseEventModel, BasePublisher } from '../../base';
import type { StratumSnapshot } from '../../types';
import { BEACON_CONTENT_TYPE, BEACON_PLUGIN_NAME } from './constants';

/**
 * Whether the runtime can queue a beacon, which the browser still sends after the page closes.
 */
function canQueueBeacon(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';
}

/**
 * BeaconPublisher posts the snapshot of each published event to a collector URL as JSON.
 */
export class BeaconPublisher extends BasePublisher<string> {
  name = BEACON_PLUGIN_NAME;

  constructor(private readonly url: string) {
    super();
  }

  /**
   * Handle all event types generically, even those provided
   * by a separate plugin.
   */
  shouldPublishEvent(): boolean {
    return true;
  }

  /**
   * The collector receives the whole snapshot, the same data every other publisher sees.
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot): string {
    return JSON.stringify(snapshot);
  }

  /**
   * Either way of sending is enough, so the publisher also runs in Node.
   */
  async isAvailable(): Promise<boolean> {
    return canQueueBeacon() || typeof fetch === 'function';
  }

  /**
   * Queues a beacon first and falls back to a keepalive request when the browser refuses it.
   * A failed request rejects, which the service catches and reports as a failed publish.
   */
  async publish(content: string): Promise<void> {
    if (canQueueBeacon() && navigator.sendBeacon(this.url, new Blob([content], { type: BEACON_CONTENT_TYPE }))) {
      return;
    }
    await fetch(this.url, {
      body: content,
      headers: { 'Content-Type': BEACON_CONTENT_TYPE },
      keepalive: true,
      method: 'POST'
    });
  }
}
