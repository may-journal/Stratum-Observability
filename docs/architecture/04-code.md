---
fitnessFunctions: ['architecture-contract', 'architecture-code']
---

# Code

```mermaid
classDiagram
    class StratumService["1 StratumService"] {
        +catalogs
        +defaultCatalog
        +publishers
        +injector
        +addCatalog(UserDefinedCatalogOptions~T, K~) RegisteredStratumCatalog~T, K~
        +addPlugin(GenericPlugin | GenericPlugin[])
        +publish(CatalogKey, Partial~UserDefinedEventOptions~) Promise~boolean~
        +publishFromCatalog(string, CatalogKey, Partial~UserDefinedEventOptions~) Promise~boolean~
        +startAbTest(AbTestSchema) AbTest
    }
    class RegisteredStratumCatalog["2 RegisteredStratumCatalog"] {
        +id
        +metadata
        +errors
        +validModels
        +addItems(StratumCatalog~T, Y~) RegisteredStratumCatalog~T, K | Y~
        +publish(K, Partial~UserDefinedEventOptions~) Promise~boolean~
    }
    class Injector["3 Injector"] {
        +eventTypeModelMap
        +plugins
        +stratumSessionId
        +registerEventId(string, EventId)
        +getExternalSnapshotListeners() StratumSnapshotListenerFn[]
    }
    class BaseEventModel["4 BaseEventModel"] {
        +key
        +item
        +eventType
        +validationErrors
        +isValid
        +getData(Partial~EventOptions~)
    }
    class BasePlugin["5 BasePlugin"] {
        +name
        +publishers
        +eventTypes
        +context
        +onRegister(Injector, PluginHooks)
    }
    class BasePublisher["6 BasePublisher"] {
        +name
        +acceptedEventModels
        +shouldPublishEvent(BaseEventModel) boolean
        +isAvailable(BaseEventModel, StratumSnapshot) Promise~boolean~
        +getEventOutput(BaseEventModel, StratumSnapshot) T
        +publish(T, StratumSnapshot) Promise~void~
    }
    class generateStratumSnapshot["7 generateStratumSnapshot(Injector, BaseEventModel, RegisteredStratumCatalog, BasePublisher[], Partial~EventOptions~) StratumSnapshot"]
    class AbTestManager["8 AbTestManager"] {
        +tests
        +startAbTest(AbTestSchema) AbTest
        +endAbTest(string | AbTest)
    }
    class NewRelicPlugin["9 NewRelicPlugin"]
    class NewRelicPublisher["10 NewRelicPublisher"]
    class NewRelicPlusPlugin["11 NewRelicPlusPlugin"]
    class NewRelicEventModel["12 NewRelicEventModel"]
    class NewRelicApiResponseEventModel["13 NewRelicApiResponseEventModel"]
    class NewRelicErrorEventModel["14 NewRelicErrorEventModel"]
    class BrowserConsolePlugin["15 BrowserConsolePlugin"]
    class BrowserConsolePublisher["16 BrowserConsolePublisher"]
    class Logger["17 Logger"]

    StratumService --> Injector : 18
    StratumService --> RegisteredStratumCatalog : 19
    StratumService --> BasePublisher : 20
    StratumService --> generateStratumSnapshot : 21
    RegisteredStratumCatalog --> BaseEventModel : 22
    Injector --> BasePublisher : 23
    Injector --> AbTestManager : 24
    generateStratumSnapshot --> Injector : 25
    BasePlugin <|-- NewRelicPlugin : 26
    BasePlugin <|-- NewRelicPlusPlugin : 27
    BasePlugin <|-- BrowserConsolePlugin : 28
    BasePublisher <|-- NewRelicPublisher : 29
    BasePublisher <|-- BrowserConsolePublisher : 30
    BaseEventModel <|-- NewRelicEventModel : 31
    NewRelicEventModel <|-- NewRelicApiResponseEventModel : 32
    NewRelicEventModel <|-- NewRelicErrorEventModel : 33
    NewRelicPlugin --> NewRelicPublisher : 34
    NewRelicPlusPlugin --> NewRelicPublisher : 35
    NewRelicPlusPlugin --> NewRelicEventModel : 36
    BrowserConsolePlugin --> BrowserConsolePublisher : 37
    Injector --> Logger : 38
    Injector --> BaseEventModel : 39
    RegisteredStratumCatalog --> Injector : 40
    BaseEventModel --> Injector : 41
    BasePlugin --> BasePublisher : 42
    BasePlugin --> BaseEventModel : 43
    BasePlugin --> Injector : 44
    BasePublisher --> BaseEventModel : 45
    BasePublisher --> Injector : 46
    NewRelicPublisher --> BaseEventModel : 47
    BrowserConsolePublisher --> BaseEventModel : 48
    NewRelicPlusPlugin --> NewRelicApiResponseEventModel : 49
    NewRelicPlusPlugin --> NewRelicErrorEventModel : 50
    generateStratumSnapshot --> BaseEventModel : 51
    generateStratumSnapshot --> RegisteredStratumCatalog : 52
    generateStratumSnapshot --> BasePublisher : 53
```

```mermaid
classDiagram
    class Example {
        +property
        +method()
    }
    class Parent
    class Child
    Parent <|-- Child : inherits
    Parent --> Child : uses
```

Numbers on classes and relationships match the callout table.

| #   | Description                                                                                                                                         | Why                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | [Source](../../src/service.ts#L36-L341); [`publishFromCatalog`](../../src/service.ts#L197-L269) runs the publish outcomes below.                    | Public entry point.                                                |
| 2   | [Source](../../src/utils/catalog.ts#L19-L208); [`addItems`](../../src/utils/catalog.ts#L114-L128) runs the item outcomes below.                     | Catalog state and its typed publish shortcut.                      |
| 3   | [Source](../../src/utils/injector.ts#L16-L184); [`registerPlugin`](../../src/utils/injector.ts#L133-L168) skips duplicate names.                    | Plugin, event type, and event ID registry.                         |
| 4   | [Source](../../src/base/model.ts#L11-L143); the constructor clones the item and validates ID, uniqueness, and description.                          | Default model for the `base` event type.                           |
| 5   | [Source](../../src/base/plugin.ts#L13-L125); `setContext` only changes keys the context already has.                                                | The shape every plugin declares.                                   |
| 6   | [Source](../../src/base/publisher.ts#L13-L86); `shouldPublishEvent` accepts only models listed in `acceptedEventModels`.                            | The four steps every destination implements.                       |
| 7   | [Source](../../src/utils/event.ts#L64-L121); prefixes each plugin's context keys unless the plugin opts out.                                        | A free function, so it is drawn as a node with no members.         |
| 8   | [Source](../../src/utils/ab-test-manager.ts#L9-L119); IDs come from a static counter, `t1`, `t2`, and so on.                                        | Running tests plus per-publish extras.                             |
| 9   | [Source](../../src/plugins/new-relic/index.ts#L12-L15); named `newRelic`, no event types.                                                           | Accepts every event type.                                          |
| 10  | [Source](../../src/plugins/new-relic/publisher.ts#L16-L163); available only when the agent global exists.                                           | Maps snapshot fields to interaction attributes.                    |
| 11  | [Source](../../src/plugins/new-relic-plus/index.ts#L24-L41); prefix `stratum`, context from `defaultContext`.                                       | Plugin context travels with every event.                           |
| 12  | [Source](../../src/plugins/new-relic-plus/model.ts#L11-L41); requires a non-empty `name`.                                                          | The `nrEvent` type.                                                |
| 13  | [Source](../../src/plugins/new-relic-plus/model.ts#L49-L72); requires string `requestUri` and `statusCode`.                                         | The `nrApiResponse` type.                                          |
| 14  | [Source](../../src/plugins/new-relic-plus/model.ts#L80-L99); requires a string `errorCode`.                                                         | The `nrError` type.                                                |
| 15  | [Source](../../src/plugins/browser-console/index.ts#L8-L11); named `browserConsole`.                                                                | Accepts every event type.                                          |
| 16  | [Source](../../src/plugins/browser-console/publisher.ts#L7-L49); available wherever `console` is defined.                                           | Prints the event as JSON.                                          |
| 17  | [Source](../../src/utils/env.ts#L96-L105); `debug` writes only while the debug flag is set.                                                         | Every debug line passes one check.                                 |
| 18  | Creates the injector in the constructor and calls `registerPlugin`.                                                                                 | All shared state hangs off one injector.                           |
| 19  | Constructs catalogs, or calls `addItems` on an existing ID.                                                                                         | Duplicate catalog IDs merge instead of failing.                    |
| 20  | Filters, checks, maps, and publishes through each publisher in its own microtask.                                                                   | A slow destination never blocks the app.                           |
| 21  | Builds one snapshot per publish call.                                                                                                               | Listeners and publishers share one source of truth.                |
| 22  | Instantiates the model class registered for the item's event type.                                                                                  | Validation lives on the model.                                     |
| 23  | Collects each plugin's publishers and sets their accepted models.                                                                                   | First plugin with a name wins.                                     |
| 24  | Owns the A/B test manager.                                                                                                                          | One manager per service instance.                                  |
| 25  | Reads plugins, context, tests, and metadata.                                                                                                        | Copied from state, but listeners share and can change one object.  |
| 26  | Inherits from the base plugin.                                                                                                                      | Bundled and custom plugins share one contract.                     |
| 27  | Inherits from the base plugin.                                                                                                                      | Same contract, with typed options.                                 |
| 28  | Inherits from the base plugin.                                                                                                                      | Same contract, nothing extra.                                      |
| 29  | Inherits from the base publisher.                                                                                                                   | Overrides `shouldPublishEvent` to accept everything.               |
| 30  | Inherits from the base publisher.                                                                                                                   | Overrides `shouldPublishEvent` to accept everything.               |
| 31  | Adds the `name` rule to the base checks.                                                                                                            | Each subclass calls the parent check first.                        |
| 32  | Adds request fields to the data.                                                                                                                    | API response events carry status and URI.                          |
| 33  | Adds error fields to the data.                                                                                                                      | Error events carry code, text, and reason.                         |
| 34  | Creates one publisher instance.                                                                                                                     | One instance per plugin.                                           |
| 35  | Reuses the New Relic publisher.                                                                                                                     | No second publisher to maintain.                                   |
| 36  | Maps the `nrEvent` type to its model.                                                                                                               | The type string picks the model class.                             |
| 37  | Creates one publisher instance.                                                                                                                     | One instance per plugin.                                           |
| 38  | Creates the shared logger.                                                                                                                          | Catalogs and the service log through it.                           |
| 39  | Maps each event type to its model class, `base` by default.                                                                                         | Catalogs look up models here.                                      |
| 40  | Reads event types and product metadata, and registers event IDs.                                                                                    | IDs stay unique within a catalog.                                  |
| 41  | Checks its ID against the registered IDs.                                                                                                           | A duplicate ID fails validation.                                   |
| 42  | Declares the plugin's publishers.                                                                                                                   | A plugin bundles its destinations.                                 |
| 43  | Declares the plugin's event types and their models.                                                                                                 | Event types map to model classes.                                  |
| 44  | `onRegister` receives the injector.                                                                                                                 | Plugins read shared state when added.                              |
| 45  | Lists accepted models and takes the event model on each step.                                                                                       | Each publisher picks the models it handles.                        |
| 46  | `onInitialize` receives the injector.                                                                                                               | Publishers read shared state when registered.                      |
| 47  | Takes the event model when mapping output.                                                                                                          | Same signature as the base publisher.                              |
| 48  | Takes the event model when mapping output.                                                                                                          | Same signature as the base publisher.                              |
| 49  | Maps the `nrApiResponse` type to its model.                                                                                                         | The type string picks the model class.                             |
| 50  | Maps the `nrError` type to its model.                                                                                                               | The type string picks the model class.                             |
| 51  | Reads the event model's data, ID, and type.                                                                                                         | The event part of the snapshot.                                    |
| 52  | Reads the catalog's ID and metadata.                                                                                                                | Every event names its catalog.                                     |
| 53  | Reads each publisher's plugin name to pick its context and options.                                                                                 | Each publisher gets its own plugin's view.                         |

## Publish outcomes

| Outcome                  | When                                                             | Result                         |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------ |
| Missing or invalid key   | The catalog ID or the key has no valid model                     | `false`, debug line logged     |
| No publishers            | No publisher accepts the model                                   | `true`, listeners still called |
| All published            | Every accepting publisher is available and publishes             | `true`                         |
| A publisher unavailable  | Any `isAvailable` resolves `false`                               | `false`, debug line logged     |
| A publisher throws       | `isAvailable`, `getEventOutput`, or `publish` throws             | `false`, debug line logged     |

## Catalog item outcomes

| Outcome                  | When                                                             | Recorded in                    |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------ |
| Valid                    | Known event type and every model check passes                   | `validModels`, event ID registered |
| Duplicate key            | The key is already a valid model in this catalog                 | `errors`                       |
| Unknown event type       | No plugin registered the item's `eventType`                      | `errors`                       |
| Model rejected           | The model's checks fail, such as a duplicate ID                  | `errors`, with each message    |
