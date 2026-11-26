# 0009 A/B Tests

## Why

The A/B tests running when I publish tag that event, so I can compare test groups in my observability tool.

## Measurement

events tagged with the A/B tests running at publish time

-

events published while A/B tests run

## Requirements

1. Started tests are listed
   1. GIVEN App developer has a service with no A/B tests
      1. WHEN I start an A/B test
         1. THEN the service lists the started test
2. Ended tests are unlisted
   1. GIVEN App developer has one or several running A/B tests
      1. WHEN I end one or end all of them
         1. THEN the service no longer lists the ended tests
3. Single use tests are not kept
   1. GIVEN App developer has one or more one-time A/B tests
      1. WHEN I pass them to a publish call
         1. THEN that event carries them and the service does not keep them
