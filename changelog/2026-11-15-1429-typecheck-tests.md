### 2026.11.15.1429

> The shared test helpers now compile under the tests tsconfig.

- Build: add `@types/node` and load it in the tests tsconfig, for the `node:` imports.
- Test: the invalid sample catalog marks each wrong entry with `@ts-expect-error`, as the New Relic catalog does.
- Test: the catalog builder and the New Relic spies carry real types instead of casts.
