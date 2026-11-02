import { BasePlugin } from '../../base';
import type { PluginContext, PluginFactory } from '../../types';
import { NEW_RELIC_PLUGIN_NAME } from '../new-relic/constants';
import { NewRelicPublisher } from '../new-relic/publisher';
import { NewRelicEventType } from './constants';
import { NewRelicApiResponseEventModel, NewRelicErrorEventModel, NewRelicEventModel } from './model';
import type { NewRelicPluginOptions } from './types';

/**
 * NewRelicPlusPlugin extends the base New Relic plugin with custom NR-only event types in your Stratum catalog.
 * It adds general NR, API response and error event types for application-specific events, which the base plugin does not publish.
 */
export class NewRelicPlusPlugin extends BasePlugin<PluginContext, NewRelicPluginOptions> {
  name = NEW_RELIC_PLUGIN_NAME;
  eventTypes = {
    [NewRelicEventType.API_RESPONSE]: NewRelicApiResponseEventModel,
    [NewRelicEventType.ERROR]: NewRelicErrorEventModel,
    [NewRelicEventType.EVENT]: NewRelicEventModel
  };
  publishers = [new NewRelicPublisher()];
  context: PluginContext = {};
  options: NewRelicPluginOptions;
  globalContextPrefix = 'stratum';

  constructor(options?: NewRelicPluginOptions) {
    super();
    this.options = options ?? {};
    this.context = Object.assign({}, this.options.defaultContext ?? {});
  }
}

/**
 * New Relic+ plugin factory function
 *
 * Use this function to instantiate the NewRelicPlusPlugin when registering
 * this plugin within Stratum.
 */
export const NewRelicPlusPluginFactory: PluginFactory<NewRelicPlusPlugin> = (options) =>
  new NewRelicPlusPlugin(options);

export * from './constants';
export * from './model';
export * from './types';
