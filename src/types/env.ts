import type { AbTestSchema } from './ab-test';
import type { CatalogMetadata, EventId, EventOptions } from './catalog';
import type { PluginContext, PluginOptions } from './plugin';

/**
 * Snapshot view of all Stratum properties associated with an event on publish.
 * It goes to registered dynamic event listeners and publisher hooks at the initial publish call, and to dev tooling for debugging.
 */
export interface StratumSnapshot {
  abTestSchemas: AbTestSchema[];
  catalog: {
    id: string;
    metadata: CatalogMetadata;
  };
  // biome-ignore lint/suspicious/noExplicitAny: legacy support
  data: any;

  /**
   * Snapshot of context data across all plugins, used by plugins that add global observability at a point in time.
   * Most code should rely on the data of the associated plugin instead.
   */
  globalContext: {
    [pluginName: string]: {
      // biome-ignore lint/suspicious/noExplicitAny: legacy support
      [key: string]: any;
    };
  };

  productName: string;
  productVersion: string;

  /**
   * Plugin data for ONLY plugins associated with the
   * event (aka at least one publisher in the plugin passes
   * the `shouldPublishEvent` hook.)
   */
  plugins: {
    [pluginName: string]: StratumSnapshotPluginData;
  };

  stratumSessionId: string;
  stratumVersion: string;
  event: {
    eventType: string;
    id: EventId;
    key: string;
  };
  eventOptions?: Partial<EventOptions>;
}

/**
 * Plugin data saved and cloned within published StratumSnapshots
 */
export interface StratumSnapshotPluginData {
  context: PluginContext;
  options: PluginOptions;
}

/**
 * Callback functions that can be added as one-off event
 * listeners to Stratum for debugging purposes.
 *
 * Once registered within Stratum, these functions are executed
 * every time publish() is called on the service, passing along the
 * underlying Stratum snapshot data.
 */
export type StratumSnapshotListenerFn = (event: StratumSnapshot) => void;
