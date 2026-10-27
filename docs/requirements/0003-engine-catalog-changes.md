# 0003 Catalog Identity and Changes

## Why

Each catalog has an ID I can predict, and I can add items or remove catalogs while the app runs.

## Measurement

run-time catalog changes that publishing reflects

-

run-time catalog changes

## Requirements

- 0003.1
  - Given App developer has a catalog with a component name and versions
    - When I add the catalog after construction
      - Then its ID and metadata come from that component and its items use the plugin's event types
- 0003.2
  - Given App developer gives some, all or none of the component name and versions
    - When I register a catalog with them
      - Then its ID is the component name, or product, and the most specific version
- 0003.3
  - Given App developer has a catalog already registered under an ID
    - When I add another catalog that resolves to the same ID
      - Then its items join the existing catalog
- 0003.4
  - Given App developer has a registered catalog
    - When I add new well-formed items to it
      - Then I can publish the new keys
- 0003.5
  - Given App developer has an item that already failed validation
    - When I add the same malformed item again
      - Then its new errors join the old ones
- 0003.6
  - Given App developer has an invalid catalog
    - When I add well-formed items under the failed keys
      - Then the catalog turns valid again
- 0003.7
  - Given App developer has registered catalogs
    - When I remove one by ID
      - Then publishing from it resolves false
- 0003.8
  - Given App developer has an ID no catalog uses
    - When I remove a catalog by that ID
      - Then every registered catalog stays
