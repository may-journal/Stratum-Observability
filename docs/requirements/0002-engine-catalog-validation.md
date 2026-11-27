# 0002 Catalog Validation

## Why

Only well-formed catalog items can be published, and each bad item tells me what is wrong with it.

## Measurement

malformed catalog items held back with an error

-

malformed catalog items registered

## Requirements

1. Valid items publish
   1. GIVEN App developer has a catalog of well-formed items
      1. WHEN I register the catalog
         1. THEN the catalog is valid
         2. THEN every item can be published
2. Items default to their key
   1. GIVEN App developer has an item with no ID
      1. WHEN I register its catalog
         1. THEN the item uses its key as its ID
3. Faulty items are held back
   1. GIVEN App developer has items with an unknown type
   2. GIVEN missing fields or a reused ID
      1. WHEN I register them in a new catalog or add them to a valid one
         1. THEN each item is held back with one error
         2. THEN the catalog is invalid
4. Invalid IDs are held back
   1. GIVEN App developer has an item whose ID is negative
   2. GIVEN empty or not a number or text
      1. WHEN I register its catalog
         1. THEN the item is held back as having an invalid ID
5. Unexpected formats are held back
   1. GIVEN App developer has an item that is not a plain object
      1. WHEN I register its catalog
         1. THEN the item is held back as having an unexpected format
6. Debug line reports held back items
   1. GIVEN App developer has debug mode on
   2. GIVEN a catalog with malformed items
      1. WHEN I register the catalog
         1. THEN one debug line names the count held back
         2. THEN the debug line names the keys held back
