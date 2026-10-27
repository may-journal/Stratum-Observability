### 2026.10.25.1630

- build(deps): Require `@biomejs/biome` 2.6.3 or later, and drop the Markdown formatter switch-off and the single-quote YAML style from `biome.jsonc`.
- build(biome): Turn on Markdown front matter parsing, so `---` blocks format as YAML and never as headings.
- docs(markdown): Format every Markdown and YAML file with Biome, after setting each Measurement's `-` apart and nesting requirement chains two spaces deep.
