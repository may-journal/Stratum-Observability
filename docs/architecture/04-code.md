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
        +registerPlugin(GenericPlugin)
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
        +generateContexts(AbTestSchema | AbTest | (AbTestSchema | AbTest)[]) AbTestSchema[]
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

    StratumService --> Injector : A
    StratumService --> RegisteredStratumCatalog : B
    StratumService --> BasePublisher : C
    StratumService --> generateStratumSnapshot : D
    RegisteredStratumCatalog --> BaseEventModel : E
    Injector --> BasePublisher : F
    Injector --> AbTestManager : G
    generateStratumSnapshot --> Injector : H
    BasePlugin <|-- NewRelicPlugin : I
    BasePlugin <|-- NewRelicPlusPlugin : J
    BasePlugin <|-- BrowserConsolePlugin : K
    BasePublisher <|-- NewRelicPublisher : L
    BasePublisher <|-- BrowserConsolePublisher : M
    BaseEventModel <|-- NewRelicEventModel : N
    NewRelicEventModel <|-- NewRelicApiResponseEventModel : O
    NewRelicEventModel <|-- NewRelicErrorEventModel : P
    NewRelicPlugin --> NewRelicPublisher : Q
    NewRelicPlusPlugin --> NewRelicPublisher : R
    NewRelicPlusPlugin --> NewRelicEventModel : S
    BrowserConsolePlugin --> BrowserConsolePublisher : T
    Injector --> Logger : U
    Injector --> BaseEventModel : V
    RegisteredStratumCatalog --> Injector : W
    BaseEventModel --> Injector : X
    BasePlugin --> BasePublisher : Y
    BasePlugin --> BaseEventModel : Z
    BasePlugin --> Injector : AA
    BasePublisher --> BaseEventModel : BB
    BasePublisher --> Injector : CC
    NewRelicPublisher --> BaseEventModel : DD
    BrowserConsolePublisher --> BaseEventModel : EE
    NewRelicPlusPlugin --> NewRelicApiResponseEventModel : FF
    NewRelicPlusPlugin --> NewRelicErrorEventModel : GG
    generateStratumSnapshot --> BaseEventModel : HH
    generateStratumSnapshot --> RegisteredStratumCatalog : II
    generateStratumSnapshot --> BasePublisher : JJ

    style StratumService fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style RegisteredStratumCatalog fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style Injector fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style BaseEventModel fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style BasePlugin fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style BasePublisher fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style generateStratumSnapshot fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style AbTestManager fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style NewRelicPlugin fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style NewRelicPublisher fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style NewRelicPlusPlugin fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style NewRelicEventModel fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style NewRelicApiResponseEventModel fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style NewRelicErrorEventModel fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style BrowserConsolePlugin fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style BrowserConsolePublisher fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style Logger fill:#6d28d9,stroke:#4c1d95,color:#ffffff
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

    style Example fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style Parent fill:#6d28d9,stroke:#4c1d95,color:#ffffff
    style Child fill:#6d28d9,stroke:#4c1d95,color:#ffffff
```

Numbers on classes and letters on relationships match the callout table.

| #   | Description                                                                                                                                              | Why                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | [Source](../../src/service.ts#L36-L341); [`publishFromCatalog`](../../src/service.ts#L197-L269) runs the publish outcomes below.                         | Public entry point.                                               |
| 2   | [Source](../../src/utils/catalog.ts#L19-L208); [`addItems`](../../src/utils/catalog.ts#L114-L128) runs the item outcomes below.                          | Catalog state and its typed publish shortcut.                     |
| 3   | [Source](../../src/utils/injector.ts#L16-L184); [`registerPlugin`](../../src/utils/injector.ts#L133-L168) returns `{ publishers }` and skips duplicates. | Plugin, event type, and event ID registry.                        |
| 4   | [Source](../../src/base/model.ts#L11-L143); the constructor clones the item and validates ID, uniqueness, and description.                               | Default model for the `base` event type.                          |
| 5   | [Source](../../src/base/plugin.ts#L13-L125); `setContext` only changes keys the context already has.                                                     | The shape every plugin declares.                                  |
| 6   | [Source](../../src/base/publisher.ts#L13-L86); `shouldPublishEvent` accepts only models listed in `acceptedEventModels`.                                 | The four steps every destination implements.                      |
| 7   | [Source](../../src/utils/event.ts#L64-L121); prefixes each plugin's context keys unless the plugin opts out.                                             | A free function, so it is drawn as a node with no members.        |
| 8   | [Source](../../src/utils/ab-test-manager.ts#L9-L119); IDs come from a static counter, `t1`, `t2`, and so on.                                             | Running tests plus per-publish extras.                            |
| 9   | [Source](../../src/plugins/new-relic/index.ts#L12-L15); named `newRelic`, no event types.                                                                | Accepts every event type.                                         |
| 10  | [Source](../../src/plugins/new-relic/publisher.ts#L16-L163); available only when the agent global exists.                                                | Maps snapshot fields to interaction attributes.                   |
| 11  | [Source](../../src/plugins/new-relic-plus/index.ts#L24-L41); prefix `stratum`, context from `defaultContext`.                                            | Plugin context travels with every event.                          |
| 12  | [Source](../../src/plugins/new-relic-plus/model.ts#L11-L41); requires a non-empty `name`.                                                                | The `nrEvent` type.                                               |
| 13  | [Source](../../src/plugins/new-relic-plus/model.ts#L49-L72); requires string `requestUri` and `statusCode`.                                              | The `nrApiResponse` type.                                         |
| 14  | [Source](../../src/plugins/new-relic-plus/model.ts#L80-L99); requires a string `errorCode`.                                                              | The `nrError` type.                                               |
| 15  | [Source](../../src/plugins/browser-console/index.ts#L8-L11); named `browserConsole`.                                                                     | Accepts every event type.                                         |
| 16  | [Source](../../src/plugins/browser-console/publisher.ts#L7-L49); available wherever `console` is defined.                                                | Prints the event as JSON.                                         |
| 17  | [Source](../../src/utils/env.ts#L96-L105); `debug` writes only while the debug flag is set.                                                              | Every debug line passes one check.                                |
| A   | Creates the injector in the constructor and calls `registerPlugin`.                                                                                      | All shared state hangs off one injector.                          |
| B   | Constructs catalogs, or calls `addItems` on an existing ID.                                                                                              | Duplicate catalog IDs merge instead of failing.                   |
| C   | Filters, checks, maps, and publishes through each publisher in its own microtask.                                                                        | A slow destination never blocks the app.                          |
| D   | Builds one snapshot per publish call.                                                                                                                    | Listeners and publishers share one source of truth.               |
| E   | Instantiates the model class registered for the item's event type.                                                                                       | Validation lives on the model.                                    |
| F   | `registerPlugin` collects each plugin's publishers and tags them with the plugin name.                                                                   | A publisher with no model list accepts only its plugin's models.  |
| G   | Owns the A/B test manager.                                                                                                                               | One manager per service instance.                                 |
| H   | Reads plugins, context, tests, and metadata.                                                                                                             | Copied from state, but listeners share and can change one object. |
| I   | Inherits from the base plugin.                                                                                                                           | Bundled and custom plugins share one contract.                    |
| J   | Inherits from the base plugin.                                                                                                                           | Same contract, with typed options.                                |
| K   | Inherits from the base plugin.                                                                                                                           | Same contract, nothing extra.                                     |
| L   | Inherits from the base publisher.                                                                                                                        | Overrides `shouldPublishEvent` to accept everything.              |
| M   | Inherits from the base publisher.                                                                                                                        | Overrides `shouldPublishEvent` to accept everything.              |
| N   | Adds the `name` rule to the base checks.                                                                                                                 | Each subclass calls the parent check first.                       |
| O   | Adds request fields to the data.                                                                                                                         | API response events carry status and URI.                         |
| P   | Adds error fields to the data.                                                                                                                           | Error events carry code, text, and reason.                        |
| Q   | Creates one publisher instance.                                                                                                                          | One instance per plugin.                                          |
| R   | Reuses the New Relic publisher.                                                                                                                          | No second publisher to maintain.                                  |
| S   | Maps the `nrEvent` type to its model.                                                                                                                    | The type string picks the model class.                            |
| T   | Creates one publisher instance.                                                                                                                          | One instance per plugin.                                          |
| U   | Creates the shared logger.                                                                                                                               | Catalogs and the service log through it.                          |
| V   | Maps each event type to its model class, `base` by default.                                                                                              | Catalogs look up models here.                                     |
| W   | Reads event types and product metadata, and registers event IDs.                                                                                         | IDs stay unique within a catalog.                                 |
| X   | Checks its ID against the registered IDs.                                                                                                                | A duplicate ID fails validation.                                  |
| Y   | Declares the plugin's publishers.                                                                                                                        | A plugin bundles its destinations.                                |
| Z   | Declares the plugin's event types and their models.                                                                                                      | Event types map to model classes.                                 |
| AA  | `onRegister` receives the injector.                                                                                                                      | Plugins read shared state when added.                             |
| BB  | Lists accepted models and takes the event model on each step.                                                                                            | Each publisher picks the models it handles.                       |
| CC  | `onInitialize` receives the injector.                                                                                                                    | Publishers read shared state when registered.                     |
| DD  | Takes the event model when mapping output.                                                                                                               | Same signature as the base publisher.                             |
| EE  | Takes the event model when mapping output.                                                                                                               | Same signature as the base publisher.                             |
| FF  | Maps the `nrApiResponse` type to its model.                                                                                                              | The type string picks the model class.                            |
| GG  | Maps the `nrError` type to its model.                                                                                                                    | The type string picks the model class.                            |
| HH  | Reads the event model's data, ID, and type.                                                                                                              | The event part of the snapshot.                                   |
| II  | Reads the catalog's ID and metadata.                                                                                                                     | Every event names its catalog.                                    |
| JJ  | Reads each publisher's plugin name to pick its context and options.                                                                                      | Each publisher gets its own plugin's view.                        |

## Publish outcomes

| Outcome                 | When                                                 | Result                         |
| ----------------------- | ---------------------------------------------------- | ------------------------------ |
| Missing or invalid key  | The catalog ID or the key has no valid model         | `false`, debug line logged     |
| No publishers           | No publisher accepts the model                       | `true`, listeners still called |
| All published           | Every accepting publisher is available and publishes | `true`                         |
| A publisher unavailable | Any `isAvailable` resolves `false`                   | `false`, debug line logged     |
| A publisher throws      | `isAvailable`, `getEventOutput`, or `publish` throws | `false`, debug line logged     |

## Catalog item outcomes

| Outcome            | When                                             | Recorded in                        |
| ------------------ | ------------------------------------------------ | ---------------------------------- |
| Valid              | Known event type and every model check passes    | `validModels`, event ID registered |
| Duplicate key      | The key is already a valid model in this catalog | `errors`                           |
| Unknown event type | No plugin registered the item's `eventType`      | `errors`                           |
| Model rejected     | The model's checks fail, such as a duplicate ID  | `errors`, with each message        |
