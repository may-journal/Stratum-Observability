# 0141 Beacon Requests

## Why

With the beacon plugin, my own collector receives every event, even one published as the page closes.

## Measurement

events that reach the collector as one JSON request

-

events published with the beacon plugin

## Requirements

1. Publishing queues a beacon
   1. GIVEN App developer has the beacon plugin with a collector URL
   2. GIVEN a page that supports beacons
      1. WHEN I publish a key to my collector
         1. THEN the browser queues one beacon to my URL
         2. THEN the beacon holds the event snapshot as JSON
2. Full queue falls back to keepalive
   1. GIVEN App developer has the beacon plugin on a page whose beacon queue is full
      1. WHEN the browser refuses the beacon
         1. THEN the plugin posts the same JSON to my URL with a keepalive request
3. No beacon support uses keepalive
   1. GIVEN App developer has the beacon plugin in a runtime with no beacon support
      1. WHEN I publish a key without beacon support
         1. THEN the plugin posts the JSON to my URL with a keepalive request
4. Unreachable collector fails quietly
   1. GIVEN App developer has the beacon plugin
   2. GIVEN a collector that cannot be reached
      1. WHEN the keepalive request fails
         1. THEN the publish reports failure and nothing is thrown into my app
5. No transport means unavailable
   1. GIVEN App developer has the beacon plugin in a runtime with neither beacons nor requests
      1. WHEN Stratum checks the collector destination
         1. THEN Stratum reports the collector destination unavailable
6. Error status fails the publish
   1. GIVEN App developer has the beacon plugin
   2. GIVEN a collector that answers with an error status
      1. WHEN the collector refuses the keepalive request
         1. THEN the publish reports failure for the refused event
