# 0008 Snapshot Listeners

## Why

Scripts on my page can watch every event without writing a plugin.

## Measurement

published events each listener receives

-

published events

## Requirements

- 0008.1
  - Given App developer has listeners for every product and for this one
    - When the service gathers listeners
      - Then the ones for every product come first
- 0008.2
  - Given App developer has a page that refuses new globals
    - When I add a snapshot listener
      - Then the call returns false
- 0008.3
  - Given App developer has a service or a page script
    - When it adds several listeners for one or every product
      - Then each listener is stored on the page in order
