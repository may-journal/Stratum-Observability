---
relatedConfigurations: ["../../vitest.config.mts"]
---

# 0006 Plugin Context

## Why

A plugin's context holds only the keys it declares, and its values travel with every event.

## Measurement

context keys accepted that the plugin declares

-

context keys set

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
  - Given Plugin author has turned off the context prefix
    - When an event is delivered
      - Then its context keys carry no plugin name
