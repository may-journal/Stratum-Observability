---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0007 Snapshot Listeners

## Why

Scripts on my page can watch every event without writing a plugin.

## Measurement

published events each listener receives
-
published events

Source: `src/service.ts:221`

## Requirements

- 0007.1
    - Given App developer has a service
        - When I add a snapshot listener to it
            - Then the listener is stored on the page for that product
- 0007.2
    - Given App developer has listeners for every product and for this one
        - When the service gathers listeners
            - Then the ones for every product come first
- 0007.3
    - Given App developer has a page that refuses new globals
        - When I add a snapshot listener
            - Then the call returns false
- 0007.4
    - Given App developer has no service yet
        - When a page script adds several listeners for one or every product
            - Then each listener is kept in order
