# 0010 Debug Log

## Why

When I turn on debug mode for a tab, the console tells me why items were dropped or events were not sent.

## Measurement

debug lines shown only while the tab's debug flag is on

-

debug lines Stratum writes

## Requirements

- 0010.1
  - Given App developer has a tab with the debug flag off, then on
    - When Stratum writes a debug line
      - Then the console shows it, marked as Stratum, only while the flag is on
- 0010.2
  - Given App developer has a page that blocks session storage
    - When Stratum checks for debug mode
      - Then debug mode is off and nothing fails
