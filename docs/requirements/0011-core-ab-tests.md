---
relatedConfigurations: ['../../vitest.config.mts']
---

# 0011 A/B Tests

## Why

The A/B tests running when I publish tag that event, so I can compare test groups in my observability tool.

## Measurement

events tagged with the A/B tests running at publish time
-
events published while A/B tests run

Source: `src/utils/ab-test-manager.ts:99`

## Requirements

- 0011.1
    - Given App developer has a service with no A/B tests
        - When I start an A/B test
            - Then the service lists it
- 0011.2
    - Given App developer has a running A/B test
        - When I end it
            - Then the service no longer lists it
- 0011.3
    - Given App developer has several running A/B tests
        - When I end all A/B tests
            - Then the service lists none
- 0011.4
    - Given App developer has one or more one-time A/B tests
        - When I pass them to a publish call
            - Then that event carries them and the service does not keep them
- 0011.5
    - Given App developer ends an A/B test right after a publish
        - When that event is delivered
            - Then it still carries the ended A/B test
