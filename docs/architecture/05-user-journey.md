---
fitnessFunctions: ['architecture-contract', 'architecture-journey']
---

# User Journey

## Legend

```mermaid
flowchart TB
    subgraph types["Node types"]
        persona((1 Persona)):::persona
        screen[2 Output]:::screen
        action(3 Action):::action
        system[(4 Library step)]:::system
    end

    classDef persona fill:#eef2ff,stroke:#6366f1,color:#312e81,stroke-width:2px
    classDef screen fill:#f8fafc,stroke:#64748b,color:#1e293b,stroke-width:2px
    classDef action fill:#fff7ed,stroke:#f97316,color:#9a3412,stroke-width:2px
    classDef system fill:#ecfdf5,stroke:#10b981,color:#064e3b,stroke-width:2px

    style types fill:#ffffff,stroke:#e2e8f0,color:#475569,stroke-width:1px
```

Numbers match the callout table.

| #   | Description  | Why                                                        |
| --- | ------------ | ---------------------------------------------------------- |
| 1   | Persona      | Someone who adds Stratum to an app or writes a plugin.     |
| 2   | Output       | What the developer sees: a destination record or a log.    |
| 3   | Action       | A call the app code makes.                                 |
| 4   | Library step | Work Stratum does inside the call.                         |

## App developer journey

Each step will name the requirement docs it fulfils once `docs/requirements` exists.

```mermaid
flowchart TB
    developer((1 App developer)):::persona
    pluginAuthor((2 Plugin author)):::persona
    install(3 Install the package):::action
    construct(4 Construct StratumService):::action
    writePlugin(5 Extend the base classes):::action
    registerPlugins[(6 Register plugins and global plugins)]:::system
    validate[(7 Validate catalog items)]:::system
    publish(8 Publish by catalog key):::action
    snapshot[(9 Build the snapshot)]:::system
    listeners[(10 Notify snapshot listeners)]:::system
    dispatch[(11 Check each publisher)]:::system
    newRelicOut[12 New Relic interaction saved]:::screen
    consoleOut[13 Event logged to the console]:::screen
    debugOut[14 Debug line logged]:::screen
    abTest(15 Start or end an A/B test):::action

    developer --> install
    install --> construct
    pluginAuthor --> writePlugin
    writePlugin --> registerPlugins
    construct --> registerPlugins
    registerPlugins --> validate
    validate --> publish
    abTest --> publish
    developer --> abTest
    publish --> snapshot
    snapshot --> listeners
    snapshot --> dispatch
    dispatch --> newRelicOut
    dispatch --> consoleOut
    dispatch --> debugOut
    validate --> debugOut

    classDef persona fill:#eef2ff,stroke:#6366f1,color:#312e81,stroke-width:2px
    classDef screen fill:#f8fafc,stroke:#64748b,color:#1e293b,stroke-width:2px
    classDef action fill:#fff7ed,stroke:#f97316,color:#9a3412,stroke-width:2px
    classDef system fill:#ecfdf5,stroke:#10b981,color:#064e3b,stroke-width:2px
```

Numbers match the callout table.

| #   | Description                                                                                                          | Why                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Same actor as the system context.                                                                                    | Owns the app and its catalogs.                                  |
| 2   | Same actor as the system context.                                                                                    | Reaches a new destination without changing the core.            |
| 3   | Adds the package and imports a plugin subpath.                                                                      | Only imported plugins enter the bundle.                         |
| 4   | Passes product name, version, a default catalog, and plugins to the constructor.                                     | Setup happens once per app.                                     |
| 5   | Subclasses the base plugin, publisher, and model, then passes the plugin to the service.                             | Custom destinations use the same contract as bundled ones.      |
| 6   | Registers constructor plugins first, then any on `globalThis`; a duplicate name is skipped.                          | Event types exist before catalogs need them.                    |
| 7   | Keeps valid items as models and records errors for the rest.                                                         | Bad items never reach a publisher.                              |
| 8   | Calls `publish`, `publishFromCatalog`, or `catalog.publish` with optional replacements and plugin data.              | One call per user action.                                       |
| 9   | Collects event data, catalog metadata, plugin context, session ID, and A/B tests.                                    | Every destination gets the same facts.                          |
| 10  | Calls global and per-product listeners in a microtask.                                                               | Page scripts observe events without a plugin.                   |
| 11  | Asks each accepting publisher whether it is available, then maps and publishes.                                      | A missing destination is skipped, and the call resolves false.  |
| 12  | One SPA interaction with Stratum attributes and the event name.                                                      | Queryable in New Relic.                                         |
| 13  | One JSON line per event.                                                                                             | Instant feedback in developer tools.                            |
| 14  | Shown only when session storage holds the `DEBUG_KEY` flag as `true`.                                                    | Explains dropped items and skipped publishers.                  |
| 15  | Calls `startAbTest`, `endAbTest`, or `endAllAbTests`.                                                                | Running tests tag every later event.                            |
