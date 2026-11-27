# 0006 Plugin Context

## Why

A plugin's context holds only the keys it declares, and its values travel with every event.

## Measurement

context keys accepted that the plugin declares

-

context keys set

## Requirements

1. Declared context keys update
   1. GIVEN Plugin author has a plugin with a default context
      1. WHEN I set a context key the plugin declares
         1. THEN the plugin reports the new value
2. Undeclared context keys are refused
   1. GIVEN Plugin author has a plugin with a default context
      1. WHEN I set a key the plugin does not declare
         1. THEN the plugin refuses it
         2. THEN the plugin keeps no value
3. Unprefixed context keys carry no plugin name
   1. GIVEN Plugin author has turned off the context prefix
      1. WHEN an event is delivered
         1. THEN the event's context keys carry no plugin name
