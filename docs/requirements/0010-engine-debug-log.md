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
   2. GIVEN then on
      1. WHEN Stratum writes a debug line
         1. THEN the console shows the line
         2. THEN marked as Stratum
         3. THEN only while the flag is on
2. Blocked storage turns debug off
   1. GIVEN App developer has a page that blocks session storage
      1. WHEN Stratum checks for debug mode
         1. THEN debug mode is off and nothing fails
3. Own logger gets the lines
   1. GIVEN App developer passes a logger of their own to the service
   2. GIVEN the debug flag is off
      1. WHEN Stratum writes a debug line for that service
         1. THEN my logger receives the line
         2. THEN the console stays quiet
4. Throwing logger is contained
   1. GIVEN App developer passes a logger that throws
      1. WHEN Stratum hands a debug line to the failing logger
         1. THEN publishing carries on and nothing is thrown into my app
