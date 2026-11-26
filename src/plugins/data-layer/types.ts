import type { StratumSnapshot } from '../../types';

/**
 * Options accepted by the DataLayerPluginFactory.
 */
export interface DataLayerOptions {
  /**
   * Name of the global array to push to, `dataLayer` when omitted.
   */
  name?: string;
}

/**
 * Shape of the entry pushed onto the data layer for each published event.
 */
export interface DataLayerEntry {
  event: string;
  stratum: StratumSnapshot['event'] & Pick<StratumSnapshot, 'productName' | 'productVersion'>;
}
