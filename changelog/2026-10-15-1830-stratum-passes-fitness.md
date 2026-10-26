---
# The changelog check folds this entry into CHANGELOG.md
fitnessFunctions: ["changelog"]
---

### 2026.10.15.1830

- docs(changelog): Restructure the upstream history into dated typed sections, and add entry files so only the release writes CHANGELOG.md.
- build(release): Inject only the semver core as the library version, so build metadata stays out of event telemetry.
- docs(markdown): Add front matter, rewrite emphasis and long prose, and explain every gitignore pattern with a comment.
- build(deps): Bump vitest and @vitest/coverage-v8 to 5.0.5, jsdom to 30.1.3 and rollup to 4.64.7.
- ci(fitness): Add the synced Fitness hooks, else husky hooks or a notice, the external-policy suite, and plan-check, close-check and auto-merge-on-ready workflows.
