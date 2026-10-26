---
relatedConfigurations: ["../../vitest.config.mts"]
---

# 0001 Install and Construct

## Why

I install one package and construct one service for my app. It knows my product and the browser session before I publish anything.

## Measurement

apps whose service reports the product and session it was built for

-

apps that construct a service

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
      - Then it holds no catalogs, plugins, publishers or listeners
- 0001.4
  - Given App developer has a tab with no stored session ID
    - When I construct services one after another
      - Then each creates a new random session ID and stores it for the tab
- 0001.5
  - Given App developer has a tab with a stored session ID
    - When I construct a service in that tab
      - Then the service uses that stored ID
- 0001.6
  - Given App developer has a page that blocks session storage
    - When the service starts
      - Then it still gets a random session ID
- 0001.7
  - Given App developer has a page with no crypto library
    - When the service creates a session ID
      - Then the ID is all zeros
- 0001.8
  - Given App developer installs a package whose version carries build metadata
    - When the library is built
      - Then the library version it reports is the version without that metadata
