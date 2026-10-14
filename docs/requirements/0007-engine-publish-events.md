---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0007 Publish Events by Key

## Why

One call with a catalog key sends the standard event for that item, and the call tells me whether it reached every destination.

## Measurement

publish calls that resolve true only when every destination got the event
-
publish calls

Source: `src/service.ts:171`

## Requirements

- 0007.1
    - Given App developer has a default catalog and a snapshot listener
        - When I publish a key from it
            - Then the listener gets one event with the item, product and session
- 0007.2
    - Given App developer has a catalog added after construction
        - When I publish a key through that catalog
            - Then the listener gets the event with that catalog's ID and the key
- 0007.3
    - Given App developer names a missing catalog or key, or a destination is missing
        - When I publish
            - Then the call resolves false and logs why in debug mode
- 0007.4
    - Given App developer has an item with a placeholder, also in a nested field
        - When I publish it with a replacement value or function
            - Then the event carries the value or what the function returns
- 0007.5
    - Given App developer passes event data that refers to itself
        - When the event is copied for each destination
            - Then the loop is marked as circular and the copy succeeds
- 0007.6
    - Given App developer changes plugin context or ends an A/B test right after a publish
        - When that event is delivered
            - Then it carries the context and A/B tests from the moment of publishing
- 0007.7
    - Given Plugin author has a publisher that no plugin registered
        - When I build an event snapshot for it
            - Then the snapshot holds no plugin data
- 0007.8
    - Given App developer has a null value or a list
        - When I run placeholder replacement on it
            - Then it returns and leaves the value unchanged
