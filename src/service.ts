import type { BasePublisher } from './base';
import type {
  AbTest,
  AbTestSchema,
  CatalogEvent,
  CatalogKey,
  GenericPlugin,
  StratumServiceOptions,
  StratumSnapshotListenerFn,
  UserDefinedCatalogOptions,
  UserDefinedEventOptions
} from './types';
import { cloneStratumSnapshot, generateStratumSnapshot, getGlobalPlugins, populateDynamicEventOptions } from './utils';
import { generateCatalogId, RegisteredStratumCatalog } from './utils/catalog';
import { addStratumSnapshotListener } from './utils/env';
import { normalizeToArray } from './utils/general';
import { Injector } from './utils/injector';

/**
 * StratumService is the main entry point for the functionality within this package.
 * It is designed for singleton scope, so applications should share one instance across their codebase, while separate instances stay independent for testing.
 */
export class StratumService {
  /**
   * Collection of catalogs registered by the StratumService
   * instance.
   */
  readonly catalogs: { [key: string]: RegisteredStratumCatalog } = {};

  /**
   * Reference to a registered catalog within the main `catalogs`
   * object. The default catalog is a syntactic sugar to easily
   * reference the catalog registered on service instantiation.
   */
  defaultCatalog?: RegisteredStratumCatalog;

  /**
   * The list of publishers that are active for the specific
   * StratumService instance via plugin registration.
   */
  readonly publishers: BasePublisher[] = [];

  /**
   * Utility class that stores data that is intended to be shared between
   * the StratumService instance and underlying models and plugins.
   */
  readonly injector: Injector;

  /**
   * Initializes the StratumService class, ideally as a single instance per application.
   * @param {StratumServiceOptions} options - Incoming options used to initialize StratumService
   */
  constructor(options: StratumServiceOptions) {
    // Set up default state for the service, including global context data.
    this.injector = new Injector(options.productName, options.productVersion);

    // Register the plugins passed in the options, if any.
    if (options.plugins) {
      this.addPlugin(options.plugins);
    }

    // global plugins register after the constructor plugins, if any exist
    const globalPlugins = getGlobalPlugins();
    if (globalPlugins?.length > 0) {
      this.addPlugin(globalPlugins);
    }

    // Register the default catalog
    if (options.catalog) {
      this.defaultCatalog = this.addCatalog(options.catalog);
    }
  }

  /**
   * Register a new catalog within the service, validating and converting its items into models, or return the existing catalog.
   * @param {UserDefinedCatalogOptions<T, K>} options - Catalog items and optional catalog version
   * @return {RegisteredStratumCatalog<T, K>} The registered catalog instance
   */
  addCatalog<T extends CatalogEvent = CatalogEvent, K extends CatalogKey = CatalogKey>(
    options: UserDefinedCatalogOptions<T, K>
  ): RegisteredStratumCatalog<T, K> {
    // The service creates a composite catalog id from the provided metadata, and item ids need not be unique across catalogs.
    const id = generateCatalogId(options, this.injector.productName, this.injector.productVersion);
    // A catalog with the same id gets the provided items through addItems and is returned.
    if (this.catalogs[id]) {
      const existing = this.catalogs[id] as RegisteredStratumCatalog<T, K>;
      existing.addItems(options.items);
      return existing;
    }

    // The returned catalog instance supports direct publishing through `catalog.publish(key)`.
    const catalog = new RegisteredStratumCatalog(id, options, this.injector, this.publishFromCatalog.bind(this));
    this.catalogs[id] = catalog;
    return catalog;
  }

  /**
   * Remove a registered catalog given a catalog id
   *
   * @property {string} id - Catalog id to remove
   */
  removeCatalog(id: string) {
    if (id in this.catalogs) {
      delete this.catalogs[id];
      delete this.injector.registeredEventIds[id];
    }
    if (this.defaultCatalog && this.defaultCatalog.id === id) {
      delete this.defaultCatalog;
    }
  }

  /**
   * Register a plugin within stratum, including the plugin's publishers and event types.
   * @param {GenericPlugin | GenericPlugin[]} plugins - Incoming plugins to register in the service
   */
  addPlugin(plugins: GenericPlugin | GenericPlugin[]) {
    normalizeToArray(plugins).forEach((plugin) => {
      const { publishers } = this.injector.registerPlugin(plugin);
      publishers.forEach((publisher) => {
        publisher.onInitialize(this.injector);
        this.publishers.push(publisher);
      });
      // Execute plugin onRegister hook after we're done registering models and publishers
      plugin.onRegister(this.injector, { addCatalog: this.addCatalog.bind(this) });
    });
  }

  /**
   * Publishes from the default catalog as sugar for `publishFromCatalog`, and fails when no default catalog exists.
   * @param {CatalogKey} key - Key within the default catalog
   * @param {Partial<UserDefinedEventOptions>} options - Extra publish options
   * @return {Promise<boolean>} - Always resolves with publisher success
   */
  async publish(key: CatalogKey, options?: Partial<UserDefinedEventOptions>): Promise<boolean> {
    const catalogId = this.defaultCatalog?.id ?? '';
    return this.publishFromCatalog(catalogId, key, options);
  }

  /**
   * Publishes the valid catalog item for a key to each publisher, queuing a separate microtask per publisher.
   * @param {string} catalogId - Catalog id
   * @param {CatalogKey} key - Item key
   * @param {Partial<UserDefinedEventOptions>} options - Extra options
   * @return {Promise<boolean>} - Always resolves with publisher success
   */
  async publishFromCatalog(
    catalogId: string,
    key: CatalogKey,
    options?: Partial<UserDefinedEventOptions>
  ): Promise<boolean> {
    const catalog = this.catalogs[catalogId];
    if (!catalog?.validModels[key]) {
      this.injector.logger.debug(`Unable to publish "${key}": key not found or invalid`);
      return Promise.resolve(false);
    }

    const model = catalog.validModels[key];

    // Publishers filter event models with `shouldPublishEvent`, and no microtask is queued when the check fails.
    const publishers = this.publishers.filter((publisher) => publisher.shouldPublishEvent(model));

    // Generate an atomic Stratum snapshot
    const snapshot = generateStratumSnapshot(this.injector, model, catalog, publishers, options);

    /**
     * Pass the snapshot it to any global snapshot listeners
     */
    const fns = this.injector.getExternalSnapshotListeners();
    if (fns.length) {
      queueMicrotask(() => {
        fns.forEach((fn) => {
          fn(snapshot);
        });
      });
    }

    /**
     * No publishers = nothing to do
     */
    if (!publishers.length) {
      return Promise.resolve(true);
    }

    /**
     * Wait for all promises to settle after queuing a task for each registered publisher.
     * The result resolves with `true` given a success or `false` given a failure.
     */
    return Promise.all(
      publishers.map(
        (publisher) =>
          new Promise<void>((resolve, reject) => {
            queueMicrotask(async () => {
              const internalSnapshot = cloneStratumSnapshot(snapshot);
              try {
                internalSnapshot.eventOptions = populateDynamicEventOptions(publisher, options);
                // An unavailable publisher is skipped, otherwise the mapped model content goes to its `publish` method.
                const isAvailable = await publisher.isAvailable(model, internalSnapshot);
                if (isAvailable) {
                  const content = publisher.getEventOutput(model, internalSnapshot);
                  await publisher.publish(content, internalSnapshot);
                  resolve();
                } else {
                  this.injector.logger.debug(
                    `Unable to publish "${key}": Publisher "${publisher.name}" is not available`
                  );
                  reject();
                }
              } catch (error) {
                this.injector.logger.debug(`Unable to publish "${key}": Publisher "${publisher.name}" threw`, error);
                reject(error);
              }
            });
          })
      )
    )
      .then(() => true) // Explicitly resolve return true given all were successful
      .catch(() => false); // Explicitly resolve return false if any were rejected
  }

  /**
   * Helper function to add a Stratum snapshot listener callback to the globalThis object, if available.
   * The provided function runs each time the StratumService instance publishes an event.
   */
  addSnapshotListener(fn: StratumSnapshotListenerFn): boolean {
    return addStratumSnapshotListener(this.id, fn);
  }

  /**
   * Helper method to return the Stratum instance id set by the service
   * on initialization.
   */
  get id(): string {
    return this.injector.productName;
  }

  /**
   * Returns a list of all AbTests registered in Stratum
   */
  get abTests(): AbTest[] {
    return this.injector.abTestManager.tests;
  }

  /**
   * Register a new AbTest within Stratum.
   *
   * @param {AbTestSchema} obj - Data of AB test to register
   * @return Registered AbTest object within Stratum
   */
  startAbTest(obj: AbTestSchema): AbTest {
    return this.injector.abTestManager.startAbTest(obj);
  }

  /**
   * End an ongoing AbTest within Stratum
   *
   * @param {string | AbTest} key - The auto-generated AbTest id or AbTest object
   */
  endAbTest(key: string | AbTest) {
    this.injector.abTestManager.endAbTest(key);
  }

  /**
   * End all ongoing AbTests within Stratum
   */
  endAllAbTests() {
    this.injector.abTestManager.endAllAbTests();
  }

  /**
   * Returns the stratum session id currently stored by
   * Stratum
   */
  get stratumSessionId(): string {
    return this.injector.stratumSessionId;
  }

  /**
   * Returns the Stratum library version
   */
  get version(): string {
    return this.injector.version;
  }
}
