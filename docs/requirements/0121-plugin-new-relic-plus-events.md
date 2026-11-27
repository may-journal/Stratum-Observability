# 0121 New Relic Plus Events

## Why

New Relic Plus adds checked event, API response and error types, and sends my own context with every event.

## Measurement

New Relic Plus events saved with their checked fields and context

-

New Relic Plus events published

## Requirements

1. Incomplete items are held back
   1. GIVEN App developer has New Relic Plus items missing a name
   2. GIVEN request or error field
      1. WHEN I register their catalog
         1. THEN each item is held back with one error per missing field
2. Item types save their own fields
   1. GIVEN App developer has New Relic Plus
   2. GIVEN an event
   3. GIVEN API response or error item
      1. WHEN I publish its key
         1. THEN New Relic saves one interaction with that type's fields
3. Empty context values are left out
   1. GIVEN App developer has a New Relic Plus context value that is unset or null
      1. WHEN I publish a New Relic event
         1. THEN the interaction leaves that value out
4. Context values take a prefix
   1. GIVEN App developer has New Relic Plus context values set
      1. WHEN I publish its own or another plugin's event
         1. THEN the interaction carries each value with the `stratum_` prefix
5. Request placeholders are replaced
   1. GIVEN App developer has an API response item with placeholders in its request fields
      1. WHEN I publish it with replacements
         1. THEN the interaction carries the replaced request fields
