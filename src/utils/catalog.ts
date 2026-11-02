import type { BaseEventModel } from '../base';
import type {
  CatalogErrors,
  CatalogEvent,
  CatalogKey,
  CatalogMetadata,
  CatalogPublishFn,
  StratumCatalog,
  UserDefinedCatalogOptions,
  UserDefinedEventOptions
} from '../types';
import type { Injector } from './injector';

/**
 * Instance of a registered stratum catalog. Takes in user-defined
 * catalog items and metadata and performs validation to transform
 * catalog items into event models.
 */
export class RegisteredStratumCatalog<T extends CatalogEvent = CatalogEvent, K extends CatalogKey = CatalogKey> {
  /**
   * Internal catalog id, expected to be generated from
   * the catalog's metadata.
   */
  readonly id: string;

  /**
   * The (derived) catalog metadata provided by the service. The
   * metadata stored in this property has default values populated
   * if not provided by the user.
   */
  readonly metadata: CatalogMetadata;

  /**
   * A reference to the parent stratum service's injector. This is used to
   * globally register tag ids and event models for global use.
   */
  private readonly injector: Injector;

  /**
   * Internal reference to the publish callback function
   * for the service that the catalog is registered to.
   */
  private readonly publishFn: CatalogPublishFn;

  /**
   * Flag that indicates whether or not the catalog passed
   * validation. Value is false if any errors are found, regardless
   * of valid models exist.
   */
  isValid = true;

  /**
   * List of catalog item validation errors encountered in the
   * associated event model. List is keyed by the
   * the object's catalog key.
   */
  readonly errors: CatalogErrors = {};

  /**
   * Map of catalog keys loaded by the service to the corresponding BaseEventModel instance, holding only models that passed validation.
   * The publishFromCatalog function references it when determining whether a catalog item can be published.
   */
  readonly validModels: { [key in string]: BaseEventModel<T> } = {};

  /**
   * Initializes the RegisteredStratumCatalog class with the stratum-generated catalog id.
   * @param {string} id Catalog id
   * @param {UserDefinedCatalogOptions<T, K>} options Catalog items and metadata
   * @param {Injector} injector Parent injector
   * @param {CatalogPublishFn} publishFn Publish callback
   */
  constructor(id: string, options: UserDefinedCatalogOptions<T, K>, injector: Injector, publishFn: CatalogPublishFn) {
    this.id = id;
    this.injector = injector;
    this.publishFn = publishFn;
    // Missing catalog metadata falls back to default values.
    this.metadata = {
      catalogVersion: options.catalogVersion ?? '',
      componentName: options.componentName ?? injector.productName,
      componentVersion: options.componentVersion ?? injector.productVersion
    };

    // Validation runs on the provided catalog items.
    this.addItems(options.items);

    if (!this.isValid) {
      const keys = Object.keys(this.errors);
      const ct = keys.length;
      injector.logger.debug(
        `${ct} invalid items were removed when registering catalog "${this.id}": ${keys.join(', ')}`
      );
    }
  }

  /**
   * Validates and registers incoming items as models in place, discarding invalid items but keeping their keys for reporting.
   * @param {StratumCatalog<T, Y>} items Incoming catalog items
   * @return {RegisteredStratumCatalog<T, K | Y>} Same catalog with a widened keyset
   */
  addItems<Y extends CatalogKey>(items: StratumCatalog<T, Y>): RegisteredStratumCatalog<T, K | Y> {
    // A key can sit in both errors and validModels when an item failed first and another item with that key was added later.
    for (const [key, item] of Object.entries(items)) {
      const result = this.validateItem(key, item as T);
      if ('model' in result) {
        this.validModels[key] = result.model;
        this.injector.registerEventId(this.id, result.model.id);
        delete this.errors[key];
      } else {
        this.recordErrors(key, result.errors);
      }
    }

    this.isValid = Object.keys(this.errors).length === 0;
    return this;
  }

  /**
   * Private utility that loads the event model for a catalog item, returning the model or its validation error messages.
   * @param {string} key Catalog item key
   * @param {T} key Catalog item
   * @return Object with a model reference or an array of error strings
   */
  private validateItem(key: string, item: T): { model: BaseEventModel<T> } | { errors: string[] } {
    if (key in this.validModels) {
      return { errors: ['Duplicate key'] };
    }
    const result = this.getEventModel(key, item);
    if (typeof result === 'string') {
      return { errors: [result] };
    }
    if (!result.isValid) {
      return { errors: result.validationErrors };
    }
    return { model: result };
  }

  /**
   * Private utility to create or append error messages by catalog
   * item key.
   *
   * @param {string} key - Catalog item key
   * @param {string[]} errors - Error messages
   */
  private recordErrors(key: string, errors: string[]) {
    if (key in this.errors) {
      this.errors[key].errors.push(...errors);
    } else {
      this.errors[key] = { errors };
    }
  }

  /**
   * Publish a catalog item from this catalog instance with only its key, hinting valid catalog keys unlike StratumService.
   * @param {K} key Catalog item key
   * @param {Partial<UserDefinedEventOptions>} options Extra publish options
   * @return {Promise<boolean>} Always resolves with publisher success
   */
  publish(key: K, options?: Partial<UserDefinedEventOptions>): Promise<boolean> {
    return this.publishFn(this.id, key, options);
  }

  /**
   * Helper function to initialize an event model from a catalog item of unknown type and validity.
   * @param {string} key Key
   * @param {T} item Catalog item of unknown event type
   * @return {BaseEventModel<T> | string} Event model instance or error message
   */
  private getEventModel(key: string, item: T): BaseEventModel<T> | string {
    // The item's eventType property selects the model type to initialize.
    const eventType = item?.eventType;
    // An unresolved eventType or unknown mapping returns a string error message.
    if (!eventType || !(eventType in this.injector.eventTypeModelMap)) {
      return `Event type "${eventType}" not found.`;
    }
    // The model validity is known through model.isValid.
    return new this.injector.eventTypeModelMap[eventType].model(key, item, this.id, this.injector);
  }
}

/**
 * Generate a composite catalog id from the catalog name and version, each falling back through the metadata.
 * @param {UserDefinedCatalogOptions} options User-defined catalog metadata
 * @param {string} productName Product name
 * @param {string} productVersion Product version
 * @return {string} Generated catalog id
 */
export function generateCatalogId(
  // biome-ignore lint/suspicious/noExplicitAny: legacy support
  options: UserDefinedCatalogOptions<any>,
  productName: string,
  productVersion: string
): string {
  // The name uses the component name, else the product name.
  const name = options.componentName || productName;
  // The version uses the catalog version, else the component version, else the product version.
  const version = options.catalogVersion || options.componentVersion || productVersion;
  return `${name}:${version}`;
}
