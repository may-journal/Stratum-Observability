# 0002 Catalog Validation

## Why

Only well-formed catalog items can be published, and each bad item tells me what is wrong with it.

## Measurement

malformed catalog items held back with an error

-

malformed catalog items registered

## Requirements

- 0002.1
  - Given App developer has a catalog of well-formed items
    - When I register the catalog
      - Then the catalog is valid and every item can be published
- 0002.2
  - Given App developer has an item with no ID
    - When I register its catalog
      - Then the item uses its key as its ID
- 0002.3
  - Given App developer has items with an unknown type, missing fields or a reused ID
    - When I register them in a new catalog or add them to a valid one
      - Then each is held back with one error and the catalog is invalid
- 0002.4
  - Given App developer has an item whose ID is negative, empty or not a number or text
    - When I register its catalog
      - Then the item is held back as having an invalid ID
- 0002.5
  - Given App developer has an item that is not a plain object
    - When I register its catalog
      - Then the item is held back as having an unexpected format
- 0002.6
  - Given App developer has debug mode on and a catalog with malformed items
    - When I register the catalog
      - Then one debug line names the count and keys held back
