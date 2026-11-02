import { BasePlugin } from '../../base';
import type { PluginFactory } from '../../types';
import { BrowserConsolePublisher } from './publisher';

/**
 * BrowserConsolePlugin logs stringified catalog event data to the browser console.
 */
export class BrowserConsolePlugin extends BasePlugin<never, never> {
  name = 'browserConsole';
  publishers = [new BrowserConsolePublisher()];
}

/**
 * Browser Console plugin factory function
 *
 * Use this function to instantiate the BrowserConsolePlugin when registering
 * this plugin within Stratum.
 */
export const BrowserConsolePluginFactory: PluginFactory<BrowserConsolePlugin> = () => new BrowserConsolePlugin();

export * from './publisher';
