# 0001 Install and Construct

## Why

I install one package and construct one service for my app. It knows my product and the browser session before I publish anything.

## Measurement

apps whose service reports the product and session it was built for

-

apps that construct a service

## Requirements

1. Core and plugin entry points load apart
   1. GIVEN App developer has installed the package
   2. GIVEN the package has one entry point per bundled plugin
      1. WHEN I import the core and one plugin entry point
         1. THEN both load without the other plugins
2. Service reports product and library
   1. GIVEN App developer has a product name and version
      1. WHEN I construct the service with them
         1. THEN the service reports the product name and version with the library version
3. Bare service holds nothing
   1. GIVEN App developer passes no catalog or plugins
      1. WHEN I construct the service
         1. THEN the service holds no catalogs
         2. THEN plugins
         3. THEN publishers or listeners
4. New tab gets a stored session ID
   1. GIVEN App developer has a tab with no stored session ID
      1. WHEN I construct services one after another
         1. THEN each creates a new random session ID and stores it for the tab
5. Stored session ID is reused
   1. GIVEN App developer has a tab with a stored session ID
      1. WHEN I construct a service in that tab
         1. THEN the service uses that stored ID
6. Blocked session storage still gives an ID
   1. GIVEN App developer has a page that blocks session storage
      1. WHEN the service starts
         1. THEN the service still gets a random session ID
7. Missing crypto gives a zero ID
   1. GIVEN App developer has a page with no crypto library
      1. WHEN the service creates a session ID
         1. THEN the ID is all zeros
8. Build metadata stays out of the version
   1. GIVEN App developer installs a package whose version carries build metadata
      1. WHEN the library is built
         1. THEN the built library reports its version without that metadata
