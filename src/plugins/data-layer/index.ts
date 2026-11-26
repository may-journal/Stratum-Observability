import { BasePlugin } from '../../base';
import type { PluginFactory } from '../../types';
import { DATA_LAYER_PLUGIN_NAME } from './constants';
import { DataLayerPublisher } from './publisher';
import type { DataLayerOptions } from './types';

/**
 * DataLayerPlugin pushes each published event onto the page's data layer array,
 * where a tag manager picks it up.
 */
export class DataLayerPlugin extends BasePlugin<never, DataLayerOptions> {
  name = DATA_LAYER_PLUGIN_NAME;
  publishers: [DataLayerPublisher];

  constructor(options?: DataLayerOptions) {
    super();
    this.options = options ?? {};
    this.publishers = [new DataLayerPublisher(this.options.name)];
  }
}

/**
 * Data layer plugin factory function
 *
 * Use this function to instantiate the DataLayerPlugin when registering
 * this plugin within Stratum.
 */
export const DataLayerPluginFactory: PluginFactory<DataLayerPlugin> = (options) => new DataLayerPlugin(options);

export * from './constants';
export * from './publisher';
export type * from './types';
