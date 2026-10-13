---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0013 Browser Console Plugin

## Why

With the console plugin, I see every event in the browser's developer tools without any vendor account.

## Measurement

events logged as one console line
-
events published with the console plugin

Source: `src/plugins/browser-console/publisher.ts:46`

## Requirements

- 0013.1
    - Given App developer has the console plugin and a catalog
        - When I publish a key
            - Then the console shows one line with the event's type, ID and key
