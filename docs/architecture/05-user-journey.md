# User Journey

## Legend

```mermaid
flowchart TB
    subgraph types["Node types"]
        persona((1 Persona)):::persona
        screen[2 Screen]:::screen
        action(3 Action):::action
        system[(4 System)]:::system
    end

    classDef persona fill:#eef2ff,stroke:#6366f1,color:#312e81,stroke-width:2px
    classDef screen fill:#f8fafc,stroke:#64748b,color:#1e293b,stroke-width:2px
    classDef action fill:#fff7ed,stroke:#f97316,color:#9a3412,stroke-width:2px
    classDef system fill:#ecfdf5,stroke:#10b981,color:#064e3b,stroke-width:2px
```

Numbers match the callout table. "Screen" is output the developer sees, not a GUI view; this is a library.

| #   | Description | Why                                                     |
| --- | ----------- | ------------------------------------------------------- |
| 1   | Persona     | Someone who adds Stratum to an app or writes a plugin.  |
| 2   | Screen      | What the developer sees: a destination record or a log. |
| 3   | Action      | A call the app code makes.                              |
| 4   | System      | Work Stratum does inside the call.                      |

## Journey

```mermaid
flowchart TB
    developer((1 App developer)):::persona
    pluginAuthor((2 Plugin author)):::persona
    install(3 Install the package<br/>Req 0001):::action
    construct(4 Construct StratumService<br/>Req 0001, 0003):::action
    writePlugin(5 Extend the base classes<br/>Req 0004, 0006):::action
    registerPlugins[(6 Register plugins and global plugins<br/>Req 0004, 0005)]:::system
    validate[(7 Validate catalog items<br/>Req 0002, 0003)]:::system
    publish(8 Publish by catalog key<br/>Req 0007):::action
    snapshot[(9 Build the snapshot<br/>Req 0001, 0007)]:::system
    listeners[(10 Notify snapshot listeners<br/>Req 0008)]:::system
    dispatch[(11 Check each publisher<br/>Req 0004, 0007)]:::system
    newRelicOut[12 New Relic interaction saved<br/>Req 0111, 0121]:::screen
    consoleOut[13 Event logged to the console<br/>Req 0101]:::screen
    debugOut[14 Debug line logged<br/>Req 0010]:::screen
    abTest(15 Start or end an A/B test<br/>Req 0009):::action

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

Numbers match the callout table. System context: [01-system-context.md](01-system-context.md). Components: [03-components.md](03-components.md). Code: [04-code.md](04-code.md).

| #   | Description                                                                                             | Type    | Why                                                            |
| --- | ------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| 1   | Same actor as the system context.                                                                       | Persona | Owns the app and its catalogs.                                 |
| 2   | Same actor as the system context.                                                                       | Persona | Reaches a new destination without changing the core.           |
| 3   | Adds the package and imports a plugin subpath.                                                          | Action  | Only imported plugins enter the bundle.                        |
| 4   | Passes product name, version, a default catalog, and plugins to the constructor.                        | Action  | Setup happens once per app.                                    |
| 5   | Subclasses the base plugin, publisher, and model, then passes the plugin to the service.                | Action  | Custom destinations use the same contract as bundled ones.     |
| 6   | Registers constructor plugins first, then any on `globalThis`; a duplicate name is skipped.             | System  | Event types exist before catalogs need them.                   |
| 7   | Keeps valid items as models and records errors for the rest.                                            | System  | Bad items never reach a publisher.                             |
| 8   | Calls `publish`, `publishFromCatalog`, or `catalog.publish` with optional replacements and plugin data. | Action  | One call per user action.                                      |
| 9   | Collects event data, catalog metadata, plugin context, session ID, and A/B tests.                       | System  | Every destination gets the same facts.                         |
| 10  | Calls global and per-product listeners in a microtask.                                                  | System  | Page scripts observe events without a plugin.                  |
| 11  | Asks each accepting publisher whether it is available, then maps and publishes.                         | System  | A missing destination is skipped, and the call resolves false. |
| 12  | One SPA interaction with Stratum attributes and the event name.                                         | Screen  | Queryable in New Relic.                                        |
| 13  | One JSON line per event.                                                                                | Screen  | Instant feedback in developer tools.                           |
| 14  | Shown only when session storage holds `stratumdb` set to `true`.                                        | Screen  | Explains dropped items and skipped publishers.                 |
| 15  | Calls `startAbTest`, `endAbTest`, or `endAllAbTests`.                                                   | Action  | Running tests tag every later event.                           |
