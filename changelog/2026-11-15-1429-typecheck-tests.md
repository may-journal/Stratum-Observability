### 2026.11.15.1429

> The source and the tests now type-check cleanly, and the Lint job runs `npm run typecheck` so they stay that way.

- Build: add the `typecheck` script for `src` and `tests`, a Lint job step that runs it, and `@types/node` for the tests' `node:` imports.
- Fix: the public `EventOptions.abTestSchemas` type accepts registered A/B tests and lists mixing them with schemas, as publishing already did.
- Test: the version test builds the library in memory from the real Rollup config, found relative to the test file.
- Test: the invalid sample catalog marks each wrong entry with `@ts-expect-error`, and the helpers and replacement cases carry real types instead of casts.
- Docs: requirements 0001.8 and 0007.4 sharpen their Then wording to match what the tests prove.
