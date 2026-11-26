### 2026.11.26.1135

> The requirement docs read as numbered all-caps Gherkin with their wording unchanged, so `requirements` keeps passing now that it fails bullet acceptances.

- Docs: convert every requirement doc to numbered acceptances with GIVEN, WHEN and THEN items and each comma split into its own item.
- Docs: retire the empty 0007.2 as a `Removed` line.
- Build: bump `@biomejs/biome`, `@types/node`, `vitest` and `@vitest/coverage-v8` with the transitive packages they bring.
