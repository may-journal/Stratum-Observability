# 0003 Catalog Identity and Changes

## Why

Each catalog has an ID I can predict, and I can add items or remove catalogs while the app runs.

## Measurement

run-time catalog changes that publishing reflects

-

run-time catalog changes

## Requirements

1. Late catalogs take their component identity
   1. GIVEN App developer has a catalog with a component name and versions
      1. WHEN I add the catalog after construction
         1. THEN the catalog's ID and metadata come from that component and its items use the plugin's event types
2. Catalog ID follows the most specific name
   1. GIVEN App developer gives some
   2. GIVEN all or none of the component name and versions
      1. WHEN I register a catalog with them
         1. THEN the catalog ID is the component name
         2. THEN or product
         3. THEN the most specific version
3. Same ID catalogs merge
   1. GIVEN App developer has a catalog already registered under an ID
      1. WHEN I add another catalog that resolves to the same ID
         1. THEN the new catalog's items join the existing catalog
4. New items publish
   1. GIVEN App developer has a registered catalog
      1. WHEN I add new well-formed items to it
         1. THEN I can publish the new keys
5. Repeat errors accumulate
   1. GIVEN App developer has an item that already failed validation
      1. WHEN I add the same malformed item again
         1. THEN the item's new errors join the old ones
6. Repaired catalogs turn valid
   1. GIVEN App developer has an invalid catalog
      1. WHEN I add well-formed items under the failed keys
         1. THEN the catalog turns valid again
7. Deleted catalogs stop publishing
   1. GIVEN App developer has registered catalogs
      1. WHEN I remove one by ID
         1. THEN publishing from the removed catalog resolves false
8. Unknown IDs remove nothing
   1. GIVEN App developer has an ID no catalog uses
      1. WHEN I remove a catalog by that ID
         1. THEN every registered catalog stays
