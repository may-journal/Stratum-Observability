# 0101 Browser Console Output

## Why

With the console plugin, I see every event in the browser's developer tools without any vendor account.

## Measurement

events logged as one console line

-

events published with the console plugin

## Requirements

1. Console shows one line per event
   1. GIVEN App developer has the console plugin and a catalog
      1. WHEN I publish a key
         1. THEN the console shows one line
         2. THEN naming the plugin
         3. THEN with the event's type
         4. THEN ID and key
