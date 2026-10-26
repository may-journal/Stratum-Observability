# 0009 A/B Tests

## Why

The A/B tests running when I publish tag that event, so I can compare test groups in my observability tool.

## Measurement

events tagged with the A/B tests running at publish time

-

events published while A/B tests run

Source: `src/utils/ab-test-manager.ts:99`

## Requirements

- 0009.1
  - Given App developer has a service with no A/B tests
    - When I start an A/B test
      - Then the service lists it
- 0009.2
  - Given App developer has one or several running A/B tests
    - When I end one or end all of them
      - Then the service no longer lists the ended tests
- 0009.3
  - Given App developer has one or more one-time A/B tests
    - When I pass them to a publish call
      - Then that event carries them and the service does not keep them
