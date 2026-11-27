# 0010 Debug Log

## Why

When I turn on debug mode for a tab, the console tells me why items were dropped or events were not sent.

## Measurement

debug lines shown only while the tab's debug flag is on

-

debug lines Stratum writes

## Requirements

1. Debug lines follow the flag
   1. GIVEN App developer has a tab with the debug flag off
   2. GIVEN the flag later on
      1. WHEN Stratum writes a debug line
         1. THEN the console shows the line
         2. THEN marked as Stratum
         3. THEN only while the flag is on
2. Blocked storage turns debug off
   1. GIVEN App developer has a page that blocks session storage
      1. WHEN Stratum checks for debug mode
         1. THEN debug mode is off
         2. THEN nothing fails
