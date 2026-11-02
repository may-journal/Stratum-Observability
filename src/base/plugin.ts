import type { PluginContext, PluginHooks, PluginOptions } from '../types';
import type { Injector } from '../utils';
import type { BaseEventModel } from './model';
import type { BasePublisher } from './publisher';

/**
 * A plugin is composed of one or more custom event models and
 * publisher models.
 *
 * Plugins can be used to define new and custom catalogs behaviors
 * and integrations.
 */
export abstract class BasePlugin<T extends PluginContext, U extends PluginOptions> {
  /**
   * Short name of the plugin, unique among all plugins passed into the service instance.
   * It also specifies custom dynamic data to pass to plugin publishers via EventOptions.pluginData.
   */
  abstract name: string;

  /**
   * One or more publishers to register within the
   * service. The publishers will only accept catalog items from
   * the defined eventTypes.
   */
  publishers?: BasePublisher[];

  /**
   * Mapping of eventTypes strings in catalog items to a respective event model.
   * Defined as the example below, any catalog item with `eventType: 'simple'` is registered in Stratum as a SimpleEventModel instance.
   * ```
   * {
   *   simple: SimpleEventModel
   * }
   * ```
   */
  // biome-ignore lint/suspicious/noExplicitAny: legacy support
  eventTypes?: { [key: string]: typeof BaseEventModel<any> };

  /**
   * Additional options to pass into the plugin on
   * initialization, if any.
   * Supported values are dependent on the individual plugin.
   */
  options!: U;

  /**
   * Additional context vars that can be set at runtime
   * to collect context-specific metadata via
   * `setContext`
   *
   * Only keys defined within this object are allowed
   * to be passed into `setContext`
   */
  context!: T;

  /**
   * Flag to indicate whether the plugin should apply a prefix to all context keys loaded into the global context at publish.
   * The global context collects all plugin context vars active on the stratum service instance, so plugins stay context-aware.
   */
  useGlobalContextPrefix = true;

  /**
   * If useGlobalContextPrefix is true, this value defines the prefix to apply to all context keys.
   * When undefined, the plugin's name is the prefix, delimited from the key by an underscore.
   */
  globalContextPrefix: string | undefined;

  /**
   * Helper method to set particular context var value stored by the plugin.
   * @param {K} key - Key of variable name
   * @param {T[K]} value - Value to apply to variable
   * @return {boolean} Whether the variable was set successfully
   */
  setContext<K extends keyof T>(key: K, value: T[K]): boolean {
    if (!this.context || !(key in this.context)) {
      return false;
    }
    this.context[key] = value;
    return true;
  }

  /**
   * Helper method to get a particular context var stored by
   * the plugin.
   *
   * @property {K} key - Key of variable name
   * @return {T[K]} the value of the variable
   */
  getContext<K extends keyof T>(key: K): T[K] {
    return this.context[key];
  }

  /**
   * Hook to execute when the StratumService registers the plugin instance, to provide additional context or setup.
   *
   * @property {Injector} injector - Stratum service injector instance
   * @property {PluginHooks} hooks - Scoped service capabilities
   */
  onRegister(_injector: Injector, _hooks: PluginHooks) {
    // Do nothing by default
  }
}
