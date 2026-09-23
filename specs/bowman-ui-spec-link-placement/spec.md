# bowman-ui spec link placement

| Field  | Value                                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue  | re-cinq/bowman-ui#2, "Non-trailing spec test links in 10 newer specs; commit the placement validator and gate it in CI", which subsumes re-cinq/bowman-ui#7 on broken test links in spec.md |
| Status | In Progress                                                                                                                                                                                 |

The enforcement decision lives in docs/design-notes.md § Lint guardrails decision 10;
this file carries the placement rule, the scripts' contracts, and the per-behaviour pins.

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
  ([validated by a list item with two mid-item citations reports both at the item's line](../../tests/check-spec-links.test.ts#L37)).
- A citation mid-way through a paragraph sentence is misplaced, and is reported against the
  line the paragraph starts on, not the line the link sits on
  ([validated by a mid-sentence citation in a paragraph reports one finding at the paragraph's line](../../tests/check-spec-links.test.ts#L44)).
- A citation closing its sentence is where the rule wants it and is never reported
  ([validated by a paragraph sentence whose citation is trailing reports nothing](../../tests/check-spec-links.test.ts#L61)).
- A mid-sentence link to something other than a test file - a script, a doc - is prose, not a
  miscited test, and is never reported
  ([validated by a mid-sentence link to a script rather than a test reports nothing](../../tests/check-spec-links.test.ts#L68)).
- A citation written inside backticks is documentation of the convention rather than a use of
  it, and is never reported ([validated by a citation written inside backticks reports nothing](../../tests/check-spec-links.test.ts#L75)).

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
  ([validated by no spec paths scans the sorted specs directories plus .specify/spec.md](../../tests/check-spec-links.test.ts#L143)).
- Each finding prints one line carrying the spec, the statement's line, the cited path with its
  `#L` anchor, and the words `cited outside the statement's trailing parenthetical`. A citation
  written with no `#L` anchor prints the path alone
  ([validated by a citation with no #L anchor is reported with the path alone](../../tests/check-spec-links.test.ts#L55)).
- The run closes with `misplaced: <N> across <M> specs (<S> statements scanned)` and exits 1
  when `N` is above zero ([validated by a spec with misplaced citations exits 1 and summarises findings, specs and statements](../../tests/check-spec-links.test.ts#L88)).
- A spec whose citations all sit in trailing parentheticals exits 0 under the same summary line
  ([validated by a spec citing only in trailing parentheticals exits 0 with a zero summary](../../tests/check-spec-links.test.ts#L82)).
- `--json` replaces the report with an array alone, each entry carrying `spec`, `line`, `path`,
  `anchorLine`, `label` and `statement`
  ([validated by --json prints only an array of findings carrying every reported field](../../tests/check-spec-links.test.ts#L95)).
- An unrecognised flag exits 2 with the usage line rather than scanning anything
  ([validated by an unknown flag exits 2 with the usage line](../../tests/check-spec-links.test.ts#L109)).
- A spec path that cannot be read exits 2 naming that path, so a typo is never reported as a
  clean run ([validated by a spec path that cannot be read exits 2 naming the path](../../tests/check-spec-links.test.ts#L122)).

Paths are resolved against the repo root, not the working directory, because the script locates
the root from its own module URL and every reported path is printed root-relative.

- A relative path means the same spec from any working directory
  ([validated by a relative spec path resolves against the repo root, not the working directory](../../tests/check-spec-links.test.ts#L129)).
- An absolute path is accepted and reported root-relative
  ([validated by an absolute spec path is scanned and reported repo-relative](../../tests/check-spec-links.test.ts#L136)).
- The usage line states both facts
  ([validated by the usage line says paths resolve against the repo root](../../tests/check-spec-links.test.ts#L116)).

## Re-anchoring

Placement asks whether a citation counts; `npm run reanchor` (`scripts/reanchor-spec-links.mjs`)
keeps a counted citation on the line it cites once the cited file moves under it. It walks
every `specs/<slug>/spec.md`, `.specify/spec.md` and `adrs/*.md`, and its baseline is the merge
base of `origin/main` (or the ref given) and `HEAD` (docs/design-notes.md § Lint guardrails
decision 14).

- A link labelled `[validated by <test title>]` moves to the line of the one `it()` or `test()`
  carrying that title when lines are inserted above the test
  ([validated by moves a titled link from L5 to its test declaration on L7 when two lines are inserted above](../../tests/reanchor-spec-links.test.ts#L99)).
- It moves to that declaration too when the cited assertion itself is rewritten
  ([validated by moves a titled link from L3 to its test declaration on L5 when its cited assertion is rewritten in place](../../tests/reanchor-spec-links.test.ts#L110)).
- A titled link on a line inside its test's body is mapped through the diff hunks and stays on
  that line when it is still inside the test
  ([validated by maps a titled link on the L3 assertion to the L5 assertion when two lines are inserted above](../../tests/reanchor-spec-links.test.ts#L132)).
- A titled link already inside its test's span stays where it is
  ([validated by keeps a titled link on L3 that already lies inside the span of its test](../../tests/reanchor-spec-links.test.ts#L141)).
- A title two tests carry is reported and exits 1
  ([validated by reports a title two tests carry and exits 1](../../tests/reanchor-spec-links.test.ts#L335)).
- Every other link is paired with its copy in the merge base's markdown and mapped through the
  cited file's `git diff -U0` hunks, in feature specs, the system spec and ADRs alike
  ([validated by maps untitled links on L6 and L3 to L8 and L5 in a spec, the system spec and an ADR](../../tests/reanchor-spec-links.test.ts#L151)).
- A titled link whose title no test in the cited file carries is reported, rewrites nothing and
  exits 1 in both modes
  ([validated by reports a titled link whose title no test carries and exits 1 in both modes, rewriting nothing](../../tests/reanchor-spec-links.test.ts#L173)).
- A link into a file that is not a test, such as a README line, is mapped through the hunks
  whatever its label says
  ([validated by maps a link into README.md, titled or not, from L2 to L3 through the hunks](../../tests/reanchor-spec-links.test.ts#L295)).
- A link whose cited line the branch deleted is reported, rewrites nothing and exits 1 in both
  modes ([validated by reports an untitled link on a deleted line and exits 1 in both modes, rewriting nothing](../../tests/reanchor-spec-links.test.ts#L186)).
- A cited line rewritten in place is reported the same way, because no line number maps to it
  ([validated by reports an untitled link whose cited line was rewritten in place](../../tests/reanchor-spec-links.test.ts#L199)).
- A link whose href the branch edited by hand has no base anchor to map from and is kept as
  authored ([validated by keeps a link whose href this branch edited by hand as authored](../../tests/reanchor-spec-links.test.ts#L209)).
- A link the branch added is kept as authored, and the links around it still map
  ([validated by keeps a link this branch added above as authored and still maps L6 below it to L8](../../tests/reanchor-spec-links.test.ts#L220)).
- A statement the branch reworded keeps its link paired with the merge-base copy
  ([validated by maps a link on a statement this branch reworded, L6 to L8](../../tests/reanchor-spec-links.test.ts#L236)).
- A second run against the same merge base changes nothing, because the pairing reads the
  merge-base markdown rather than the working copy
  ([validated by a second run against the same merge base changes nothing](../../tests/reanchor-spec-links.test.ts#L248)).
- `--check` rewrites nothing and exits 1 naming each link that would move, and exits 0 once a
  plain run has healed them
  ([validated by --check exits 1 naming a stale link and rewrites nothing, then exits 0 after a run](../../tests/reanchor-spec-links.test.ts#L261)).
- Only links into files the branch changed are re-anchored, and `--all` extends the title
  lookup to every link
  ([validated by leaves a titled link into a test file this branch did not change alone, and --all moves it](../../tests/reanchor-spec-links.test.ts#L280)).
- A bare `[Lnnn]` label follows its href when the href moves
  ([validated by an L6 line label follows its href to L8](../../tests/reanchor-spec-links.test.ts#L309)).
- A bare `[Lnnn]` label that disagrees with its href fails `--check` and is synced by a plain
  run ([validated by an L9 line label on an L6 href fails --check as mislabelled and a run syncs it to L6](../../tests/reanchor-spec-links.test.ts#L319)).
- In either mode and whatever the scope, an anchor on a blank or closing line, past the end of
  its file, or into a missing file is rotten and exits 1
  ([validated by an anchor on a blank line or into a missing file is rotten in both modes](../../tests/reanchor-spec-links.test.ts#L349)).
- A fragment that is not a line number, and a web URL, are never touched
  ([validated by leaves a link whose fragment is not a line number, and a web URL, untouched](../../tests/reanchor-spec-links.test.ts#L369)).
- During an uncommitted merge the baseline includes `MERGE_HEAD`, so links the merged side already
  moved are mapped only through this branch's own shift
  ([validated by maps L6, an L6 label and setup L3 to L9, L9 and L5 during an uncommitted merge of main](../../tests/reanchor-spec-links.test.ts#L382)).
- The base ref defaults to `origin/main`
  ([validated by defaults the base ref to origin/main](../../tests/reanchor-spec-links.test.ts#L407)).
- An unknown flag or a second base ref exits 2 with the usage line
  ([validated by an unknown flag or a second base ref exits 2 with usage](../../tests/reanchor-spec-links.test.ts#L422)).
- A base ref that does not resolve exits 2 naming the ref
  ([validated by an unknown base ref exits 2 naming the ref](../../tests/reanchor-spec-links.test.ts#L429)).

## CI

`.github/workflows/ci.yml` runs `npm run check:spec-links` as the `Spec link placement` step,
immediately after the `Spec anchor check` (`npm run reanchor:check`) that guards the other half
of the same convention:
that check asks whether an anchor still lands on the line it cited, this one asks whether the
citation is placed where it counts at all. A red placement check is fixed by moving the cited
link to the end of its statement, never by deleting it; a red anchor check is fixed by running
`npm run reanchor` and committing the result.

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
