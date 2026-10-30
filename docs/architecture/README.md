# Architecture

Stratum is a library that gives every app one standard way to publish events. Read these views from the top down.

| Level | View                                   | Question it answers                               |
| ----- | -------------------------------------- | ------------------------------------------------- |
| 1     | [System context](01-system-context.md) | Who uses Stratum, and what sits outside it?       |
| 2     | [Containers](02-containers.md)         | What ships, and how does an app load it?          |
| 3     | [Components](03-components.md)         | Which parts of `src` own which job?               |
| 4     | [Code](04-code.md)                     | Which classes run a publish or register a plugin? |
| Flow  | [User journey](05-user-journey.md)     | What does a developer do, and what happens next?  |

Start with level 1 to learn the ideas. Start with level 3 to change code. Requirements live in [`../requirements`](../requirements).

## Glossary

| Term              | Meaning                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Catalog           | The set of events an app may publish, each under a key.                                  |
| Catalog key       | The name an app passes to `publish` to pick one catalog item.                            |
| Event type        | A string on a catalog item that selects which event model checks it.                     |
| Event model       | A class that validates one catalog item and returns its data.                            |
| Plugin            | A bundle of event types and publishers for one destination.                              |
| Publisher         | The class that sends one event to one destination.                                       |
| Snapshot          | One frozen copy of an event's data, metadata, context and tests, built per publish call. |
| Snapshot listener | A function that receives each snapshot, without being a plugin.                          |
| Global plugin     | A plugin placed on `globalThis` so another script can add it to every service.           |
| Plugin context    | Extra values a plugin adds to every snapshot, under its own prefix.                      |
| Injector          | The object that holds plugins, event types, event IDs, the logger and the session ID.    |
| Debug flag        | The `stratumdb` session storage value that turns on debug lines.                         |

## Where to change X

| Change                       | Start in                                          | View               |
| ---------------------------- | ------------------------------------------------- | ------------------ |
| Add a destination plugin     | A new folder under `src/plugins`; Rollup finds it | Components, row 7  |
| Add an event type            | `eventTypes` on a plugin, with a `BaseEventModel` | Code, rows 4 and 5 |
| Change how a publisher sends | The publisher's `getEventOutput` and `publish`    | Code, row 6        |
| Change what a snapshot holds | `generateStratumSnapshot` in `src/utils/event.ts` | Code, row 7        |
| Change catalog validation    | `RegisteredStratumCatalog` and the event models   | Code, rows 2 and 4 |
| Add or change a debug line   | The `Logger` in `src/utils/env.ts`                | Code, row 17       |
