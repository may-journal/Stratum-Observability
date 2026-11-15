### 2026.11.15.1106

> Each test file now proves one requirement doc, with one test per acceptance.

- Test: each requirement doc has one file in `tests`, with one `describe` titled by the doc's ID and title.
- Test: each acceptance has exactly one `it`, titled by its ID and its Then, which now names its subject.
- Test: cases that `it.each` repeated now loop inside that one test, with soft assertions labelled by case, so every case runs.
- Test: the registry tests assert on the debug logger instead of letting Stratum print to stdout.
- Test: shared builders for the sample service, injector, catalog and item move to `tests/utils/helpers.ts`.
