# 0005 Global Plugins

## Why

A script on my page can add a plugin before my app starts, and every service picks it up.

## Measurement

services that register the page's global plugins

-

services constructed on a page with global plugins

## Requirements

1. Global plugins register last
   1. GIVEN App developer has a page with a global plugin
      1. WHEN I construct the service with its own plugins
         1. THEN the global plugin's publisher is registered after them
2. Global plugins append
   1. GIVEN App developer has a page with no
   2. GIVEN empty or filled global plugin list
      1. WHEN a script adds a global plugin
         1. THEN the plugin is added to the end of the list
3. Removal matches by name
   1. GIVEN App developer has global plugins on the page
      1. WHEN a script removes a plugin by name
         1. THEN only a plugin with that name leaves the list
4. Missing globals give an empty list
   1. GIVEN App developer has a page with no Stratum globals
      1. WHEN a script removes a global plugin
         1. THEN the call returns an empty list
