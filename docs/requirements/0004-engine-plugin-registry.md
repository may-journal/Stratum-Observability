# 0004 Plugin Registry

## Why

A plugin I write with the base classes adds event types and destinations without any change to the core.

## Measurement

plugins whose event types and publishers join publishing

-

plugins registered

## Requirements

1. Late plugins register
   1. GIVEN Plugin author has a plugin with event types
   2. GIVEN a publisher
      1. WHEN the app adds it after construction
         1. THEN the plugin's event types validate items
         2. THEN its publisher gets events
2. Duplicate names keep the first
   1. GIVEN App developer has two plugins with the same name
      1. WHEN I pass both to the service
         1. THEN only the first plugin is registered
         2. THEN only the first plugin's publisher is registered
3. Event types keep their first owner
   1. GIVEN Plugin author has a plugin declaring an event type another plugin owns
      1. WHEN the app adds it
         1. THEN the first plugin keeps the type
         2. THEN a debug line says why
4. Publishers accept chosen event types
   1. GIVEN Plugin author has a publisher that accepts another plugin's event types
      1. WHEN the app publishes one of those events
         1. THEN that publisher gets the event with its plugin's options
5. Publishers default to their own types
   1. GIVEN Plugin author has a publisher that names no accepted event types
      1. WHEN the plugin is registered
         1. THEN the publisher accepts only its own plugin's event types
6. Plugin catalogs reach listeners
   1. GIVEN Plugin author has a plugin that adds a catalog on registration
      1. WHEN it publishes from that catalog
         1. THEN the snapshot listener gets the event
7. Loose publishers accept every event
   1. GIVEN Plugin author has a publisher outside any plugin that names no accepted event types
      1. WHEN I ask whether it handles an event
         1. THEN the publisher accepts every event
