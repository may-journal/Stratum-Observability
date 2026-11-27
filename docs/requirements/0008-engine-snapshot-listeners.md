# 0008 Snapshot Listeners

## Why

Scripts on my page can watch every event without writing a plugin.

## Measurement

published events each listener receives

-

published events

## Requirements

1. Listeners for every product come first
   1. GIVEN App developer has listeners for every product
   2. GIVEN listeners for this one
      1. WHEN the service gathers listeners
         1. THEN the listeners for every product come first
2. Locked pages refuse listeners
   1. GIVEN App developer has a page that refuses new globals
      1. WHEN I add a snapshot listener
         1. THEN the call returns false
3. Page listeners keep their order
   1. GIVEN App developer has a service or a page script
      1. WHEN it adds several listeners for one or every product
         1. THEN each listener is stored on the page in order
