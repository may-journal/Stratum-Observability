---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0009 Session ID

## Why

Every event in one browser session carries the same session ID, so I can follow a visit across events.

## Measurement

services that reuse the session ID stored for the tab
-
services constructed in a tab with a stored session ID

Source: `src/utils/env.ts:74`

## Requirements

- 0009.1
    - Given App developer has a tab with no stored session ID
        - When I construct the service
            - Then it creates a random session ID and stores it for the tab
- 0009.2
    - Given App developer has a tab with a stored session ID
        - When I construct the service
            - Then the service uses that stored ID
- 0009.3
    - Given App developer has a page that blocks session storage
        - When the service starts
            - Then it still gets a random session ID
- 0009.4
    - Given App developer has a page with no crypto library
        - When the service creates a session ID
            - Then the ID is all zeros
