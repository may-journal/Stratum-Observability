---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0015 New Relic Plus Plugin

## Why

New Relic Plus adds checked event, API response and error types, and sends my own context with every event.

## Measurement

New Relic Plus events saved with their checked fields and context
-
New Relic Plus events published

Source: `src/plugins/new-relic-plus/index.ts:24`

## Requirements

- 0015.1
    - Given App developer has New Relic Plus and well-formed event, API response and error items
        - When I register their catalog
            - Then each item loads as its New Relic type
- 0015.2
    - Given App developer has New Relic Plus items missing a name, request or error field
        - When I register their catalog
            - Then each is held back with one error per missing field
- 0015.3
    - Given App developer has New Relic Plus and an event, API response or error item
        - When I publish its key
            - Then New Relic saves one interaction with that type's fields
- 0015.4
    - Given App developer has New Relic Plus with a default context
        - When I set context keys
            - Then only keys in the default context are accepted
- 0015.5
    - Given App developer has a New Relic Plus context value that is unset or null
        - When I publish a New Relic event
            - Then the interaction leaves that value out
- 0015.6
    - Given App developer has New Relic Plus context values set
        - When I publish a New Relic event
            - Then the interaction carries each value with the `stratum_` prefix
- 0015.7
    - Given App developer has New Relic Plus context and another plugin's catalog
        - When I publish that plugin's event
            - Then the interaction still carries my context
- 0015.8
    - Given App developer has an API response item with placeholders
        - When I publish it with replacements
            - Then the interaction carries the replaced values
