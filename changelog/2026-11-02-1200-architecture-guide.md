### 2026.11.02.1200

- Docs: a new architecture guide at `docs/architecture/README.md` gives a reading order, a glossary, and a "Where to change X" table
- Docs: the code view adds publish and plugin registration sequence diagrams, and the user journey adds run-time catalog changes
- Docs: `README.md` and `CONTRIBUTING.md` link to the guide, and the views list the members they had left out
- Docs: the constructor comment in `src/service.ts` now says the constructor plugins register first, then any global plugins
- build(deps): update the dev dependencies Vitest and `@vitest/coverage-v8` to 5.1.0 so dependency-currency passes
