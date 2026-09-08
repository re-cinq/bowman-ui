# bowman-ui spec link placement

| Field  | Value                                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue  | re-cinq/bowman-ui#2, "Non-trailing spec test links in 10 newer specs; commit the placement validator and gate it in CI", which subsumes re-cinq/bowman-ui#7 on broken test links in spec.md |
| Status | In Progress                                                                                                                                                                                 |

The enforcement decision lives in docs/design-notes.md § Lint guardrails decision 10;
this file carries the placement rule, the script's contract, and the per-behaviour pins.

A `([validated by](../../tests/X.test.tsx#Lnn))` link counts as coverage only when it sits in
its statement's trailing parenthetical. Lore's spec-coverage job reports every other test link
as `non-trailing-link` and drops it, so a spec can read as fully cited while the coverage graph
records nothing - the defect regenerated twice before this gate existed. `npm run
check:spec-links` is the local counterpart of that job: it segments each spec exactly as lore
does and reports every test link that falls outside a trailing parenthetical.

## The rule

A statement is one list item, or one sentence of a paragraph - a list item spanning several
source lines is still one statement, and a paragraph of three sentences is three. Only the
parenthetical closing the statement counts.

- A citation mid-way through a list item is misplaced, and each one is reported separately
  against the item's own first line
  ([validated by](../../tests/check-spec-links.test.ts#L37)).
- A citation mid-way through a paragraph sentence is misplaced, and is reported against the
  line the paragraph starts on, not the line the link sits on
  ([validated by](../../tests/check-spec-links.test.ts#L44)).
- A citation closing its sentence is where the rule wants it and is never reported
  ([validated by](../../tests/check-spec-links.test.ts#L61)).
- A mid-sentence link to something other than a test file - a script, a doc - is prose, not a
  miscited test, and is never reported
  ([validated by](../../tests/check-spec-links.test.ts#L68)).
- A citation written inside backticks is documentation of the convention rather than a use of
  it, and is never reported ([validated by](../../tests/check-spec-links.test.ts#L75)).

## Where the segmentation comes from

Segmentation is not reimplemented here. `scripts/check-spec-links.mjs` imports
`segmentStatements` and `findMisplacedCoverageLinks` from
`@re-cinq/eslint-plugin-re-lint/spec/*.js`, the package's vendored copy of the pure domain
behind lore's verdict, so a local pass and an upstream pass cannot disagree about where a
statement begins or which parenthetical is the trailing one. A reimplementation would have had
to guess at that agreement, and the guess is the whole failure mode the gate exists to close.
Until 2026-09-08 the same files were byte-exact mirrors of lore's TypeScript under
`tools/lore-shared/`, loaded under `--experimental-strip-types` behind a resolve hook; the
package ships built JavaScript, so both are gone (docs/design-notes.md § Lint guardrails
decision 10).

## The script's contract

`npm run check:spec-links` runs `scripts/check-spec-links.mjs` on plain Node — the Node 22 that
`.nvmrc` and CI pin for development, above the package's `>=20.9.0` published floor.

- With no path arguments it scans every `specs/<slug>/spec.md` in sorted slug order followed by
  `.specify/spec.md`, which is exactly the list an explicit invocation of those paths produces
  ([validated by](../../tests/check-spec-links.test.ts#L143)).
- Each finding prints one line carrying the spec, the statement's line, the cited path with its
  `#L` anchor, and the words `cited outside the statement's trailing parenthetical`. A citation
  written with no `#L` anchor prints the path alone
  ([validated by](../../tests/check-spec-links.test.ts#L55)).
- The run closes with `misplaced: <N> across <M> specs (<S> statements scanned)` and exits 1
  when `N` is above zero ([validated by](../../tests/check-spec-links.test.ts#L88)).
- A spec whose citations all sit in trailing parentheticals exits 0 under the same summary line
  ([validated by](../../tests/check-spec-links.test.ts#L82)).
- `--json` replaces the report with an array alone, each entry carrying `spec`, `line`, `path`,
  `anchorLine`, `label` and `statement`
  ([validated by](../../tests/check-spec-links.test.ts#L95)).
- An unrecognised flag exits 2 with the usage line rather than scanning anything
  ([validated by](../../tests/check-spec-links.test.ts#L109)).
- A spec path that cannot be read exits 2 naming that path, so a typo is never reported as a
  clean run ([validated by](../../tests/check-spec-links.test.ts#L122)).

Paths are resolved against the repo root, not the working directory, because the script locates
the root from its own module URL and every reported path is printed root-relative.

- A relative path means the same spec from any working directory
  ([validated by](../../tests/check-spec-links.test.ts#L129)).
- An absolute path is accepted and reported root-relative
  ([validated by](../../tests/check-spec-links.test.ts#L136)).
- The usage line states both facts
  ([validated by](../../tests/check-spec-links.test.ts#L116)).

## CI

`.github/workflows/ci.yml` runs `npm run check:spec-links` as the `Spec link placement` step,
immediately after the `Spec anchor check` that guards the other half of the same convention:
that check asks whether an anchor still lands on the content it cited, this one asks whether the
citation is placed where it counts at all. A red check is fixed by moving the cited link to the
end of its statement, never by deleting it.

## Recorded decisions

- **Fixtures, not the repo's own specs.** The behavioural pins run against two invented specs
  under `tests/fixtures/spec-links/` rather than against `specs/`, so a sweep that fixes a real
  citation cannot turn a pin red. The one test that does read `specs/` asserts an equality
  between two runs rather than a count, so it survives every sweep too.
- **The test drives the script as a subprocess.** `tests/check-spec-links.test.ts` spawns
  `scripts/check-spec-links.mjs` exactly as the npm script does, following
  `tests/check-at-pass.test.ts`: exit codes and the exact stdout are the contract, and importing
  the module would test neither.
- **No autofix.** Moving a citation changes the sentence it belongs to, and choosing which
  statement a link was meant for is a judgement the script has no basis to make. It reports; a
  person moves the link.
