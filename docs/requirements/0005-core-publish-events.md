---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0005 Publish Events by Key

## Why

One call with a catalog key sends the standard event for that item, and the call tells me whether it reached every destination.

## Measurement

publish calls that resolve true only when every destination got the event
-
publish calls

Source: `src/service.ts:171`

## Requirements

- 0005.1
    - Given App developer has a default catalog and a snapshot listener
        - When I publish a key from it
            - Then the listener gets one event with the item, product and session
- 0005.2
    - Given App developer has a catalog added after construction
        - When I publish a key through that catalog
            - Then the listener gets the event with that catalog's ID and the key
- 0005.3
    - Given App developer names a missing catalog or key, or a destination is missing
        - When I publish
            - Then the call resolves false and logs why in debug mode
- 0005.4
    - Given App developer has an item with a placeholder in a nested field
        - When I publish it with a replacement value
            - Then the event carries the value in that field
- 0005.5
    - Given App developer has an item with a placeholder
        - When I publish it with a replacement function
            - Then the event carries what the function returns
- 0005.6
    - Given App developer passes event data that refers to itself
        - When the event is copied for each destination
            - Then the loop is marked as circular and the copy succeeds
