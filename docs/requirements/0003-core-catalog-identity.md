---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0003 Catalog Identity

## Why

Each catalog has an ID and metadata I can predict, so I can publish from it by ID and query its events later.

## Measurement

catalogs whose ID comes from their component and version
-
catalogs registered

Source: `src/utils/catalog.ts:228`

## Requirements

- 0003.1
    - Given App developer has a catalog with a component name and versions
        - When I add the catalog after construction
            - Then its ID and metadata come from that component and its items use the plugin's event types
- 0003.2
    - Given App developer passes a catalog with no metadata to the constructor
        - When the service starts
            - Then that default catalog takes its ID and metadata from the product
- 0003.3
    - Given App developer has a catalog already registered under an ID
        - When I add another catalog that resolves to the same ID
            - Then its items join the existing catalog
- 0003.4
    - Given App developer gives some, all or none of the component name and versions
        - When I ask for the catalog ID
            - Then it is the component name, or product, and the most specific version
