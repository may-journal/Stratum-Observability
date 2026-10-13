---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0006 Plugin Context

## Why

A plugin's context values travel with every event, as they stood when I published it.

## Measurement

events carrying the context set before their publish call
-
events published with plugin context

Source: `src/base/plugin.ts:95`

## Requirements

- 0006.1
    - Given Plugin author has a plugin with a default context
        - When I set a context key the plugin declares
            - Then the plugin reports the new value
- 0006.2
    - Given Plugin author has a plugin with a default context
        - When I set a key the plugin does not declare
            - Then the plugin refuses it and keeps no value
- 0006.3
    - Given Plugin author has a plugin whose context changes right after a publish
        - When that event is delivered
            - Then it carries the context from the moment of publishing
- 0006.4
    - Given Plugin author has turned off the context prefix
        - When an event is delivered
            - Then its context keys carry no plugin name
