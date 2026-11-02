import type { BasePlugin } from '../base';

/**
 * Helper type to specify a base plugin of any type
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export type GenericPlugin = BasePlugin<any, any>;

/**
 * Format of general options object. Individual plugins
 * can provide child definitions of this type to
 * define specific option keys.
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export type PluginOptions = Record<string, any>;

/**
 * Format of a general plugin context object, defining all keys that `setContext` can set for a plugin instance.
 * Define it within a `BasePlugin`, where keys not initially provided fail validation by default.
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export type PluginContext = Record<string, any>;

/**
 * List of registered plugins within the StratumService instance
 * and data/state associated with each plugin. Plugin data is
 * keyed by the plugin name which required to be unique for
 * a single service instance.
 */
export type RegisteredPlugins = {
  [key: string]: GenericPlugin;
};

/**
 * PluginFactory returns an instantiated Plugin, where T is your plugin class and U the factory options, `never` without plugin options.
 * It suits plugins without required options, otherwise use `PluginFactoryWithRequiredOptions`.
 */
export type PluginFactory<T extends GenericPlugin, U extends PluginOptions = T['options']> = [U] extends [never]
  ? () => T
  : (options?: U) => T;

/**
 * PluginFactoryWithRequiredOptions returns an instantiated Plugin, where T is your plugin class and U the factory options.
 * It suits plugins with at least one required option, otherwise use `PluginFactory`.
 */
export type PluginFactoryWithRequiredOptions<T extends GenericPlugin, U extends PluginOptions = T['options']> = (
  options: U
) => T;
