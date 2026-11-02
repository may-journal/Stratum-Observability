import type { AbTest, AbTestCollection, AbTestSchema } from '../types';
import { isDefined } from './general';

/**
 * Singleton instance used to collect and manage AbTest schemas
 * within the Stratum service. This class should be used directly by
 * the application to populate A/B test data on analytics events.
 */
export class AbTestManager {
  /**
   * Internal counter variable that that increments whenever a new AbTest key is
   * generated.
   */
  private static n = 1;

  /**
   * Helper function to generate a unique key for AbTests instantiated by this class.
   * Called when new instance is created.
   */
  private static _generateUniqueKey() {
    return `t${AbTestManager.n++}`;
  }

  /**
   * Collection of AbTest models keyed by id. This collection
   * can be modified via the startAbTest and endAbTest functions.
   */
  private _tests: AbTestCollection = {};

  /**
   * Helper method to create an AbTest object with a unique
   * id given AbTestSchema data.
   */
  private createTest(data: AbTestSchema): AbTest {
    return { id: AbTestManager._generateUniqueKey(), data };
  }

  /**
   * Register a new AbTest within the AbTestManager, called through `StratumService.startAbTest` instead of directly.
   * @param {AbTestSchema} obj - The AbTestSchema information to convert to AbTest
   * @return {AbTest} Generated AbTest object
   */
  startAbTest(obj: AbTestSchema): AbTest {
    const abTest = this.createTest(obj);
    this._tests[abTest.id] = abTest;
    return abTest;
  }

  /**
   * Removes an AbTest matching the AbTest id, or the id of a passed AbTest object, called through `StratumService.endAbTest`.
   * @param {string | AbTest} key - AbTest id or AbTest object to remove
   */
  endAbTest(key: string | AbTest) {
    if (isAbTest(key)) {
      key = key.id;
    }
    delete this._tests[key];
  }

  /**
   * Removes all AbTests from the AbTestManager.
   *
   * Do not call this function directly, use `StratumService.endAllAbTests`
   * instead.
   */
  endAllAbTests() {
    Object.keys(this._tests).forEach((key) => {
      delete this._tests[key];
    });
  }

  /**
   * Returns an array of all AbTests currently registered
   * within the AbTestManager.
   *
   * Do not call this function directly, use `StratumService.abTests`
   * instead.
   */
  get tests(): AbTest[] {
    return Object.values(this._tests);
  }

  /**
   * Function to generate SchemaObjects for each AbTest instance, plus optional transient one-time AbTests typically from EventOptions on publish.
   * @param {AbTestSchema | AbTest | (AbTestSchema | AbTest)[]} [transient] - One-time AbTest instances or schemas
   */
  generateContexts(transient?: AbTestSchema | AbTest | (AbTestSchema | AbTest)[]): AbTestSchema[] {
    let arr: (AbTest | AbTestSchema)[] = Object.values(this._tests);

    if (isDefined(transient)) {
      if (!Array.isArray(transient)) {
        arr.push(transient);
      } else {
        arr = arr.concat(...transient);
      }
    }

    const schemas: AbTestSchema[] = [];
    arr.forEach((obj) => {
      if (!isAbTest(obj)) {
        obj = this.createTest(obj);
      }
      schemas.push(obj.data);
    });
    return schemas;
  }
}

/**
 * Helper type guard to determine if given variable is
 * an AbTest instance.
 */
export function isAbTest(x: unknown): x is AbTest {
  return isDefined(x) && (x as AbTest).data !== undefined && (x as AbTest).id !== undefined;
}
