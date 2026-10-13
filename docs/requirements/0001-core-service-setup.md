---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0001 Service Setup

## Why

I install one package, construct one service for my app, and it knows my product before I publish anything.

## Measurement

apps whose service reports the product it was built for
-
apps that construct a service

Source: `src/service.ts:74`

## Requirements

- 0001.1
    - Given App developer has installed the package
        - When I import the core and one plugin entry point
            - Then both load without the other plugins
- 0001.2
    - Given App developer has a product name and version
        - When I construct the service with them
            - Then it reports them with the library version
- 0001.3
    - Given App developer passes no catalog or plugins
        - When I construct the service
            - Then it holds no catalogs, plugins or publishers
