# bowman-ui labels convention

Issue: re-cinq/Otto#72 (`022-bowman-ui-labels-convention`). This issue ships the
convention, the helper, the enforcement, and the retrofit of the one string-carrying component
already in the repo - it adds no new component.

## What ships

- `src/labels.ts` -
  `resolveLabels<T extends object>(defaults: Required<T>, overrides?: Partial<T>): Required<T>`,
  the convention's shallow-merge helper. An override replaces its default key by key;
  `undefined` as the whole overrides argument returns the defaults; an
  explicit `undefined` override value counts as missing - `resolveLabels(defaults, { copy: undefined })`
  returns `"Copy message"`, not `undefined`, because that is what a consumer's optional-chained
  catalogue lookup produces ([validated by](../../tests/resolveLabels.test.ts#L17),
  [L24](../../tests/resolveLabels.test.ts#L24),
  [L28](../../tests/resolveLabels.test.ts#L28)).
- A function-valued label - the convention's interpolation form - overrides like any other key
  ([validated by](../../tests/resolveLabels.test.ts#L32)).
- Neither argument is mutated and `Object.freeze`d defaults do not throw
  ([validated by](../../tests/resolveLabels.test.ts#L41),
  [L50](../../tests/resolveLabels.test.ts#L51)).
- `src/components/ErrorBoundary.tsx` retrofitted onto `resolveLabels` as the worked example:
  `defaultErrorBoundaryLabels: Readonly<Required<ErrorBoundaryLabels>>` is exported, frozen, and
  co-located with its type, so a key added to `ErrorBoundaryLabels` without a default fails
  `npm run typecheck` - pinned by the `// @ts-expect-error` fixture in
  `tests/types/labels-type-assertions.tsx`, compiled against the BUILT package through the single
  `"."` exports entry ([validated by](../../tests/labels-dist.test.ts#L3)).
- The three translated labels render with no English remaining; no `labels` prop renders the three
  021 English defaults unchanged ([validated by](../../tests/ErrorBoundary.test.tsx#L61),
  [L44](../../tests/ErrorBoundary.test.tsx#L46)).
- `eslint.config.mjs` gains a labels entry (core ESLint only): `no-restricted-syntax` selectors
  banning bare Latin JSX text, hardcoded string literals in the seven
  assistive attributes, and
  `strings`/`texts`/`i18n`/`translations`/`messages` property keys, plus
  `no-restricted-imports` on
  `next-intl` ([validated by](../../tests/eslint-labels.test.ts#L65),
  [L125](../../tests/eslint-labels.test.ts#L131),
  [L134](../../tests/eslint-labels.test.ts#L140),
  [L152](../../tests/eslint-labels.test.ts#L158)).
- The red fixtures live
  in `tests/fixtures/eslint-labels/`, globally ignored so the committed tree stays green - the
  original four plus the 2026-08-26 review's bypass set (expression-container and template
  literals, and the &&/ternary/+ conditional-render forms, as children and as assistive
  attribute values);
  `grep -rn "next-intl\|useTranslations" src/` returns nothing.
- `tests/labelled-exports.test.tsx` - the export-partition test: every value export of
  `src/index.ts` is classified into `labelsProp` / `stringPropOnly` / `noStrings`, and the sorted
  union must equal the sorted parsed export names; an unclassified export fails by name with a
  pointer at `docs/design-notes.md § Labels` ([validated by](../../tests/labelled-exports.test.tsx#L136)).
- The sentinel test renders every `labelsProp` member (today: `ErrorBoundary`, error state) with
  every label a unique `⟦sentinel⟧` and asserts no run of three or more Latin letters survives in
  `textContent` or in `aria-label`/`aria-placeholder`/`aria-roledescription`/`aria-valuetext`/
  `title`/`placeholder`/`alt` outside the sentinels, with the sentinel set pinned to
  the default-labels keys ([validated by](../../tests/labelled-exports.test.tsx#L568),
  [L400](../../tests/labelled-exports.test.tsx#L463)).
- **The check's own proof:** reverting 021's `labels` prop to a hardcoded
  `"Something went wrong"` makes the sentinel test fail - the stray English survives sentinel
  stripping and matches the Latin-run regex
  ([validated by](../../tests/labelled-exports.test.tsx#L568)).
- `docs/design-notes.md § Labels` - Decisions 1-5, the flat-union key-naming rule, the function form for
  interpolation, the two `stringPropOnly` exceptions with reasons, and `aiDisclosure` documented
  as required-with-no-default under the EU AI Act.
- Re-pinned prior behaviour (AC 39): `<LoadingIcon ariaLabel="Cargando" />` renders
  `aria-label="Cargando"` with `"Loading"` nowhere in the output; the translated `announce`
  assertion already existed and is referenced, not duplicated
  ([validated by](../../tests/icons.test.tsx#L267),
  [announce](../../tests/useFocusGroups.test.tsx#L126)).

## Recorded decisions, interpretations and deviations

- **Behaviour change: explicit-`undefined` overrides.** 021's
  `{ ...defaultLabels, ...this.props.labels }` spread let
  `labels={{ title: undefined }}` blank the title. `resolveLabels` treats that key as missing and
  renders the English default instead. This is the convention's intent; it
  is the one observable behaviour change in the retrofit
  ([validated by](../../tests/ErrorBoundary.test.tsx#L83)).
- **Partition is over value exports.** The partition test statically parses `export { ... }`
  blocks of `src/index.ts`; `export type { ... }` names are excluded by design - a type carries
  no renderable string. Interfaces like `ErrorBoundaryLabels` are therefore not partition
  members ([validated by](../../tests/labelled-exports.test.tsx#L136)).
- **Test path deviation.** The issue names `src/__tests__/labelled-exports.tsx`; this repo keeps
  every test under `tests/` with a `.test.tsx` suffix (vitest's include pattern requires the
  suffix), so the file is `tests/labelled-exports.test.tsx`. Same content, repo-conventional
  location.
- **Fixture-scope deviation.** The labels lint entry's `files` glob covers
  `tests/fixtures/eslint-labels/**` alongside `src/**`, and the fixture directory sits in the
  global `ignores`. `npm run lint` therefore never sees the fixtures, while the red-fixture test
  lints them with `--no-ignore` against the exact committed rules rather than a copy of them
  ([validated by](../../tests/eslint-labels.test.ts#L20)).
- **Placeholder deleted.** `src/Placeholder.tsx`, `tests/Placeholder.test.tsx` and the barrel
  export are gone, sanctioned by 014's own design (the placeholder existed only until real components did):
  six real `"use client"` files now exist, and Placeholder's hardcoded English text can neither
  pass the new lint rule nor fit any partition bucket. `tests/build-contract.test.ts`'s
  first-statement assertion now targets `dist/hooks/useDebounce.js`, a real directive-carrying
  file ([validated by](../../tests/build-contract.test.ts#L12)).
- 014's deletion-trigger property
  still holds without Placeholder: coverage includes all of `src/**` at the 100/100/100/90
  floor, so deleting any component's test drops that file below threshold and fails
  `npm run test:coverage`.
- **`stringPropOnly` is a closed exception list.** The icons' `ariaLabel` (023 icons; a
  destructuring default, deliberately outside lint rule (b)'s JSX-attribute reach) and
  `useFocusGroups`' `announce` are grandfathered per `docs/design-notes.md § Labels`; everything else with
  strings takes `labels`. Closed means an addition requires a `docs/design-notes.md § Labels` amendment
  in the PR that adds it - Toast's `message` (issue 025) did exactly this
  ([validated by](../../tests/labelled-exports.test.tsx#L101)).
- **`aiDisclosure` is declared, not rendered.** The required label and its EU AI Act rationale
  live in `docs/design-notes.md § Labels`; the component that renders it and its reviewed wording belong to
  the message-list issue and the consumer's catalogue.
