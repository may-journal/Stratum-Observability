---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0121 New Relic Plus Events

## Why

New Relic Plus adds checked event, API response and error types, and sends my own context with every event.

## Measurement

New Relic Plus events saved with their checked fields and context
-
New Relic Plus events published

Source: `src/plugins/new-relic-plus/index.ts:24`

## Requirements

- 0121.1
    - Given App developer has New Relic Plus items missing a name, request or error field
        - When I register their catalog
            - Then each is held back with one error per missing field
- 0121.2
    - Given App developer has New Relic Plus and an event, API response or error item
        - When I publish its key
            - Then New Relic saves one interaction with that type's fields
- 0121.3
    - Given App developer has a New Relic Plus context value that is unset or null
        - When I publish a New Relic event
            - Then the interaction leaves that value out
- 0121.4
    - Given App developer has New Relic Plus context values set
        - When I publish its own or another plugin's event
            - Then the interaction carries each value with the `stratum_` prefix
- 0121.5
    - Given App developer has an API response item with placeholders in its request fields
        - When I publish it with replacements
            - Then the interaction carries the replaced request fields
