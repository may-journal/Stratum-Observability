# User Journey

Up: [Code](04-code.md).

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
    construct(3 Install and Construct<br/>Req 0001):::action
    globalPlugins[(4 Global Plugins<br/>Req 0005)]:::system
    registry[(5 Plugin Registry<br/>Req 0004)]:::system
    context(6 Plugin Context<br/>Req 0006):::action
    validation[(7 Catalog Validation<br/>Req 0002)]:::system
    changes(8 Catalog Identity and Changes<br/>Req 0003):::action
    abTests(9 A/B Tests<br/>Req 0009):::action
    publish(10 Publish Events by Key<br/>Req 0007):::action
    listeners[(11 Snapshot Listeners<br/>Req 0008)]:::system
    console[12 Browser Console Output<br/>Req 0101]:::screen
    newRelic[13 New Relic Interactions<br/>Req 0111]:::screen
    newRelicPlus[14 New Relic Plus Events<br/>Req 0121]:::screen
    debug[15 Debug Log<br/>Req 0010]:::screen
    dataLayer[16 Data Layer Entries<br/>Req 0131]:::screen
    beacon[17 Beacon Requests<br/>Req 0141]:::screen

    developer --> construct
    construct --> registry
    globalPlugins --> registry
    pluginAuthor --> registry
    pluginAuthor --> context
    registry --> validation
    developer --> changes
    changes --> validation
    validation --> publish
    developer --> abTests
    abTests --> publish
    context --> publish
    publish --> listeners
    publish --> console
    publish --> newRelic
    publish --> newRelicPlus
    publish --> dataLayer
    publish --> beacon
    registry --> debug
    validation --> debug
    publish --> debug

    classDef persona fill:#eef2ff,stroke:#6366f1,color:#312e81,stroke-width:2px
    classDef screen fill:#f8fafc,stroke:#64748b,color:#1e293b,stroke-width:2px
    classDef action fill:#fff7ed,stroke:#f97316,color:#9a3412,stroke-width:2px
    classDef system fill:#ecfdf5,stroke:#10b981,color:#064e3b,stroke-width:2px
```

Numbers match the callout table.

| #   | Description                                                                         | Type    | Why                                                  |
| --- | ----------------------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| 1   | Same actor as the system context.                                                   | Persona | Owns the app and its catalogs.                       |
| 2   | Same actor as the system context.                                                   | Persona | Reaches a new destination without changing the core. |
| 3   | [0001](../requirements/0001-engine-install-and-construct.md): 0001.1 to 0001.8.     | Action  | One package and one service per app.                 |
| 4   | [0005](../requirements/0005-engine-global-plugins.md): 0005.1 to 0005.4.            | System  | Page scripts add plugins without touching app code.  |
| 5   | [0004](../requirements/0004-engine-plugin-registry.md): 0004.1 to 0004.7.           | System  | Event types exist before catalogs need them.         |
| 6   | [0006](../requirements/0006-engine-plugin-context.md): 0006.1 to 0006.3.            | Action  | Plugin context travels with every event.             |
| 7   | [0002](../requirements/0002-engine-catalog-validation.md): 0002.1 to 0002.6.        | System  | Bad items never reach a publisher.                   |
| 8   | [0003](../requirements/0003-engine-catalog-changes.md): 0003.1 to 0003.8.           | Action  | Catalogs change while the app runs.                  |
| 9   | [0009](../requirements/0009-engine-ab-tests.md): 0009.1 to 0009.3.                  | Action  | Running tests tag every later event.                 |
| 10  | [0007](../requirements/0007-engine-publish-events.md): 0007.1 and 0007.3 to 0007.9. | Action  | One call per user action.                            |
| 11  | [0008](../requirements/0008-engine-snapshot-listeners.md): 0008.1 to 0008.3.        | System  | Page scripts observe events without a plugin.        |
| 12  | [0101](../requirements/0101-plugin-browser-console-output.md): 0101.1.              | Screen  | Instant feedback in developer tools.                 |
| 13  | [0111](../requirements/0111-plugin-new-relic-interactions.md): 0111.1 to 0111.4.    | Screen  | Queryable in New Relic.                              |
| 14  | [0121](../requirements/0121-plugin-new-relic-plus-events.md): 0121.1 to 0121.5.     | Screen  | Typed New Relic events with prefixed context.        |
| 15  | [0010](../requirements/0010-engine-debug-log.md): 0010.1 to 0010.4.                 | Screen  | Explains dropped items and skipped publishers.       |
| 16  | [0131](../requirements/0131-plugin-data-layer-entries.md): 0131.1 to 0131.4.        | Screen  | Tag managers see every event.                        |
| 17  | [0141](../requirements/0141-plugin-beacon-requests.md): 0141.1 to 0141.6.           | Screen  | A team's own collector sees every event.             |
