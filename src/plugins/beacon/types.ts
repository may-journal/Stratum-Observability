/**
 * Options accepted by the BeaconPluginFactory.
 */
export interface BeaconOptions {
  /**
   * Address of the collector that receives one POST per published event.
   */
  url: string;
}
