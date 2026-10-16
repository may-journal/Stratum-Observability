import { BasePlugin } from '../../base';
import type { PluginFactory } from '../../types';
import { NEW_RELIC_PLUGIN_NAME } from './constants';
import { NewRelicPublisher } from './publisher';

/**
 * New Relic plugin
 *
 * Use this plugin to send existing Stratum Catalog events to New Relic.
 * This enables near real-time dashboards and alerting.
 */
export class NewRelicPlugin extends BasePlugin<never, never> {
  name = NEW_RELIC_PLUGIN_NAME;
  publishers = [new NewRelicPublisher()];
}

/**
 * New Relic plugin factory function
 *
 * Use this function to instantiate the NewRelicPlugin when registering
 * this plugin within Stratum.
 */
export const NewRelicPluginFactory: PluginFactory<NewRelicPlugin> = () => new NewRelicPlugin();

export * from './constants';
export * from './publisher';
