---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0010 Global Plugins

## Why

A script on my page can add a plugin before my app starts, and every service picks it up.

## Measurement

services that register the page's global plugins
-
services constructed on a page with global plugins

Source: `src/utils/global-plugins.ts:19`

## Requirements

- 0010.1
    - Given App developer has a page with a global plugin
        - When I construct the service with its own plugins
            - Then the global plugin's publisher is registered after them
- 0010.2
    - Given App developer has a page with no Stratum globals
        - When a script adds a global plugin
            - Then the page lists that one plugin
- 0010.3
    - Given App developer has a page with an empty or filled global plugin list
        - When a script adds another global plugin
            - Then it is added to the end of the list
- 0010.4
    - Given App developer has global plugins on the page
        - When a script removes a plugin by name
            - Then only a plugin with that name leaves the list
- 0010.5
    - Given App developer has a page with no Stratum globals
        - When a script removes a global plugin
            - Then the call returns an empty list
