# 0131 Data Layer Entries

## Why

With the data layer plugin, my tag manager sees every event without a publisher of my own.

## Measurement

events pushed as one data layer entry

-

events published with the data layer plugin in a browser

## Requirements

1. Publishing adds a Stratum entry
   1. GIVEN App developer has the data layer plugin
   2. GIVEN a catalog
      1. WHEN I publish a key on a page that has a data layer
         1. THEN the data layer ends with one entry named for Stratum
         2. THEN the entry holds the event and my product
2. Missing data layer is created
   1. GIVEN App developer has the data layer plugin on a page with no data layer yet
      1. WHEN I publish a key before any data layer exists
         1. THEN the plugin creates the data layer and pushes the entry
3. Named array gets the entry
   1. GIVEN App developer has the data layer plugin set to another array name
      1. WHEN I publish a key after naming another array
         1. THEN the entry lands in the array I named
4. No window means unavailable
   1. GIVEN App developer has the data layer plugin outside a browser window
      1. WHEN Stratum checks the data layer destination
         1. THEN Stratum reports the data layer destination unavailable
