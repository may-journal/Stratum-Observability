import { type BaseEventModel, BasePublisher } from '../../base';
import type { StratumSnapshot } from '../../types';
import { isDefined } from '../../utils/general';
import { NEW_RELIC_PLUGIN_NAME } from './constants';

// biome-ignore lint/suspicious/noExplicitAny: legacy support
type NrSpaInteraction = any;

/**
 * Publisher model to send published events to the New Relic SDK
 * https://docs.newrelic.com/docs/browser/new-relic-browser/browser-agent-spa-api/actiontext-browser-spa-api/
 *
 * We specifically reference the window object here because the NR SPA agent is intended to
 * run in browser contexts only.
 */
export class NewRelicPublisher extends BasePublisher {
  name = NEW_RELIC_PLUGIN_NAME;

  /**
   * Map of hard-coded key-value pairs to handle differently
   * when encountered on publish.
   *
   * If the value is null, the publisher will skip
   * the associated key.
   */
  protected readonly modelKeyMap = {
    id: null,
    eventType: null,
    description: null
  };

  /**
   * Handle all event types generically, even those provided
   * by a separate plugin.
   */
  shouldPublishEvent(): boolean {
    return true;
  }

  /**
   * Only allow publishing if the NR SPA agent exists on the window.
   */
  async isAvailable(): Promise<boolean> {
    return !!this.publisher;
  }

  /**
   * Helper method to get the NewRelic object from the window, or undefined if the window does not exist.
   * The host application should add this object for consumption by lower-level applications and MFEs.
   */
  protected get publisher() {
    if (typeof window !== 'undefined') {
      // biome-ignore lint/suspicious/noExplicitAny: legacy support
      return (window as any).newrelic;
    }
    return undefined;
  }

  /**
   * Helper method to get the default interaction event from the publisher.
   * This method defines the initial browser interaction and the default attributes for all New Relic events.
   */
  protected getDefaultInteraction(snapshot: StratumSnapshot) {
    /**
     * End the current interaction, if any exists, so we never overwrite one New Relic has not ended automatically.
     * See also: https://forum.newrelic.com/s/hubtopic/aAX8W0000008ZIqWAM/how-do-we-track-start-and-stop-in-browser-spa-interactions
     */
    this.publisher.interaction().end();

    const interaction = this.publisher
      .interaction()
      .setAttribute('componentName', snapshot.catalog.metadata.componentName)
      .setAttribute('componentVersion', snapshot.catalog.metadata.componentVersion)
      .setAttribute('catalogEventType', snapshot.event.eventType)
      .setAttribute('catalogId', snapshot.catalog.id)
      .setAttribute('catalogVersion', snapshot.catalog.metadata.catalogVersion)
      .setAttribute('stratumSessionId', snapshot.stratumSessionId)
      .setAttribute('productName', snapshot.productName)
      .setAttribute('productVersion', snapshot.productVersion)
      .setAttribute('stratumLibraryVersion', snapshot.stratumVersion)
      .setAttribute('stratumEventId', String(snapshot.event.id));

    if (snapshot.abTestSchemas.length) {
      interaction.setAttribute('abTests', snapshot.abTestSchemas);
    }

    this.setPluginContextData(interaction, snapshot);

    return interaction;
  }

  /**
   * Reach into all plugins and set the context data as attributes, regardless of which plugin is being published.
   * Two plugins with identical context keys collide, leaving one ambiguous attribute that most likely depends on registration order.
   */
  protected setPluginContextData(interaction: NrSpaInteraction, snapshot: StratumSnapshot) {
    Object.values(snapshot.globalContext).forEach((context) => {
      (Object.keys(context) as (keyof typeof context)[]).forEach((k) => {
        const value = context[k];
        if (isDefined(value)) {
          interaction.setAttribute(k, context[k]);
        }
      });
    });
  }

  /**
   * Returns data from underlying events to utilize
   * in the publish step.
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot) {
    return snapshot.data;
  }

  /**
   * Given a set of event data, begin the interaction tracking and set related attributes.
   * It saves a BrowserInteraction event to New Relic based off the default New Relic event.
   */
  // biome-ignore lint/suspicious/noExplicitAny: legacy support
  async publish(content: any, snapshot: StratumSnapshot) {
    const interaction = this.getDefaultInteraction(snapshot);
    const isValid = isDefined(snapshot?.eventOptions?.data?.isValid)
      ? !!snapshot?.eventOptions?.data?.isValid
      : undefined;
    interaction.setAttribute('isValid', isValid);

    /**
     * Attach any data that is returned by each event model's
     * getData() function
     */
    Object.keys(content).forEach((key) => {
      if (key in this.modelKeyMap || !isDefined(content[key])) {
        return;
      }
      if (key === 'name') {
        interaction.setName(content[key]);
      } else {
        interaction.setAttribute(key, content[key]);
      }
    });

    /**
     * Mark the interaction to save and manually
     * end it so that the save propagates.
     */
    interaction.save().end();
  }
}
