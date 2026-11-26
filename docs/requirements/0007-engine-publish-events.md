# 0007 Publish Events by Key

## Why

One call with a catalog key sends the standard event for that item, and the call tells me whether it reached every destination.

## Measurement

publish calls that resolve true only when every destination got the event

-

publish calls

## Requirements

1. Publishing reaches listeners
   1. GIVEN App developer has a default catalog
   2. GIVEN or one added after construction
   3. GIVEN a snapshot listener
      1. WHEN I publish a key from it and through the service or the catalog
         1. THEN the listener gets one event with the item
         2. THEN product
         3. THEN session
         4. THEN catalog ID and key
2. Removed in 2026.11.26.1135: never held
3. Failed publishes resolve false
   1. GIVEN App developer names a missing catalog or key
   2. GIVEN or a destination is missing
      1. WHEN I publish
         1. THEN the call resolves false and logs why in debug mode
4. Placeholders take replacements
   1. GIVEN App developer has an item with a placeholder
   2. GIVEN also in a nested field
      1. WHEN I publish it with a replacement value or function
         1. THEN the event carries the value
         2. THEN or what the function returns for that event
5. Circular data is copied
   1. GIVEN App developer passes event data that refers to itself
      1. WHEN the event is copied for each destination
         1. THEN the loop is marked as circular and the copy succeeds
6. Events keep their publish time state
   1. GIVEN App developer changes plugin context or ends an A/B test right after a publish
      1. WHEN that event is delivered
         1. THEN the event carries the context and A/B tests from the moment of publishing
7. Unregistered publishers get no plugin data
   1. GIVEN Plugin author has a publisher that no plugin registered
      1. WHEN I build an event snapshot for it
         1. THEN the snapshot holds no plugin data
8. Plain values pass through replacement
   1. GIVEN App developer has a null value or a list
      1. WHEN I run placeholder replacement on it
         1. THEN replacement returns and leaves the value unchanged
9. Throwing publishers resolve false
   1. GIVEN Plugin author has a publisher that throws while publishing
      1. WHEN I publish a key
         1. THEN the call resolves false and logs why in debug mode
