# 0004 Plugin Registry

## Why

A plugin I write with the base classes adds event types and destinations without any change to the core.

## Measurement

plugins whose event types and publishers join publishing

-

plugins registered

Source: `src/utils/injector.ts:133`

## Requirements

- 0004.1
  - Given Plugin author has a plugin with event types and a publisher
    - When the app adds it after construction
      - Then its types validate items and its publisher gets events
- 0004.2
  - Given App developer has two plugins with the same name
    - When I pass both to the service
      - Then only the first and its publisher are registered
- 0004.3
  - Given Plugin author has a plugin declaring an event type another plugin owns
    - When the app adds it
      - Then the first plugin keeps the type and a debug line says why
- 0004.4
  - Given Plugin author has a publisher that accepts another plugin's event types
    - When the app publishes one of those events
      - Then that publisher gets the event with its plugin's options
- 0004.5
  - Given Plugin author has a publisher that names no accepted event types
    - When the plugin is registered
      - Then the publisher accepts only its own plugin's event types
- 0004.6
  - Given Plugin author has a plugin that adds a catalog when registered
    - When it publishes from that catalog
      - Then the snapshot listener gets the event
- 0004.7
  - Given Plugin author has a publisher outside any plugin that names no accepted event types
    - When I ask whether it handles an event
      - Then it accepts every event
