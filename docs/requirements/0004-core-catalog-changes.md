---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0004 Catalog Changes at Run Time

## Why

I can add items to a catalog or remove a whole catalog while the app runs, and publishing follows at once.

## Measurement

run-time catalog changes that publishing reflects
-
run-time catalog changes

Source: `src/utils/catalog.ts:114`

## Requirements

- 0004.1
    - Given App developer has a registered catalog
        - When I add new well-formed items to it
            - Then I can publish the new keys
- 0004.2
    - Given App developer has a valid registered catalog
        - When I add malformed items to it
            - Then they are held back and the catalog turns invalid
- 0004.3
    - Given App developer has an item that already failed validation
        - When I add the same malformed item again
            - Then its new errors join the old ones
- 0004.4
    - Given App developer has an invalid catalog
        - When I add well-formed items under the failed keys
            - Then the catalog turns valid again
- 0004.5
    - Given App developer has registered catalogs
        - When I remove one by ID
            - Then publishing from it resolves false
- 0004.6
    - Given App developer has an ID no catalog uses
        - When I remove a catalog by that ID
            - Then every registered catalog stays
