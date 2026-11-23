# 0141 Beacon Requests

## Why

With the beacon plugin, my own collector receives every event, even one published as the page closes.

## Measurement

events that reach the collector as one JSON request

-

events published with the beacon plugin

## Requirements

- 0141.1
  - Given App developer has the beacon plugin with a collector URL, on a page that supports beacons
    - When I publish a key to my collector
      - Then the browser queues one beacon to my URL, holding the event snapshot as JSON
- 0141.2
  - Given App developer has the beacon plugin on a page whose beacon queue is full
    - When the browser refuses the beacon
      - Then the plugin posts the same JSON to my URL with a keepalive request
- 0141.3
  - Given App developer has the beacon plugin in a runtime with no beacon support
    - When I publish a key without beacon support
      - Then the plugin posts the JSON to my URL with a keepalive request
- 0141.4
  - Given App developer has the beacon plugin and a collector that cannot be reached
    - When the keepalive request fails
      - Then the publish reports failure and nothing is thrown into my app
- 0141.5
  - Given App developer has the beacon plugin in a runtime with neither beacons nor requests
    - When Stratum checks the collector destination
      - Then Stratum reports the collector destination unavailable
