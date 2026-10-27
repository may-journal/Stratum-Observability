# Changelog

## Unreleased

### 2026.10.13.1808

- fix(service): Make publish resolve false and log the error when a publisher throws, instead of never settling.
- docs(architecture): Add the system context and containers views for the library and the host app it runs in.
- docs(architecture): Add the components view, giving each source under `src` one owner.
- docs(architecture): Add the code view and the app developer journey, with links to real source lines.

## v2.0.0

### 2026.05.12.1522

- build(lint): Integrate BiomeJS and resolve open findings.
- chore(deps): Remove `prettier`, `eslint`, `lint-staged` and related devDependencies.
- chore(deps): Remove `semver` and `shelljs` devDependencies.
- ci(scripts): Convert ci scripts to ESM.

### 2026.05.11.2200

- feat(catalog): Add catalog-level publishing via `catalog.publish(key)` with compile-time key safety.
- feat(plugin): Add a `PluginHooks` parameter on `onRegister`, exposing `hooks.addCatalog()` for plugin-owned catalogs.
- feat(catalog): Add `addItems()` on `RegisteredStratumCatalog` to add items after catalog creation.
- feat(catalog)!: Breaking: `addCatalog()` returns a `RegisteredStratumCatalog` instance instead of a catalog ID string.
- feat(catalog): Duplicate catalog IDs now merge items into the existing catalog instead of rejecting.
