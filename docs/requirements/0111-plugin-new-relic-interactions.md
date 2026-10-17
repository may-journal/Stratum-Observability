---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0111 New Relic Interactions

## Why

With the New Relic plugin, each event lands in New Relic as one interaction I can query by Stratum's attributes.

## Measurement

events saved as one New Relic interaction
-
events published with the New Relic plugin on a page running the agent

Source: `src/plugins/new-relic/publisher.ts:135`

## Requirements

- 0111.1
    - Given App developer has the New Relic plugin, a running A/B test and the agent on the page
        - When I publish a key with a name replacement
            - Then New Relic saves one interaction with that name and Stratum's attributes
- 0111.2
    - Given App developer has the New Relic plugin
        - When I publish with plugin data marking the event valid
            - Then the interaction is saved as valid
- 0111.3
    - Given Plugin author has a plugin with context, next to the New Relic plugin
        - When the app publishes an event
            - Then the interaction carries that plugin's prefixed context
- 0111.4
    - Given App developer has the New Relic plugin outside a browser window
        - When Stratum checks the New Relic destination
            - Then it reports the destination unavailable
