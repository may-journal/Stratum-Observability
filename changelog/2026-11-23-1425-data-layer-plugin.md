### 2026.11.23.1425

> Teams that use a tag manager get every Stratum event in the page's data layer by adding one plugin.

- Feat: a `data-layer` plugin pushes one entry per published event onto the page's `dataLayer` array.
- Feat: the factory takes an optional array name, and the plugin creates the array when the page has none.
- Docs: requirement 0131, the README and the architecture views name the new plugin.
- Test: one test per acceptance of requirement 0131, with coverage still full.
