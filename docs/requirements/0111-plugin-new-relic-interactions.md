# 0111 New Relic Interactions

## Why

With the New Relic plugin, each event lands in New Relic as one interaction I can query by Stratum's attributes.

## Measurement

events saved as one New Relic interaction

-

events published with the New Relic plugin on a page running the agent

## Requirements

1. Events save as interactions
   1. GIVEN App developer has the New Relic plugin
   2. GIVEN a running A/B test
   3. GIVEN the agent on the page
      1. WHEN I publish a key with a name replacement
         1. THEN New Relic saves one interaction with that name
         2. THEN the interaction carries Stratum's attributes
2. Valid events save as valid
   1. GIVEN App developer has the New Relic plugin
      1. WHEN I publish with plugin data marking the event valid
         1. THEN the interaction is saved as valid
3. Other plugin context joins the interaction
   1. GIVEN Plugin author has a plugin with context
   2. GIVEN next to the New Relic plugin
      1. WHEN the app publishes an event
         1. THEN the interaction carries that plugin's prefixed context
4. Missing windows report unavailable
   1. GIVEN App developer has the New Relic plugin outside a browser window
      1. WHEN Stratum checks the New Relic destination
         1. THEN Stratum reports the New Relic destination unavailable
