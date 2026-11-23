import { BasePlugin } from '../../base';
import type { PluginFactoryWithRequiredOptions } from '../../types';
import { BEACON_PLUGIN_NAME } from './constants';
import { BeaconPublisher } from './publisher';
import type { BeaconOptions } from './types';

/**
 * BeaconPlugin posts each published event to a collector URL,
 * so a team with its own collector needs no publisher of its own.
 */
export class BeaconPlugin extends BasePlugin<never, BeaconOptions> {
  name = BEACON_PLUGIN_NAME;
  publishers: [BeaconPublisher];

  constructor(options: BeaconOptions) {
    super();
    this.options = options;
    this.publishers = [new BeaconPublisher(options.url)];
  }
}

/**
 * Beacon plugin factory function
 *
 * Use this function to instantiate the BeaconPlugin when registering
 * this plugin within Stratum.
 */
export const BeaconPluginFactory: PluginFactoryWithRequiredOptions<BeaconPlugin> = (options) =>
  new BeaconPlugin(options);

export * from './constants';
export * from './publisher';
export type * from './types';
