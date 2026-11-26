import { type BaseEventModel, BasePublisher } from '../../base';
import type { StratumSnapshot } from '../../types';
import { DATA_LAYER_EVENT_NAME, DATA_LAYER_PLUGIN_NAME, DEFAULT_DATA_LAYER_NAME } from './constants';
import type { DataLayerEntry } from './types';

/**
 * DataLayerPublisher pushes one entry per published event onto a named global array.
 */
export class DataLayerPublisher extends BasePublisher<DataLayerEntry> {
  name = DATA_LAYER_PLUGIN_NAME;

  constructor(private readonly layerName: string = DEFAULT_DATA_LAYER_NAME) {
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
   * Maps the snapshot to the entry a tag manager reads.
   * The entry holds a fixed event name, the event data and the product it came from.
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot): DataLayerEntry {
    return {
      event: DATA_LAYER_EVENT_NAME,
      stratum: { ...snapshot.event, productName: snapshot.productName, productVersion: snapshot.productVersion }
    };
  }

  /**
   * The data layer lives on the page, so the publisher only runs in a browser.
   */
  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined';
  }

  /**
   * Pushes the entry, creating the array first when the page has none,
   * since tag managers read whatever the array holds when they load.
   */
  async publish(content: DataLayerEntry): Promise<void> {
    const host = window as unknown as Record<string, unknown[] | undefined>;
    host[this.layerName] ??= [];
    host[this.layerName]?.push(content);
  }
}
