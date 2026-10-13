---
# The changelog check folds this entry into CHANGELOG.md
fitnessFunctions: ['changelog']
---

### 2026.10.14.1829

- docs(changelog): Restructure the upstream v2.0.0 history into dated sections of 3 to 5 typed bullets, keeping every entry.
- docs(changelog): Add changelog entry files, so each pull request writes its own file and only the release writes CHANGELOG.md.
- build(release): Stamp the package and lock version with the newest changelog timestamp as build metadata.
