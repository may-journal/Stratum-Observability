import type { StratumSnapshot } from '../types';
import type { Injector } from '../utils/injector';
import type { BaseEventModel } from './model';

/**
 * BasePublisher is the class every publisher should extend to implement its own specific functionality.
 * Its generic type should reference the mapped output of the models `getModelOutput`.
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export abstract class BasePublisher<T = any> {
  /**
   * Human-readable name of the publisher class. Used by debug
   * and error messages.
   */
  abstract name: string;

  /**
   * This value is set by stratum once the publisher
   * is registered (immediately before initialize()).
   */
  pluginName!: string;

  /**
   * Optional accept-list of event model classes this publisher handles, a shortcut to hardcoding event types in each isAvailable check.
   * To accept all event types, do not override this variable on child instances.
   */
  // biome-ignore lint/suspicious/noExplicitAny: legacy support
  acceptedEventModels?: (typeof BaseEventModel<any>)[];

  /**
   * Placeholder hook to perform some actions once the publisher instance is
   * received and registered by a StratumService.
   */
  onInitialize(_injector: Injector) {
    // Do nothing by default
  }

  /**
   * Function that returns whether a given event type should be handled, letting publishers filter event types by contents.
   * When it does not return true, the publisher skips the event model on publish(), and unless overridden it accepts every model in acceptedEventModels.
   */
  shouldPublishEvent(event: BaseEventModel): boolean {
    if (Array.isArray(this.acceptedEventModels)) {
      return this.acceptedEventModels.some((model) => event instanceof model);
    }
    return true;
  }

  /**
   * Checks whether the publisher is available in the current
   * environment.
   *
   * If this function does not return true, the publisher
   * will not attempt to process the event model on publish().
   */
  abstract isAvailable(event: BaseEventModel, snapshot: StratumSnapshot): Promise<boolean>;

  /**
   * Function to map event model and options to the associated publisher
   * output format. All content-related logic should be added
   * as part of the method.
   */
  abstract getEventOutput(event: BaseEventModel, snapshot: StratumSnapshot): T;

  /**
   * Function that executes the publish action given the
   * the publisher-mapped event output.
   */
  abstract publish(content: T, snapshot: StratumSnapshot): Promise<void>;
}
