# bowman-ui form, dialog and notice primitives

| Field  | Value                 |
| ------ | --------------------- |
| Issue  | re-cinq/bowman-ui#415 |
| Status | In Progress           |

Every screen a consumer builds beside the chat - an admin page, a settings page, a confirmation step
before a destructive action - needs a labelled text field, a modal dialog, an inline notice and a
red button, and the package ships none of them, so each consumer hand-writes them with its own
utility strings and its own focus handling. This change adds a `danger` variant to the shared
`ButtonVariant` union, an optional `onSubmit` and submit button to `SearchField`, and six
components - `TextField`, `Dialog`, `ConfirmDialog`, `Notice`, `KeyValueList` and `Card` - under the
labels convention, the `forwardRef` policy and the closed prop surface docs/design-notes.md § Styled
primitives records. All of it is built: each statement cites the unit, built-output or chat-demo
Playwright test that proves it, and the ones left unlinked are what no automated test can prove -
the screen-reader verdicts the A8 and A9 rows owe a human runner, the checks made by hand, and the
wording other documents carry. The delivery plan behind it was approved in Lore; where the two
differed, the plan's decisions are the ones this file records, save these deviations, each argued
where it applies:

- `Dialog` is not the browser's native `<dialog>` (decision 1).
- A selectable `Card` with a heading takes its name from the heading alone (decision 7).
- The overlay's dim is the drawer backdrop's palette utility rather than a token (the `Dialog`
  section).
- `Dialog` and `ConfirmDialog` forward no ref, though their panel takes focus (the conventions
  section).
- The public `useFocusTrap` hook gains three behaviours, one of which gives an empty container that
  can take focus a behaviour it lacks today (the `useFocusTrap` section).
- Some existing tests change a fixture, a map, a title or an assertion, though the plan asks for
  every existing test to pass unchanged (the "Existing tests that change" list).
- `ButtonVariant` widening is a type-level change for a consumer that switches exhaustively over it
  (§ The published surface).
- The required `submitSearch` key breaks a consumer's complete catalogue typed `SearchFieldLabels`,
  against the plan's "0 removed or changed signatures" and its promise that no consumer needs to
  change anything; the key is required so a translated catalogue cannot silently show English
  (decision 6, § The published surface).
- Three supporting types the plan's export list does not name ship beside each component's props,
  labels and defaults: `TextFieldType`, `NoticeTone` and `KeyValuePair`, so a consumer can type a
  value it stores or builds from data before passing it, as `ButtonVariant` lets it today (§ The
  published surface). `KeyValueList`'s `layout` gets no exported name: it is chosen where the list
  is rendered, not carried in data.
- `SearchField`'s new submit button forwards no ref, though the plan asks for forwarded refs on
  focusable elements: `SearchField`'s ref stays on its input (the conventions section).
- The plan names two design-record amendments, the danger variant and `SearchField`'s submit; the
  spec makes more. `Card` narrows § Styled primitives' refusal of layout primitives (decision 7),
  and § Labels decisions 2, 3 and 5 are amended for `IconButton` wrappers that feed `accessibleName`
  from their own key, for defaults typed over a subset of keys and for optional keys (decision 6) -
  the typing the plan's five required-labels components and its optional field hint and error need.
  § Theming decisions 6, 11 and 12 also change: decision 6's palette-mapped list gains the dialog
  overlay, decision 11's `buttonStyles.ts` imports gain the danger strings, and decision 12 gains
  the muted role's first border use (decision 21), one more `FOCUS_RING` importer and a second
  fragment, `FOCUS_VISIBLE_RING`, for the dialog panel (§ Theming).
- `Dialog` and `ConfirmDialog` take a `container` prop, because the plan's theming floor - a
  consumer's `--bowman-*` overrides reach every component - would otherwise fail for a dialog
  portalled out of a wrapper-scoped theme (decision 22).
- The scrolling body of a dialog becomes focusable when nothing in it is (decision 23).
- `ConfirmDialog` takes a fourth label key, `confirmBusy`, beyond the three the plan lists, because
  the plan's WCAG 2.2 AA floor needs its busy state announced (decision 20).
- `Notice` forwards no ref, though its dismiss button is focusable (the conventions section).
- `SearchField`'s resting border stays below WCAG 2.2 AA's 3:1 non-text minimum, because the plan
  holds its look unchanged; `TextField` meets it (§ Out of scope).
- The assistive-technology pass gains two rows, A8 and A9, where the plan keeps its procedure as it
  is (§ Accessibility checks).
- The axe scans cover each page's variant figures while no dialog is open and only the open dialog's
  panel while one is, not the whole page, so the plan's "0 automated accessibility violations in
  every documented state" is measured on the components, not the documentation chrome around them
  (§ Accessibility checks).
- axe's `color-contrast` rule measures text only, so the plan's "contrast covers text and focus
  indicators" holds for text through axe, and for the focus rings, the `Notice` tone icons and
  borders and `TextField`'s border (WCAG 2.2 AA's 3:1 non-text minimum, 1.4.11) through the
  measurements recorded in § Theming and the token matrix's computed colours, not through axe
  (§ Accessibility checks).

"Styled" keeps its § Styled primitives meaning: Tailwind v4 utility class names in the built file,
`dark:` variants included, generated by the consumer's own build through the `@source` line README
§ Styles prescribes. `src/styles.css` gains token comment lines and no rule, and `dist/styles.css`
still declares exactly the four keyframes: the one motion here is `LoadingIcon`'s existing
`animate-spin`, a Tailwind utility the consumer's build generates.

## What ships

Six components, three defaults objects and thirteen types, all from the package root, one new member
of an existing union, one new prop and label key on an existing component, and one internal module: ([validated by @3c9682f2](../../tests/public-api.test.ts#L40), [validated by @1a95e338](../../tests/public-api.test.ts#L46))

- `ButtonVariant` gains `"danger"`, which `Button` and `IconButton` both accept through the one
  shared union and the private `src/components/buttonStyles.ts` class map ([validated by variant="danger" on Button and IconButton carries the --bowman-danger-fill fill and hover and --bowman-text-on-danger text @ab5aa400](../../tests/Button.test.tsx#L147)).
- `SearchField` gains an optional `onSubmit` and, with it, a submit button named by a new
  `submitSearch` key in `SearchFieldLabels` and `defaultSearchFieldLabels` ([validated by with onSubmit, a ghost size="sm" IconButton named "Submit search" replaces the leading icon at the trailing edge @fb034417](../../tests/SearchField.test.tsx#L96), [validated by defaultSearchFieldLabels is frozen and equals { searchInput: "Search", searchPlaceholder: "Search...", submitSearch: "Submit search" } @c472eff1](../../tests/SearchField.test.tsx#L199)).
- `TextField`, `Dialog`, `ConfirmDialog` and `Notice` land in the `labelsProp` bucket of
  `tests/labelled-exports.test.tsx`, each with a sentinel harness ([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L187), [validated by TextField's sentinel labels are exactly fieldLabel, fieldHint and fieldError @ca282007](../../tests/labelled-exports.test.tsx#L787), [validated by Dialog's sentinel labels cover every defaultDialogLabels key plus the required dialogTitle @4c095324](../../tests/labelled-exports.test.tsx#L791), [validated by ConfirmDialog's sentinel labels cover every defaultConfirmDialogLabels key plus the required dialogTitle and confirmAction @c57256a5](../../tests/labelled-exports.test.tsx#L797), [validated by Notice's sentinel labels cover every defaultNoticeLabels key @06e3129c](../../tests/labelled-exports.test.tsx#L803)).
- `KeyValueList`, `Card`, `defaultDialogLabels`, `defaultConfirmDialogLabels` and
  `defaultNoticeLabels` land in the `noStrings` bucket ([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L187)).
- The `stringPropOnly` list stays at its three closed members ([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L187)).
- The public `useFocusTrap` hook gains three behaviours - focusing an empty container, Tab from the
  focused container, and returning focus on an unmount while open - one of which changes what an
  empty trap whose container can take focus does today (the `useFocusTrap` section) ([validated by an empty container with a tabindex takes focus on open and Tab from it is prevented @813cc857](../../tests/useFocusTrap.test.tsx#L262), [validated by Tab from the focused container itself reaches the first element @a65768b2](../../tests/useFocusTrap.test.tsx#L294), [validated by unmounting while open returns focus to the element that held it before opening @52422c57](../../tests/useFocusTrap.test.tsx#L310)).
- `src/components/ModalPanel.tsx`, the portal, overlay, panel, heading, optional close button and
  focus trap `Dialog` and `ConfirmDialog` share, is private and never exported from the barrel, as
  `buttonStyles.ts` and `FeedbackButtons` are ([validated by @3c9682f2](../../tests/public-api.test.ts#L40)).

Every new label key is unique across the package by concept, as docs/design-notes.md § Labels
decision 3 requires: none of `fieldLabel`, `fieldHint`, `fieldError`, `submitSearch`, `dialogTitle`,
`closeDialog`, `confirmAction`, `cancelAction`, `confirmBusy` or `dismissNotice` exists in any
labels type today, which was checked by hand against every one the package exports. No test checks
uniqueness by concept, and none proves a key renders: tests/labelled-exports.test.tsx checks that
each component's sentinel keys equal its defaults' keys and that no English text survives outside
the sentinels, so a harness that never shows a key still passes. Each new harness therefore passes
the props that bring every key on screen - `Notice`'s an `onDismiss`, `ConfirmDialog`'s `busy` - and
a review keeps the meaning of each name ([validated by no run of three Latin letters survives outside the sentinels for any labelsProp member @ffb54b18](../../tests/labelled-exports.test.tsx#L807)). The plan as approved in Lore said "the existing automated
labels test re-checks the whole set"; it checks only what is stated above, and the plan's Label keys
paragraph is corrected to say so; the plan is pasted into the issue that tracks this spec.
`ConfirmDialog` shares `Dialog`'s `dialogTitle`, because its heading is the same concept.
`SearchField`, `Dialog` and `Notice` each render an `IconButton`, a labelled component, yet do not
take the flat union of their own keys and `IconButton`'s that § Labels decision 3 prescribes:
`IconButton.accessibleName` names one instance, so each feeds it from its own concept-named key -
`submitSearch`, `closeDialog`, `dismissNotice` - and a union would hand three different buttons one
key. § Labels decision 3 records this in the same pull request (decision 6).

### `Button` and `IconButton`: the `danger` variant

```ts
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
```

- `danger` is a solid fill for the one action on a screen that destroys something: the `DANGER_FILL`
  and `DANGER_FILL_HOVER` token strings, reading `--bowman-danger-fill` and
  `--bowman-danger-fill-hover`, each with its `-dark` twin, and the `TEXT_ON_DANGER` string reading
  `--bowman-text-on-danger`, which has no twin, as `--bowman-text-on-accent` has none ([validated by variant="danger" on Button and IconButton carries the --bowman-danger-fill fill and hover and --bowman-text-on-danger text @ab5aa400](../../tests/Button.test.tsx#L147), [validated by each token falls back to the same palette value at every site, matching the declared default @8ec9e511](../../tests/theming-tokens-dist.test.ts#L352)).
- It keeps every variant's focus ring and the `disabled:cursor-not-allowed disabled:opacity-50`
  pair, and a disabled `danger` button never reaches `onClick` ([validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @512e1f83](../../tests/Button.test.tsx#L121), [validated by a disabled danger Button or IconButton renders the native attribute and never reaches onClick @dd0af3c7](../../tests/Button.test.tsx#L159)).
- `IconButton` takes `danger` through the same union and class map; no second vocabulary ([validated by variant="danger" on Button and IconButton carries the --bowman-danger-fill fill and hover and --bowman-text-on-danger text @ab5aa400](../../tests/Button.test.tsx#L147)).
- `primary`, `secondary` and `ghost` render exactly the classes they render today, and every
  existing `Button` and `IconButton` test passes, one with `danger` added to it:
  tests/Button.test.tsx "every variant keeps focus:ring-2 ring-offset-2 …" renders a fourth,
  `danger`, button, so its title stays true (see "Existing tests that change"). A new test pins the
  danger fill, hover and text strings on `Button` and `IconButton`, and that a disabled `danger`
  button never reaches `onClick` ([validated by variant="primary" carries the --bowman-accent background and hover, --bowman-text-on-accent text and no border-slate-200 @1ff9d538](../../tests/Button.test.tsx#L94), [validated by variant="secondary" carries border beside the --bowman-border, --bowman-surface, --bowman-surface-hover and --bowman-text-body tokens and no --bowman-accent background @fb977789](../../tests/Button.test.tsx#L100), [validated by variant="ghost" reads --bowman-text-secondary, its hover reads --bowman-text-strong, beside --bowman-surface-hover with neither a border token nor the --bowman-accent background @3ff5ea71](../../tests/Button.test.tsx#L111), [validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @512e1f83](../../tests/Button.test.tsx#L121), [validated by variant="danger" on Button and IconButton carries the --bowman-danger-fill fill and hover and --bowman-text-on-danger text @ab5aa400](../../tests/Button.test.tsx#L147), [validated by a disabled danger Button or IconButton renders the native attribute and never reaches onClick @dd0af3c7](../../tests/Button.test.tsx#L159)).

### `SearchField`: the submit callback

```ts
export interface SearchFieldLabels {
  /** The input's accessible name - a real label, never the placeholder. */
  searchInput: string;
  searchPlaceholder: string;
  /** The submit button's accessible name, read only when `onSubmit` is given. */
  submitSearch: string;
}

export const defaultSearchFieldLabels: Readonly<Required<SearchFieldLabels>>;
// { searchInput: "Search", searchPlaceholder: "Search...", submitSearch: "Submit search" }

export interface SearchFieldProps {
  value: string;
  /** Receives the input's new value verbatim - untrimmed, a controlled input's contract. */
  onChange: (value: string) => void;
  /** Runs the search on Enter or the submit button; without it, no button renders. */
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  labels?: Partial<SearchFieldLabels>;
}
```

- Without `onSubmit`, `SearchField` renders exactly what it renders today - the leading
  `SearchIcon`, the input, no button - and every existing `SearchField` behaviour holds. No keydown
  handler is attached, so Enter is left to the browser and a consumer's own `<form>` around the
  field still submits on it; a new test asserts that `fireEvent.keyDown` with Enter on the input
  returns `true`, not prevented, when `onSubmit` is absent. The existing `SearchField` tests change
  their fixtures or titles, not the behaviour they prove (see "Existing tests that change" below) ([validated by renders no button without onSubmit - no clear control and no submit @a47ff0b5](../../tests/SearchField.test.tsx#L76), [validated by without onSubmit, Enter on the input is not prevented, so a consumer's own form still submits @cfc9ed0c](../../tests/SearchField.test.tsx#L82), [validated by without onSubmit, the input keeps the leading-icon padding pl-9 pr-3 @2b1336a8](../../tests/SearchField.test.tsx#L88)).
- With `onSubmit`, the leading icon gives way to a `ghost` `size="sm"` `IconButton` holding
  `SearchIcon`, small enough that it and its offset ring fit inside the input's height, at the
  input's trailing edge, named by `labels.submitSearch` (default `"Submit search"`), and the input's
  padding moves to match. Clicking it calls `onSubmit` with the current `value` ([validated by with onSubmit, a ghost size="sm" IconButton named "Submit search" replaces the leading icon at the trailing edge @fb034417](../../tests/SearchField.test.tsx#L96), [validated by labels={{ submitSearch: "Søg nu" }} names the submit button @527182ad](../../tests/SearchField.test.tsx#L108), [validated by clicking the submit button calls onSubmit once with the current value " 4711 " @6d16a71d](../../tests/SearchField.test.tsx#L121)).
- Enter in the input calls `onSubmit` with the current `value` verbatim, once, and calls
  `preventDefault()`, so a consumer's own `<form>` around the field does not submit as well. An
  Enter that commits an IME composition (`event.nativeEvent.isComposing`) does neither, as
  `ChatComposer`'s Enter guard does not send mid-composition ([validated by Enter in the input calls onSubmit once with the value verbatim and prevents the default @2e8f8675](../../tests/SearchField.test.tsx#L131), [validated by](../../tests/SearchField.test.tsx#L141), [validated by the search field's on-submit variant runs the search on Enter and on its submit button @d4ea6e61](../../examples/chat-demo/tests/docs.spec.ts#L795)).
- While `disabled` holds, the button carries the native `disabled` attribute and neither Enter nor a
  click calls `onSubmit` ([validated by while disabled, the submit button carries the native attribute and neither Enter nor a click calls onSubmit @0104a1d6](../../tests/SearchField.test.tsx#L153)).
- `onChange` still fires on every keystroke; filtering as the user types and searching on submit are
  both the consumer's choice, and a consumer may wire either or both ([validated by with onSubmit, onChange still fires on every keystroke @b442036f](../../tests/SearchField.test.tsx#L166)).

### `TextField`

```ts
export type TextFieldType = "text" | "email" | "url" | "tel";

export interface TextFieldLabels {
  /** The visible label and the input's accessible name - a real label, never the placeholder. */
  fieldLabel: string;
  /** Help text under the input. */
  fieldHint?: string;
  /** Its presence is the invalid state - there is no separate `invalid` prop. */
  fieldError?: string;
}

export interface TextFieldProps {
  value: string;
  /** Receives the input's new value verbatim - untrimmed, a controlled input's contract. */
  onChange: (value: string) => void;
  labels: TextFieldLabels;
  /** Default "text". */
  type?: TextFieldType;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  name?: string;
}

export const TextField: ForwardRefExoticComponent<TextFieldProps & RefAttributes<HTMLInputElement>>;
```

- Renders a visible `<label>` holding `labels.fieldLabel`, medium-weight small text in
  `TEXT_STRONG`, tied to one `<input>` through ids from `useId`, so the label is the input's
  accessible name; the `ref` reaches the input ([validated by `a visible <label> holding fieldLabel names the input, and the ref reaches the input` @28c0dce2](../../tests/TextField.test.tsx#L24)).
- The input at rest takes `SearchField`'s look without its icon padding - `rounded-lg border` on
  `SURFACE`, `px-3 py-2 text-sm` in `TEXT_STRONG`, the `FOCUS_RING_COLOR` ring on focus, and
  `disabled:cursor-not-allowed disabled:opacity-50` - but its border reads a new `CONTROL_BORDER`
  class string in `src/theme/tokens.ts` rather than `BORDER`. `CONTROL_BORDER` reads the existing
  `--bowman-text-muted` role as a border colour and declares no token (decision 21): `BORDER`
  (`slate-200` on white, about 1.2:1) fails WCAG 2.2 AA's 3:1 non-text minimum for the boundary of a
  control (1.4.11), and axe does not test that criterion, so its zero-violation target would not
  catch it. The tests/theming-tokens-dist.test.ts `NEUTRAL_ROLE_READERS` map keys `CONTROL_BORDER`
  to `TextField` ([validated by `the input at rest takes rounded-lg border px-3 py-2 text-sm on SURFACE in TEXT_STRONG, the focus ring, the disabled pair and CONTROL_BORDER` @57ff2794](../../tests/TextField.test.tsx#L37), [validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
- `labels.fieldHint` renders under the input and `labels.fieldError` under the hint, and the input's
  `aria-describedby` names the hint first, then the error, and only those present. An empty
  `labels.fieldHint` counts as absent, as an empty `fieldError` does: no hint renders and
  `aria-describedby` does not name it ([validated by `a hint renders under the input in TEXT_MUTED and aria-describedby names it` @27f1eebc](../../tests/TextField.test.tsx#L105), [validated by `an error sets aria-invalid, swaps CONTROL_BORDER for DANGER_BORDER, renders in DANGER after the hint, and aria-describedby names the hint then the error` @978a058b](../../tests/TextField.test.tsx#L116), [validated by an error without a hint is the only id aria-describedby names @667bc707](../../tests/TextField.test.tsx#L138), [validated by an empty fieldHint and an empty fieldError count as absent @7ca61191](../../tests/TextField.test.tsx#L146)).
- With a non-empty `labels.fieldError` - an empty string counts as absent - the input carries
  `aria-invalid="true"` and a border in the `--bowman-danger` role, through a new `DANGER_BORDER`
  class string in `src/theme/tokens.ts` that reads the existing role and declares no token; without
  it, neither. `DANGER_BORDER` replaces `CONTROL_BORDER` rather than joining it: both set
  `border-color`, so with both present Tailwind's generated order, not the class attribute, would
  decide the colour (docs/design-notes.md § Styled primitives: "an appended class fails silently").
  The invalid-state test asserts the `--bowman-text-muted` border classes are absent. The error text
  renders in `DANGER` and the hint in `TEXT_MUTED` ([validated by `an error sets aria-invalid, swaps CONTROL_BORDER for DANGER_BORDER, renders in DANGER after the hint, and aria-describedby names the hint then the error` @978a058b](../../tests/TextField.test.tsx#L116), [validated by an empty fieldHint and an empty fieldError count as absent @7ca61191](../../tests/TextField.test.tsx#L146)).
- The error text renders into a polite live region that exists from the first render, so a message
  added later is announced - specs/bowman-ui-toast/spec.md's lesson that a live region must exist
  before its text ([validated by the error's polite live region exists from the first render, so an error added later is announced @670c6908](../../tests/TextField.test.tsx#L161)).
- The input is controlled: it renders `value`, and every change calls `onChange` with the new value
  verbatim, as `SearchField` does (§ Styled primitives: "reports the raw value") ([validated by renders value="4711" and reports a change to " 4712 " verbatim, once @79aa9ddf](../../tests/TextField.test.tsx#L58)).
- `type`, `required`, `disabled`, `autoComplete`, `spellCheck` and `name` render as the native
  attributes; `type` defaults to `"text"`. `required` adds no visible marker, because a hard-coded
  `*` or "required" would be an English string outside the labels convention; WCAG 3.3.2 is met by
  the consumer, who puts the marker in `fieldLabel`, as the chat-demo's `TextField` page shows ([validated by type defaults to "text", and type, required, disabled, autoComplete, spellCheck and name render natively @6df274b9](../../tests/TextField.test.tsx#L70), [validated by required adds no visible marker @80ef031d](../../tests/TextField.test.tsx#L97)).

### `Dialog`

```ts
export interface DialogLabels {
  /** The dialog's heading and its accessible name. */
  dialogTitle: string;
  /** The close button's accessible name. */
  closeDialog: string;
}

export const defaultDialogLabels: Readonly<Required<Pick<DialogLabels, "closeDialog">>>;
// { closeDialog: "Close" }

export interface DialogProps {
  open: boolean;
  /** Called on Escape and on the close button. */
  onClose: () => void;
  labels: Partial<DialogLabels> & Required<Pick<DialogLabels, "dialogTitle">>;
  children: ReactNode;
  /** Actions, rendered after the body. */
  footer?: ReactNode;
  /** Where focus returns on close; default the element that held focus before opening. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** The portal's target, such as a themed wrapper; default `document.body`. */
  container?: Element | null;
}

export const Dialog: (props: DialogProps) => ReactElement | null;
```

- With `open` false it renders nothing. With `open` true it renders, through `createPortal` into
  `container` when given and `document.body` otherwise, a fixed full-screen `z-50` overlay on
  `bg-black/50`, the dim `AppShell`'s drawer backdrop already paints (src/components/AppShell.tsx),
  holding one panel with `role="dialog"`, `aria-modal="true"`, `tabIndex={-1}` and `aria-labelledby`
  pointing at an `<h2>` holding `labels.dialogTitle`. The panel takes focus when it holds nothing
  focusable, when a `ConfirmDialog` turns busy, and when the scrolling body stops overflowing while
  it holds focus (below), so it carries `FOCUS_VISIBLE_RING` beside `ring-offset-2`, as the
  scrolling body does, rather than the browser's default outline. `FOCUS_VISIBLE_RING` is a second
  fragment in src/theme/focusRing.ts, `focus:outline-none focus-visible:ring-2` beside the same
  `FOCUS_RING_COLOR` and `RING_OFFSET` as `FOCUS_RING`: the colours still ride `focus:`, a superset
  of `:focus-visible`, so dark mode and the `--bowman-focus-ring` overrides reach it, but the ring
  is drawn only under `:focus-visible`. The panel's `tabIndex={-1}` makes a mouse click on any prose
  inside it focus the panel, and the `focus:`-based `FOCUS_RING` would then ring the whole panel;
  under `:focus-visible` a click draws nothing, while focus the trap moves in after a keyboard open,
  and a busy `ConfirmDialog` entered by Enter, still shows the ring. A new fragment, not
  `ErrorBoundary`'s `FOCUS_VISIBLE_RING_COLOR`, because that string has no dark variant
  (docs/design-notes.md § Theming, the `--bowman-focus-ring-dark` row) and `RING_OFFSET` is read by
  the focus-ring module alone (§ Theming decision 12). jsdom matches no `:focus-visible`, so a
  chat-demo Playwright test, in Chromium and WebKit, opens the `Dialog` page's `default` variant,
  whose body holds prose only and does not overflow, so the body takes no `tabIndex`, clicks that
  prose and asserts the panel holds focus with a computed `box-shadow` of `none`. No `ring-offset-2`
  site this spec adds - the panel, the scrolling body, the selectable `Card` - carries a `shadow-*`
  utility: Tailwind v4's `ring-offset-2` sets `--tw-ring-offset-shadow` at rest, which any
  `shadow-*` composes into `box-shadow`, so a shadow would draw the 2px offset ring unfocused,
  plainly visible in the dark scheme, and on the panel fail that test. When the close button
  renders, the `<h2>` carries trailing padding wider than the close button, so a long title wraps
  before it reaches the button in the panel's corner. The portal appends the overlay as the target's
  last child. Into `document.body` that is after the page, so the overlay paints above `AppShell`'s
  drawer and `Toast`, which also sit at `z-50` and win ties by document order ([validated by renders nothing while open is false @3e1cff0a](../../tests/helpers/modal-panel-contract.tsx#L116), [validated by `portals a fixed z-50 bg-black/50 overlay as document.body's last child, holding the modal panel named by its <h2>` @4efbe038](../../tests/helpers/modal-panel-contract.tsx#L122), [validated by container={wrapper} portals into the wrapper; container={null} portals into document.body @16f1f099](../../tests/helpers/modal-panel-contract.tsx#L135), [validated by `the panel and the scrolling body carry FOCUS_VISIBLE_RING beside ring-offset-2 and no shadow, and the body pads p-1` @0a1a4b9d](../../tests/helpers/modal-panel-contract.tsx#L162), [validated by `renders role="dialog" with no aria-describedby, and the <h2> holds labels.dialogTitle` @c2253b22](../../tests/Dialog.test.tsx#L38), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17), [validated by clicking the default Dialog's prose focuses the panel and draws no ring @899cb105](../../examples/chat-demo/tests/docs.spec.ts#L716)).
- A consumer whose theme is set on a wrapper - README § Theming's `.custom-theme` or
  `[data-tenant="acme"]` - passes that wrapper, or an element inside it, as `container`, so the
  wrapper's `--bowman-*` values and, under a class-based `dark:` variant, its `dark` class reach the
  panel (decision 22). Neither the container nor any of its ancestors may become the containing
  block of a fixed descendant - one with a `transform`, `translate`, `scale`, `rotate`, `filter`,
  `backdrop-filter` or `perspective`, `contain: layout` or `paint`, or a `will-change` naming one of
  those - or form a stacking context with its own `z-index`, for the reason decision 1 gives; the
  overlay is the container's own child, so a `.custom-theme` wrapper carrying `transform` or
  `isolate` breaks it as an ancestor would. A plain `overflow` ancestor does no harm: it does not
  clip a fixed descendant, so the chat-demo's page-local wrapper inside `AppShell`'s
  `overflow-hidden` main area (decision 19) meets the rule. `null` means `document.body`, so a
  wrapper read from a ref, still `null` on the first render, portals to `<body>`, and a later
  `container` re-mounts the portal's subtree in the new target, which drops focus to `<body>`; the
  trap lives in `ModalPanel`, outside that subtree, so it neither re-runs nor restores focus:
  `container` must stay the same while the dialog is open, and must come after every other `z-50`
  layer - `AppShell`'s drawer, a `Toast` - in document order, or the overlay paints beneath them; a
  wrapper around the whole screen, as the chat view's `?theme=` wrapper is
  (examples/chat-demo/src/App.tsx), meets that, and so does the documentation pages' page-local
  wrapper, which follows `AppShell`'s drawer in document order. A consumer keeps the wrapper in
  state through a callback ref and opens the dialog only once it is set; the chat-demo's `Dialog`
  page shows the pattern ([validated by container={wrapper} portals into the wrapper; container={null} portals into document.body @16f1f099](../../tests/helpers/modal-panel-contract.tsx#L135), [validated by the themed ConfirmDialog portals into its wrapper, and closing returns focus to its trigger @29f8a58d](../../examples/chat-demo/tests/docs.spec.ts#L760)).
- The dim is a deliberate exception to the plan's "only the colour tokens" constraint: it is
  non-text, and docs/design-notes.md § Theming decision 6 keeps the mobile overlay (`bg-black`)
  palette-mapped and lists it so no cleanup turns it into a token. That list gains the dialog's
  overlay beside it in the same pull request ([validated by `portals a fixed z-50 bg-black/50 overlay as document.body's last child, holding the modal panel named by its <h2>` @4efbe038](../../tests/helpers/modal-panel-contract.tsx#L122), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17)).
- The panel paints its own colours, because the portal takes it out of every region `AppShell`
  colours: `SURFACE` behind it, a `BORDER` edge, `TEXT_BODY` for `children` and `footer`, and the
  `<h2>` in `TEXT_STRONG`. Without them its text would inherit whatever the page's `<body>` sets,
  which docs/design-notes.md § Theming decision 6 rules out for every region the library lays out
  for consumer content ([validated by `the panel paints SURFACE, BORDER and TEXT_BODY, the <h2> TEXT_STRONG, capped at w-full max-w-lg and 100dvh - 2rem` @ab4f8726](../../tests/helpers/modal-panel-contract.tsx#L152), [validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
- The panel is `w-full max-w-lg` and at most `calc(100dvh - 2rem)` tall; when its content is taller,
  the body between the heading and the footer scrolls and the heading and footer stay in view ([validated by `the panel paints SURFACE, BORDER and TEXT_BODY, the <h2> TEXT_STRONG, capped at w-full max-w-lg and 100dvh - 2rem` @ab4f8726](../../tests/helpers/modal-panel-contract.tsx#L152), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17)).
- "Holds no focusable element" is decided as the trap decides it: the trap's module-private
  `getFocusableElements`, `FOCUSABLE_SELECTOR` filtered by visibility (src/hooks/useFocusTrap.ts),
  moves into the internal src/hooks/focusableSelector.ts beside the selector, and both the trap and
  `ModalPanel` import it, so a body whose only control is `display:none` counts as empty for both;
  the barrel exports neither ([validated by `an overflowing prose-only body becomes a focusable region named by the <h2> and takes initial focus` @4bb41ddd](../../tests/helpers/modal-panel-contract.tsx#L246), [validated by an empty container with a tabindex that fails the visibility check takes no focus and leaves Tab alone @34858645](../../tests/useFocusTrap.test.tsx#L271), [validated by @3c9682f2](../../tests/public-api.test.ts#L40)).
- While the body overflows and holds no focusable element, it carries `tabIndex={0}`,
  `role="region"` and `aria-labelledby` pointing at the `<h2>`, so a keyboard user can reach and
  scroll it (WCAG 2.1.1); otherwise it carries none of them. It always carries the panel's
  `FOCUS_VISIBLE_RING` classes beside `ring-offset-2`, which stays at each site
  (docs/design-notes.md § Theming decision 12), so a click inside it draws no ring either, inert
  while it cannot take focus, and the panel clips nothing, so the offset ring is never cut by the
  panel's rounded corners. With a focusable element in it, a user reaches its content by tabbing
  through its controls instead (decision 23). The body is the scroll container, so it clips what its
  children paint past its edges; it carries its own padding of at least `p-1` (4px), no less than a
  ring's 2px plus its 2px offset, since the scroller clips at its padding edge, with the panel's
  padding outside it, so the focus rings of the controls in `children` - a `w-full` `TextField` at
  either side, the first or last control at the top or bottom - are never cut. A layout effect
  compares `scrollHeight` with `clientHeight` and sets or removes the three attributes on the node
  itself; it depends on the trap's container ref, which `exhaustive-deps` cannot tell is stable, and
  on a named `portalOpen` value, `open && isClient`, named because `exhaustive-deps` flags an
  expression written in the array. It depends on `portalOpen` because `ModalPanel` stays mounted
  while the body exists only while the portal renders, so it runs, and attaches its observer, on the
  commit that first renders the body, after a closed mount or hydration as on a first open render.
  It also re-runs from a `ResizeObserver`, where one exists, watching both the body and an inner
  wrapper around its content: once the body reaches its height cap its own box stops changing while
  its content still grows, as when a disclosure in `children` opens without re-rendering
  `ModalPanel`. It writes them without a re-render, so they are in place before the trap's open
  effect looks for a first focusable element. When the body stops overflowing while it holds focus -
  a prose-only dialog after the viewport grows - the effect first moves focus to the panel, then
  removes the attributes, so the browser's focus fixup never drops focus to `<body>` outside the
  modal; a stubbed-heights test focuses the overflowing body, makes it fit, fires the observer and
  asserts the panel holds focus. An overflowing prose-only body is therefore the first focusable
  element and takes initial focus. jsdom lays nothing out and has no `ResizeObserver`, so its tests
  stub the two heights and, for the branch where one exists, a `ResizeObserver` whose callback they
  fire for each of the two watched elements, keeping the 100% branch floor. One test mounts the
  dialog closed with overflowing stubbed heights, opens it and asserts the body carries
  `tabindex="0"` ([validated by a body that does not overflow carries no tabindex, role or aria-labelledby @2f1e7879](../../tests/helpers/modal-panel-contract.tsx#L238), [validated by `an overflowing prose-only body becomes a focusable region named by the <h2> and takes initial focus` @4bb41ddd](../../tests/helpers/modal-panel-contract.tsx#L246), [validated by an overflowing body that holds a control takes no tabindex, and the control takes focus @538cbd09](../../tests/helpers/modal-panel-contract.tsx#L257), [validated by mounted closed with overflowing heights and then opened, the body carries tabindex=0 @008e97bc](../../tests/helpers/modal-panel-contract.tsx#L283), [validated by a ResizeObserver watches the body and its inner wrapper, re-evaluating on each, and disconnects on close @9481d39e](../../tests/helpers/modal-panel-contract.tsx#L294), [validated by when the focused body stops overflowing, the panel takes focus before the attributes go @24e42e17](../../tests/helpers/modal-panel-contract.tsx#L319), [validated by the overflowing Dialog body is a named, focusable region that takes initial focus @621d4eb8](../../examples/chat-demo/tests/docs.spec.ts#L727)).
- On the server and during hydration an open `Dialog` renders nothing, and it portals on the first
  client render after: the client check reads `useSyncExternalStore` with a server snapshot of
  `false`, so markup never mismatches and no `typeof window` guard is written. The server snapshot
  runs only under a server render, which the suite has today only for `useSidebarState`'s identical
  pattern (src/hooks/useSidebarState.ts, rendered with `renderToStaticMarkup` in
  tests/useSidebarState.test.tsx), so the 100% function floor needs one here, and the hydration path
  a second: the shared routine renders an open dialog with `renderToString` from `react-dom/server`,
  then hydrates that markup with `hydrateRoot`, and asserts the panel appears and focus moves inside
  it, to its first control; a mismatch would trip tests/setup.ts's `console.error` trap. The trap is
  armed with `open && isClient`, so an open `Dialog` hydrated from the server still moves focus into
  its panel once the panel exists ([validated by an open dialog renders nothing on the server, then hydrates without mismatch, portals and moves focus to its first control @fb419fd5](../../tests/helpers/modal-panel-contract.tsx#L341), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17), [validated by @bb94a4d9](../../tests/ConfirmDialog.test.tsx#L55)).
- The panel traps focus through the shipped `useFocusTrap`: opening moves focus to the first
  focusable element in DOM order, Tab and Shift+Tab wrap inside it, and Escape calls `onClose` ([validated by opening focuses the first control in children, and Tab from the last control wraps inside @3c9d6e80](../../tests/helpers/modal-panel-contract.tsx#L170), [validated by Escape calls the dismiss callback once, and a click on the overlay calls nothing @3f3c04b1](../../tests/helpers/modal-panel-contract.tsx#L184), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17)).
- The DOM order is the `<h2>`, `children`, `footer`, then the close button, which CSS places in the
  panel's corner. Opening therefore focuses the first control in `children`, else the overflowing
  body when it is focusable (above), else the first control in `footer`, and the close button only
  when none of those holds ([validated by the close button is a ghost IconButton named "Close", last in DOM order, and calls onClose @d54326b8](../../tests/Dialog.test.tsx#L49), [validated by with nothing focusable in children or footer, opening focuses the close button @030a7e12](../../tests/Dialog.test.tsx#L80), [validated by with no control in children, opening focuses the first control in footer, not the close button @ccb6e3e3](../../tests/Dialog.test.tsx#L90), [validated by opening focuses the first control in children, and Tab from the last control wraps inside @3c9d6e80](../../tests/helpers/modal-panel-contract.tsx#L170), [validated by `an overflowing prose-only body becomes a focusable region named by the <h2> and takes initial focus` @4bb41ddd](../../tests/helpers/modal-panel-contract.tsx#L246)).
- Closing - `open` turning false - and unmounting while open both return focus to
  `returnFocusRef.current` when given, else to the element that held focus before the dialog opened.
  `returnFocusRef` must stay the same object while the dialog is open - a `useRef`, never an inline
  or `createRef()` object - because the trap's open effect depends on it: a new object re-runs that
  effect, which records an element inside the panel as the one to return to and moves focus back to
  the first control on every render. A consumer whose confirmed action removes that element, such as
  the delete button of a deleted row, passes `returnFocusRef`, because focus sent to a detached node
  lands on `<body>` ([validated by closing returns focus to the element that held it before opening @5eefe5f5](../../tests/helpers/modal-panel-contract.tsx#L197), [validated by unmounting while open returns focus to the element that held it before opening @52422c57](../../tests/helpers/modal-panel-contract.tsx#L206), [validated by closing returns focus to returnFocusRef.current when given @2b9ccd40](../../tests/helpers/modal-panel-contract.tsx#L220), [validated by a return target removed before the close is skipped and focus stays where it was @e3a91e71](../../tests/useFocusTrap.test.tsx#L368)).
- The close button is a `ghost` `IconButton` with `CloseIcon`, as `Notice`'s dismiss button is,
  named by `labels.closeDialog` (default `"Close"`), which calls `onClose` ([validated by the close button is a ghost IconButton named "Close", last in DOM order, and calls onClose @d54326b8](../../tests/Dialog.test.tsx#L49), [validated by labels={{ closeDialog: "Luk" }} names the close button @283038b4](../../tests/Dialog.test.tsx#L70)).
- A click on the overlay outside the panel does nothing ([validated by Escape calls the dismiss callback once, and a click on the overlay calls nothing @3f3c04b1](../../tests/helpers/modal-panel-contract.tsx#L184), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17)).
- `footer`, when given, renders after `children` in a right-aligned row ([validated by footer renders after children in a right-aligned row @d557060e](../../tests/Dialog.test.tsx#L105), [validated by without footer, no footer row renders and no form wraps the body @755150e4](../../tests/Dialog.test.tsx#L125)).
- A `footer` button cannot submit a `<form>` in `children`: `Button` takes no `form` attribute, and
  only `ConfirmDialog` gets `ModalPanel`'s form wrapper. A `Dialog` whose content is a form
  therefore follows one of two patterns, and the chat-demo's `Dialog` page shows both: the footer's
  save button calls the consumer's own handler through `onClick`, with the footer kept in view; or
  the form and its buttons both sit in `children`, so Enter in a field submits it, at the cost of
  the buttons scrolling with the body ([validated by without footer, no footer row renders and no form wraps the body @755150e4](../../tests/Dialog.test.tsx#L125)).

### `ConfirmDialog`

```ts
export interface ConfirmDialogLabels {
  dialogTitle: string;
  /** The confirm button's text - the action, never "OK". */
  confirmAction: string;
  cancelAction: string;
  /** Announced politely while busy; the action is in progress and the dialog waits for it. */
  confirmBusy: string;
}

export const defaultConfirmDialogLabels: Readonly<
  Required<Pick<ConfirmDialogLabels, "cancelAction" | "confirmBusy">>
>;
// { cancelAction: "Cancel", confirmBusy: "Working, please wait" }

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  labels: Partial<ConfirmDialogLabels> &
    Required<Pick<ConfirmDialogLabels, "dialogTitle" | "confirmAction">>;
  /** What confirming does - consumer content, read as the dialog's description. */
  description: ReactNode;
  /** Any fields the confirmation needs, after the description. */
  children?: ReactNode;
  confirmDisabled?: boolean;
  busy?: boolean;
  /** As on `Dialog`. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** As on `Dialog`. */
  container?: Element | null;
}

export const ConfirmDialog: (props: ConfirmDialogProps) => ReactElement | null;
```

- `ConfirmDialog` renders through the same `ModalPanel` as `Dialog`, with every `Dialog` behaviour
  above - portal and `container`, sizing, the focusable overflowing body, hydration, trap, focus
  return, no overlay dismissal - but with `role="alertdialog"`, `aria-describedby` pointing at the
  `<div>` holding `description`, and no close button (decision 17) ([validated by `renders role="alertdialog" described by the <div> holding description, with no close button` @4f65eb31](../../tests/ConfirmDialog.test.tsx#L82), [validated by @bb94a4d9](../../tests/ConfirmDialog.test.tsx#L55)).
- Its body and footer sit in one `<form noValidate>`. `ModalPanel` takes an internal `onSubmit`
  prop, which only `ConfirmDialog` passes: with it, `ModalPanel` renders the wrapper around the
  scrolling body and the footer as that form, a `flex flex-col min-h-0` column, so the height cap
  and the footer staying in view hold as in a `Dialog`, and the buttons need no `form=` attribute
  that `Button` does not take. The form holds `description` first, then `children`, then a
  `secondary` cancel `Button` and a `danger` confirm `Button` of `type="submit"`. The confirm button
  is always `danger`: the plan names no other style, and a confirmation that destroys nothing needs
  no `ConfirmDialog` ([validated by `one <form noValidate> holds description, children, then a secondary cancel and a danger submit confirm` @ee55a3f1](../../tests/ConfirmDialog.test.tsx#L94)).
- The form's submit handler always calls `preventDefault()`, so the browser never navigates and
  jsdom never reports an unimplemented form submission, and `stopPropagation()`, so React's `submit`
  event, which bubbles through a portal along the component tree, never reaches a consumer's own
  `<form onSubmit>` around the `ConfirmDialog` ([validated by clicking confirm calls onConfirm once, and the submit never reaches a consumer's own form @0629daeb](../../tests/ConfirmDialog.test.tsx#L131), [validated by submitting the form directly calls onConfirm once and prevents the default @27c15e93](../../tests/ConfirmDialog.test.tsx#L146)).
- Submitting the form - the confirm button, or Enter in a field among `children` - calls `onConfirm`
  once, and never while `confirmDisabled` or `busy` holds. jsdom implements no implicit submission
  on Enter, so its tests submit the form directly or click the confirm button; the chat-demo's
  Playwright suite presses Enter in a `TextField` among `children` and asserts `onConfirm` ran once,
  and with `confirmDisabled` asserts it did not run, since a browser skips implicit submission when
  the form's default button is disabled ([validated by clicking confirm calls onConfirm once, and the submit never reaches a consumer's own form @0629daeb](../../tests/ConfirmDialog.test.tsx#L131), [validated by submitting the form directly calls onConfirm once and prevents the default @27c15e93](../../tests/ConfirmDialog.test.tsx#L146), [validated by while confirmDisabled holds, confirm carries the native attribute and a submit never calls onConfirm @c9338272](../../tests/ConfirmDialog.test.tsx#L155), [validated by disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text @da0db4e5](../../tests/ConfirmDialog.test.tsx#L184), [validated by Enter in a TextField among a ConfirmDialog's children confirms once and closes it @f841b2c6](../../examples/chat-demo/tests/docs.spec.ts#L639), [validated by with confirmDisabled, Enter in the TextField does not confirm until the typed reference matches @97806f04](../../examples/chat-demo/tests/docs.spec.ts#L653)).
- The cancel button and Escape call `onCancel` ([validated by the cancel button and Escape each call onCancel @b87383d5](../../tests/ConfirmDialog.test.tsx#L166)).
- While `confirmDisabled` holds, the confirm button carries the native `disabled` attribute ([validated by while confirmDisabled holds, confirm carries the native attribute and a submit never calls onConfirm @c9338272](../../tests/ConfirmDialog.test.tsx#L155)).
- `description` holds prose and no interactive element, as a selectable `Card`'s content holds none:
  a control there would sit first in DOM order and take initial focus, and its label would be read
  as part of the dialog's description.
- Opening focuses the first control in `children`, else the overflowing body when it is focusable,
  else the cancel button - never the confirm button ([validated by opening with no control in children focuses the cancel button, never confirm @33a9c48c](../../tests/ConfirmDialog.test.tsx#L176), [validated by opening focuses the first control in children, and Tab from the last control wraps inside @3c9d6e80](../../tests/helpers/modal-panel-contract.tsx#L170), [validated by `an overflowing prose-only body becomes a focusable region named by the <h2> and takes initial focus` @4bb41ddd](../../tests/helpers/modal-panel-contract.tsx#L246)).
- The form carries `noValidate`, so a `required` or typed `TextField` among `children` never raises
  the browser's own validation bubble, which would block `submit` and show a message in the
  browser's language rather than the consumer's; validation stays the consumer's, shown through
  `fieldError` and held through `confirmDisabled` ([validated by `one <form noValidate> holds description, children, then a secondary cancel and a danger submit confirm` @ee55a3f1](../../tests/ConfirmDialog.test.tsx#L94), [validated by with confirmDisabled, Enter in the TextField does not confirm until the typed reference matches @97806f04](../../examples/chat-demo/tests/docs.spec.ts#L653)).
- While `busy` holds, both buttons are disabled, Escape does nothing, and the confirm button's
  children are its text and then `<LoadingIcon ariaLabel="" />`, sized with the same
  `buttonIconClassNames[size]` class `Button` gives its `icon` (src/components/buttonStyles.ts),
  because `LoadingIcon`'s `<svg>` carries a `viewBox` and no size of its own and would otherwise
  render at the browser's default and stretch the button. The empty `ariaLabel` matters:
  `LoadingIcon` defaults it to `"Loading"` (src/icons/index.tsx) and names itself with it, and only
  a falsy label renders it aria-hidden (src/icons/Icon.tsx), so the button's accessible name stays
  the action and no English string leaks past the labels convention. It renders as a child, not
  through `Button`'s `icon` prop, which places the icon before the text and passes it no label. The
  icon carries `motion-reduce:animate-none`, so the spin stops under `prefers-reduced-motion`. No
  `aria-busy` is set: some screen readers hold back a busy region's content, and the panel takes
  focus while busy (below), so marking it busy could silence the focus move ([validated by disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text @da0db4e5](../../tests/ConfirmDialog.test.tsx#L184), [validated by without busy, the confirm button holds no spinner @9e650232](../../tests/ConfirmDialog.test.tsx#L203)).
- The busy state is announced through `labels.confirmBusy` (default `"Working, please wait"`): a
  `role="status"` span in the stylesheet's `bowman-sr-only` class sits in the panel from the first
  render, empty, and receives the label while `busy` holds and loses it when `busy` clears, so the
  live region exists before its text (specs/bowman-ui-toast/spec.md's lesson) and WCAG 2.2's
  status-message criterion (4.1.3) is met without moving focus to say it (decision 20). The text is
  never rendered from `busy`: the span's ref is a state setter, so the node itself is state, and an
  effect on `busy`, the label and that node writes the label into the span's `textContent`, and
  clears it, as the overflowing body's attributes are set on the node itself. The effect does not
  depend on `busy` alone, because the span exists only while the portal renders: a `ConfirmDialog`
  mounted closed and busy and opened later - the documentation page opens each state from its own
  trigger - and one hydrated open both reach a commit where `busy` has not changed but the span has
  just appeared. Either way the region mounts empty and fills after the commit. The span renders no
  children, so React never overwrites the text, and no state is set in an effect, which
  `react-hooks/set-state-in-effect` (eslint.config.mjs) forbids outside `Toast`'s recorded
  exemption. Its jsdom tests render open with `busy` true, and mount closed with `busy` true and
  then open, and assert the region holds the label in both; the empty first commit is the effect's
  ordering, which the A8 row hears by opening a dialog already busy as well as turning an open one
  busy. The assistive-technology pass's A8 row records what each screen reader announces ([validated by a polite bowman-sr-only status region sits in the panel empty, fills with confirmBusy while busy and empties when busy clears @92b5a9d0](../../tests/ConfirmDialog.test.tsx#L209), [validated by rendered open and busy, the status region holds the label @07d08359](../../tests/ConfirmDialog.test.tsx#L224), [validated by mounted closed and busy then opened, the status region holds the label @212f4d93](../../tests/ConfirmDialog.test.tsx#L230)).
- Entering `busy` while focus sits on one of the buttons it disables moves focus to the panel.
  `ConfirmDialog` passes `busy` to `ModalPanel`, and a layout effect there, whose dependencies
  include that container ref for the same reason, focuses the panel through it, only when `busy`
  turns true - read against a ref holding the previous `busy`, which starts at `false`, so a dialog
  that mounts open and busy counts as turning busy - and only when the panel is attached
  (`portalOpen`) and, at layout time, `document.activeElement` is a `disabled` element inside the
  panel, or is `<body>` or null, so a `ConfirmDialog` that turns busy while closed, or mounts closed
  and busy, focuses nothing. A dialog that opens already busy needs no rule of its own: focus then
  sits on the opener, outside the panel, so the guard leaves it to the trap, which records the
  opener as the element to return focus to before it moves focus in; and when nothing held focus and
  the dialog mounts open and busy, the layout effect focuses the panel first and the trap records
  it, a detached target on close that the skip in the `useFocusTrap` section passes over, leaving
  focus on `<body>` as it would have been anyway. A dialog mounted closed and busy and opened later
  re-runs the effect, since `portalOpen` changed, but sees no transition, because the
  previous-`busy` ref is updated on every run, open or closed, before the `portalOpen` guard
  returns; so the trap records `<body>` itself, with the same outcome. A field in `children` that
  held focus when Enter set `busy` keeps it. A jsdom test opens a dialog busy, closes it and asserts
  focus returns to the opener; another sets `busy` with focus in a field and asserts the field keeps
  focus; a third sets `busy` with nothing focused, `document.activeElement` being `<body>`, and a
  fourth stubs `document.activeElement` to null, and both assert the panel takes focus. Four more
  cover the rest of the guard: with focus on the confirm button, setting `busy` moves it to the
  panel; with focus on a disabled element outside the panel, it stays put; setting `busy` while the
  dialog is closed moves nothing; and clearing `busy` moves nothing. Each arm of the guard then has
  a test and the 100% branch floor holds. The guard's conditions exceed
  `bowman/max-boolean-operators`' two at an inline site, so they live in a named predicate whose
  return the rule exempts. No ref crosses the component boundary: a `panelRef` prop written by
  `ModalPanel` would fail `bowman/no-prop-mutation` (docs/design-notes.md § Lint guardrails), and
  `forwardRef` is allowed only in the fixture's exported components
  (tests/forward-ref-components.test.ts). The layout effect runs after React sets `disabled` and
  before the browser's focus fixup moves focus to `<body>`, while the button is still
  `document.activeElement`. Leaving `busy` leaves focus on the panel, where the next Tab reaches the
  re-enabled buttons (the second widened trap behaviour below). jsdom runs no focus fixup, so the
  claim that focus never reaches `<body>` is proven in the chat-demo's Playwright suite, which runs
  Chromium and WebKit (examples/chat-demo/playwright.config.ts). Its test focuses the confirm button
  and presses Enter rather than clicking it: WebKit on macOS does not focus a clicked button, so a
  click could leave focus on the panel without the layout effect ever running. Firefox is unproven,
  and the `<body>`-or-null branch of the guard covers an engine whose fixup runs first. jsdom proves
  the panel receives focus ([validated by opened already busy and then closed, focus returns to the opener @acb4ebe2](../../tests/ConfirmDialog.test.tsx#L238), [validated by setting busy with focus in a field among children leaves focus in the field @3e15f3ae](../../tests/ConfirmDialog.test.tsx#L252), [validated by setting busy with focus on the confirm button moves focus to the panel @0105fddd](../../tests/ConfirmDialog.test.tsx#L261), [validated by `setting busy while document.activeElement is <body> moves focus to the panel` @c7ce5a21](../../tests/ConfirmDialog.test.tsx#L270), [validated by setting busy while document.activeElement is null moves focus to the panel @30e956fb](../../tests/ConfirmDialog.test.tsx#L281), [validated by setting busy with focus on a disabled element outside the panel leaves it there @8fda698c](../../tests/ConfirmDialog.test.tsx#L292), [validated by setting busy while the dialog is closed moves nothing @6fd326a6](../../tests/ConfirmDialog.test.tsx#L303), [validated by clearing busy moves nothing, leaving focus on the panel @2200413e](../../tests/ConfirmDialog.test.tsx#L313), [validated by `Enter on the focused confirm button turns the dialog busy and moves focus to the panel, never to <body>` @e394a87e](../../examples/chat-demo/tests/docs.spec.ts#L681)).

### `useFocusTrap`: three widened behaviours

The shipped hook keeps its signature and every other behaviour
specs/bowman-ui-pure-hooks-error-boundary/spec.md pins, and gains three, which that spec's
`useFocusTrap` bullet records in the same pull request: ([validated by focuses the first focusable element when opened @88c2e5f9](../../tests/useFocusTrap.test.tsx#L94), [validated by Tab on the last element wraps to the first @77102a40](../../tests/useFocusTrap.test.tsx#L100), [validated by Shift+Tab on the first element wraps to the last @ece39e41](../../tests/useFocusTrap.test.tsx#L109), [validated by Escape calls onClose @03a2527a](../../tests/useFocusTrap.test.tsx#L136), [validated by closing returns focus to the trigger ref when one is given @aed68688](../../tests/useFocusTrap.test.tsx#L146))

- With no focusable element inside the open container, and only when the container itself can take
  focus - it carries a `tabindex` attribute, as `ModalPanel`'s panel's `tabIndex={-1}` does, and
  passes the same visibility check as the controls - opening focuses the container and Tab and
  Shift+Tab are prevented. A container that cannot take focus keeps today's early return, so Tab is
  left alone: `AppShell`'s drawer carries no `tabIndex` and is `md:hidden`, and it can stay open
  across a rotate to desktop width (src/components/AppShell.tsx handles that case for its scroll
  lock), where its controls are hidden and the trap finds none; without this condition every Tab on
  the page would be prevented, a keyboard trap (WCAG 2.1.2). tests/useFocusTrap.test.tsx's "an empty
  container leaves Tab handling alone", whose container carries no `tabIndex`, already pins that
  case and keeps passing; it is retitled to name the missing `tabindex` and gains an assertion that
  the event's `defaultPrevented` is false, and a new test opens a trap over an empty container
  rendered with the `Harness`'s new `tabIndex={-1}` option below, so only the visibility check can
  fail, stubs its `checkVisibility` to false and asserts the same. When focus has escaped the
  container, a prevented Tab also moves it back to the container, as the non-empty branch pulls
  escaped focus back to an end today (src/hooks/useFocusTrap.ts), so focus is never left stranded
  outside the modal; a new test opens an empty trap with the `tabIndex={-1}` option, focuses a
  button outside it, presses Tab and asserts the event is prevented and the container holds focus. A
  trap whose container is null - its ref not yet attached while `isOpen` holds - returns before
  `preventDefault`, so Tab is left alone and the page stays keyboard-usable:
  tests/useFocusTrap.test.tsx's "a never-attached container ref yields no focusable elements and no
  crash" presses Tab on such a trap and gains an assertion that the event's `defaultPrevented` is
  false beside its existing one that focus stays on `<body>` (see "Existing tests that change"). A
  busy `ConfirmDialog` with no fields therefore keeps focus on its panel instead of letting Tab
  leave the dialog. A new test pins this branch: the file's shared `Harness`, whose container
  carries no `tabIndex` today, gains an option that renders it with `tabIndex={-1}`, and the test
  opens an empty trap with it, asserts focus lands on the container, presses Tab and asserts the
  event is prevented (see "Existing tests that change") ([validated by an empty container without a tabindex leaves Tab handling alone @49cfd3ce](../../tests/useFocusTrap.test.tsx#L251), [validated by an empty container with a tabindex takes focus on open and Tab from it is prevented @813cc857](../../tests/useFocusTrap.test.tsx#L262), [validated by an empty container with a tabindex that fails the visibility check takes no focus and leaves Tab alone @34858645](../../tests/useFocusTrap.test.tsx#L271), [validated by Tab with focus escaped from an empty focusable container is prevented and pulls focus back to the container @ac9e7de5](../../tests/useFocusTrap.test.tsx#L285), [validated by a never-attached container ref yields no focusable elements and no crash @a6e4539d](../../tests/useFocusTrap.test.tsx#L172)).
- While focus sits on the container itself, Tab moves it to the first focusable element and
  Shift+Tab to the last. Without this, the container counts as inside the trap but is neither end,
  so no Tab is intercepted and a native Shift+Tab from the panel leaves it for the page's last
  tabbable element, which the portal places before the panel ([validated by Tab from the focused container itself reaches the first element @a65768b2](../../tests/useFocusTrap.test.tsx#L294), [validated by Shift+Tab from the focused container itself reaches the last element @cdf7f8ae](../../tests/useFocusTrap.test.tsx#L302)).
- Unmounting while open returns focus as closing does, through its own effect with an empty
  dependency array (`[]`), so it runs on mount and unmount only, whose cleanup reads the open state
  and the latest `triggerRef` from refs. Both refs are assigned inside an effect, never during
  render, which `react-hooks/refs` forbids, and the `[]` effect reads only them and the trap's own
  `previousActiveElement` ref, its fallback target, so `react-hooks/exhaustive-deps`, a warning that
  `--max-warnings 0` makes fatal, has nothing to report. A cleanup that runs because `isOpen` or
  `triggerRef` changed never returns focus, so a close returns it once and a new `triggerRef`
  mid-dialog returns it never. A return target that is no longer connected is skipped, with no
  fallback to the other target, on close as on unmount: both paths call one helper declared at
  module scope, so `exhaustive-deps` sees no dependency, and a close whose target was removed leaves
  focus where the browser put it, `<body>`, as the `returnFocusRef` advice above says. The check is
  defensive: `focus()` on a detached node is already a no-op in every engine and in jsdom, so its
  test, which removes the target before closing and asserts focus stays where it was, covers the
  branch rather than proving a change in behaviour. tests/useFocusTrap.test.tsx also gains a test
  for each widened behaviour: Tab and Shift+Tab from the focused container reach the first and last
  element; the `tabIndex={-1}` empty-trap test the first bullet of this section names covers Tab
  while the container itself holds focus, so no second one is written; unmounting while open returns
  focus to the opener; and a cleanup caused by `isOpen` or `triggerRef` changing returns focus at
  most once, on the close itself. `AppShell` unmounting with its drawer open -
  tests/AppShell.test.tsx does it - is the one existing caller this reaches. React detaches the
  hamburger's ref before the cleanup runs, so the target falls back to the element that held focus
  when the drawer opened: the detached hamburger, which is skipped, or `<body>` when the test opened
  the drawer by `fireEvent.click` without focusing it, which takes focus harmlessly. Under React's
  development StrictMode, the simulated unmount returns focus and the re-run open effect moves it
  back into the container ([validated by unmounting while open returns focus to the element that held it before opening @52422c57](../../tests/useFocusTrap.test.tsx#L310), [validated by unmounting while open returns focus to the latest trigger ref when one is given @9e74453b](../../tests/useFocusTrap.test.tsx#L325), [validated by a close returns focus once and a later unmount while closed returns it no more @767b09a9](../../tests/useFocusTrap.test.tsx#L339), [validated by a new triggerRef while open never returns focus @84ab1609](../../tests/useFocusTrap.test.tsx#L350), [validated by a return target removed before the close is skipped and focus stays where it was @e3a91e71](../../tests/useFocusTrap.test.tsx#L368)).
- Beside those three, the trap and `ModalPanel` count every natively tabbable element as a stop:
  `FOCUSABLE_SELECTOR` (src/hooks/focusableSelector.ts) gains a `<details>` element's first
  `<summary>`, an editing host (`contenteditable` not `"false"`), `<audio controls>`,
  `<video controls>` and `<iframe>`, each still excluded at `tabindex="-1"`. Without them a
  disclosure in a dialog's body - as `ThinkingTrace` and `ToolActivity` render one - is no end of
  the trap, so Tab and Shift+Tab wrap past its summary and a keyboard user never reaches it
  (WCAG 2.1.1), and a body holding only a summary counts as empty and takes a scroll tab stop. A
  summary inside a closed `<details>` stays a stop; the content the closed element hides stays out,
  through the visibility check. The selector is the shared one, so it widens for its other readers
  too: `useFocusGroups`' F6 move and `ErrorBoundary`'s recovery focus now land on such an element
  when it is the first in their group or recovered children ([validated by `a <details> summary is a trap stop: Shift+Tab from it wraps to the last, Tab from the last wraps to it` @35f45f31](../../tests/useFocusTrap.test.tsx#L401), [validated by matches a details' first summary, an editing host, controlled media and a frame, and not their opted-out variants @afc8d40e](../../tests/useFocusTrap.test.tsx#L415), [validated by `an overflowing body holding only a <details> summary is not empty: no tabindex, and the summary takes focus` @56842a84](../../tests/helpers/modal-panel-contract.tsx#L265), [validated by `Tab and Shift+Tab reach a <details> summary in the Dialog body, and Enter and Space toggle it` @f74993be](../../examples/chat-demo/tests/docs.spec.ts#L738)).

### `Notice`

```ts
export type NoticeTone = "info" | "success" | "warning" | "error";

export interface NoticeLabels {
  /** The dismiss button's accessible name; read only when `onDismiss` is given. */
  dismissNotice: string;
}

export const defaultNoticeLabels: Readonly<Required<NoticeLabels>>;
// { dismissNotice: "Dismiss" }

export interface NoticeProps {
  tone: NoticeTone;
  heading?: ReactNode;
  children: ReactNode;
  /** When given, a dismiss button renders and calls it; the consumer stops rendering the notice. */
  onDismiss?: () => void;
  labels?: Partial<NoticeLabels>;
}

export const Notice: (props: NoticeProps) => ReactElement;
```

- Renders one container with an aria-hidden tone icon - `InfoIcon`, `CheckIcon`, `WarningIcon` or
  `ErrorIcon` - then `heading` in bold and `children`. The heading is a bold `<span>`, not a heading
  element, unlike a static `Card`'s `<h3>`: a notice sits inside the content it qualifies, often
  several to a page, and an outline entry per notice would bury the page's own headings; the live
  region and the icon already set it apart ([validated by](../../tests/Notice.test.tsx#L29), [validated by `heading renders in a bold TEXT_STRONG <span>, never a heading element, and children in TEXT_BODY` @fef9bfed](../../tests/Notice.test.tsx#L65), [validated by without heading, no heading span renders @30c0d81a](../../tests/Notice.test.tsx#L80)).
- `info` and `success` render with `role="status"`; `warning` and `error` render with `role="alert"`
  (decision 10). The role sits on an inner wrapper around the icon, `heading` and `children`, never
  on the outer container, so the dismiss button, the wrapper's sibling, is not read as part of the
  announcement ([validated by](../../tests/Notice.test.tsx#L29), [validated by with onDismiss, a ghost IconButton named "Dismiss" sits outside the live region and calls onDismiss @45288c2d](../../tests/Notice.test.tsx#L92)).
- Every tone renders on `SURFACE` inside `BORDER`, with `heading` in `TEXT_STRONG` and `children` in
  `TEXT_BODY`, so no text sits on a tinted surface. The tone colours only the icon and a 4px left
  border: `info` the new `--bowman-info`, `success` `--bowman-success`, `warning` the new
  `--bowman-warning`, `error` `--bowman-danger`, through four new class strings in
  `src/theme/tokens.ts`, `INFO_TONE`, `SUCCESS_TONE`, `WARNING_TONE` and `DANGER_TONE`, each pairing
  the role's `text-` and `border-l-` utilities in both schemes. The container carries its tone's
  string beside `border-l-4` and the icon takes the colour through `currentColor`; the container
  also carries `BORDER` for its other three sides, and the tone's `border-l-*` wins on the left only
  because Tailwind v4 emits `border-left-color` after `border-color` in both schemes - the generated
  order the `TextField` bullet refuses to rely on between two strings of one property, accepted here
  because the two set different properties and the documentation-page matrix measures the outcome
  (decision 19), while `heading` and `children` set their own. They differ from `DANGER` and
  `SUCCESS`, which colour text only, so no class string is declared twice, and `Notice` imports
  neither: `DANGER` gains only `TextField` and `SUCCESS` no reader ([validated by @4f0384b9](../../tests/Notice.test.tsx#L53), [validated by `heading renders in a bold TEXT_STRONG <span>, never a heading element, and children in TEXT_BODY` @fef9bfed](../../tests/Notice.test.tsx#L65), [validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
- Without `onDismiss` it renders no button. With it, a `ghost` `IconButton` holding `CloseIcon`,
  named by `labels.dismissNotice` (default `"Dismiss"`), sits at the container's trailing edge and
  calls `onDismiss` on a click. `Notice` keeps no open state of its own: the consumer stops
  rendering it (decision 18). The dismiss button leaves with the notice, so the consumer moves focus
  in `onDismiss` before it stops rendering the notice - to the control that showed it or another
  element that stays - because focus on a removed button lands on `<body>`. `Notice` cannot do it,
  holding no reference to the page around it; the chat-demo's `Notice` page shows the pattern ([validated by without onDismiss, no button renders @2bc36f09](../../tests/Notice.test.tsx#L86), [validated by with onDismiss, a ghost IconButton named "Dismiss" sits outside the live region and calls onDismiss @45288c2d](../../tests/Notice.test.tsx#L92), [validated by labels={{ dismissNotice: "Luk" }} names the dismiss button @fd612a23](../../tests/Notice.test.tsx#L108), [validated by dismissing the notice moves focus to the button that stays, which shows it again @5620b095](../../examples/chat-demo/tests/docs.spec.ts#L781)).
- No timer: a notice states a condition for as long as the consumer renders it.

### `KeyValueList`

```ts
export interface KeyValuePair {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

export interface KeyValueListProps {
  pairs: readonly KeyValuePair[];
  /** Default "inline": label and value side by side; "stacked": value under label. */
  layout?: "inline" | "stacked";
}

export const KeyValueList: (props: KeyValueListProps) => ReactElement | null;
```

- The prop is `pairs`, not `items`, and its type `KeyValuePair`: `re-lint/no-vague-names` blocks
  `items` and `item` in `src/**` (eslint.config.mjs), so the plain destructure and its `.map`
  callback would fail lint.
- Renders one `<dl>` holding, per pair and in order, a `<div>` with a `<dt>` for `label` and a
  `<dd>` for `value`, keyed by `key` ([validated by `renders one <dl> holding, per pair and in order, a <div> with a <dt> label and a <dd> value` @1691a21f](../../tests/KeyValueList.test.tsx#L20)).
- `layout` changes only the classes, never that structure. `inline` lays each `<div>` out as a row,
  the `<dt>` at a third of the width and the `<dd>` beside it; `stacked` puts the `<dd>` under the
  `<dt>`. An empty `pairs` renders nothing ([validated by `the default "inline" layout lays each row out side by side with the <dt> at a third of the width` @ebe32f50](../../tests/KeyValueList.test.tsx#L30), [validated by layout="stacked" keeps the same structure and drops the row layout @9e4b3722](../../tests/KeyValueList.test.tsx#L37), [validated by an empty pairs renders nothing @093364f1](../../tests/KeyValueList.test.tsx#L63)).
- Every `<dt>` is small text in `TEXT_MUTED` and every `<dd>` small text in `TEXT_STRONG`. The list
  paints no background: it sits on the surface of whatever holds it, a static `Card` or a `Dialog`
  panel on `SURFACE` in this package, which the contrast table measures ([validated by `every <dt> is small TEXT_MUTED text and every <dd> small TEXT_STRONG text, with no background` @84825d40](../../tests/KeyValueList.test.tsx#L48)).

### `Card`

```ts
export interface CardProps {
  heading?: ReactNode;
  children: ReactNode;
  /** When given, the whole card is one button. */
  onSelect?: () => void;
  /** Applies only with `onSelect`; a static card has no disabled state. */
  disabled?: boolean;
}

export const Card: ForwardRefExoticComponent<CardProps & RefAttributes<HTMLElement>>;
```

- On a selectable card `heading` renders in a bold block `<span>`, because a `<button>` may hold
  phrasing content only. On a static card it renders as an `<h3>` in the same bold style, so the
  heading keeps its semantics in the page's outline (WCAG 1.3.1); a consumer whose page needs
  another level wraps the card's content itself ([validated by `renders a <div> on SURFACE and BORDER with no role and no name, its heading an <h3>` @3e7ec05c](../../tests/Card.test.tsx#L21), [validated by `with onSelect and a heading, one left-aligned <button type=button> is named by the heading and described by the body` @25410157](../../tests/Card.test.tsx#L52)).
- Without `onSelect` it renders a `<div>` on the `--bowman-surface` and `--bowman-border` roles,
  with no role and no accessible name, so a page of cards adds no landmarks; `disabled` renders
  nothing on it ([validated by `renders a <div> on SURFACE and BORDER with no role and no name, its heading an <h3>` @3e7ec05c](../../tests/Card.test.tsx#L21), [validated by `disabled renders nothing on a static card, and without heading no <h3> renders` @21a0012f](../../tests/Card.test.tsx#L42)).
- Both forms paint `heading` in `TEXT_STRONG` and `children` in `TEXT_BODY`, so a card's text never
  inherits the page's colour, as the `Dialog` panel's does not ([validated by `renders a <div> on SURFACE and BORDER with no role and no name, its heading an <h3>` @3e7ec05c](../../tests/Card.test.tsx#L21), [validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
- With `onSelect` the whole card renders as one `<button type="button">`, left-aligned, with the
  shared offset ring, `FOCUS_RING` from `src/theme/focusRing.ts` beside `ring-offset-2`, which stays
  at each site (docs/design-notes.md § Theming decision 12), no `shadow-*` utility (the `ModalPanel`
  section gives the reason), and a `--bowman-surface-hover` hover. With a `heading`, the button is
  named by it through `aria-labelledby` and described by `children`, wrapped in a `<span>`, through
  `aria-describedby`, so a long body never becomes the name; without one, its accessible name is its
  content. The plan names the card from its visible content; naming it from the heading alone, when
  there is one, is a deliberate deviation (decision 7): a screen reader then reads a short name and
  the body after it, not the whole card as one name. Its `heading` and `children` must be phrasing
  content only - text, inline elements, icons - with no interactive element, because a `<button>`
  may hold nothing else: no `<p>`, no `<div>`, and no `KeyValueList`, whose `<dl>` belongs in a
  static card. A click or Enter or Space calls `onSelect`; `disabled` renders the native attribute
  and the call never fires, and the card takes `Button`'s
  `disabled:cursor-not-allowed disabled:opacity-50` pair with no hover surface ([validated by `with onSelect and a heading, one left-aligned <button type=button> is named by the heading and described by the body` @25410157](../../tests/Card.test.tsx#L52), [validated by without a heading, the button's name is its content and it carries no aria-labelledby @50d14afc](../../tests/Card.test.tsx#L71), [validated by `carries the shared offset ring beside ring-offset-2, a SURFACE_HOVER hover and no shadow` @112b46d0](../../tests/Card.test.tsx#L79), [validated by a click calls onSelect once @b0132dbb](../../tests/Card.test.tsx#L90), [validated by disabled renders the native attribute and the disabled pair with no hover surface, and a click never calls onSelect @f3011fd7](../../tests/Card.test.tsx#L99)).
- The `ref` reaches the `<div>` or the `<button>`; it is typed `HTMLElement`, and each branch
  attaches it with a cast to its own element's ref type ([validated by `renders a <div> on SURFACE and BORDER with no role and no name, its heading an <h3>` @3e7ec05c](../../tests/Card.test.tsx#L21), [validated by `with onSelect and a heading, one left-aligned <button type=button> is named by the heading and described by the body` @25410157](../../tests/Card.test.tsx#L52)).

## Existing tests that change

The plan's backward-compatibility target is "every existing test passing unchanged". It holds for
the behaviour of every shipped component; the tests below are the complete list that change a
fixture, a map, a title or an assertion in the same pull request, and each spec statement that cites
them moves with it. Every other existing test passes unchanged.

- tests/SearchField.test.tsx's test that `defaultSearchFieldLabels` is frozen and equals its two
  keys, whose title spells both, gains `submitSearch` in its expected object and its title; its
  titled link in specs/bowman-ui-styled-primitives/spec.md moves with it ([validated by defaultSearchFieldLabels is frozen and equals { searchInput: "Search", searchPlaceholder: "Search...", submitSearch: "Submit search" } @c472eff1](../../tests/SearchField.test.tsx#L199)).
- tests/SearchField.test.tsx "renders no button - no clear control and no submit" is retitled to say
  it renders no button without `onSubmit`, and the statement it validates in
  specs/bowman-ui-styled-primitives/spec.md ("No clear button, no submit, no debounce") becomes "No
  clear button and no debounce; a submit button only with `onSubmit`", citing this spec ([validated by renders no button without onSubmit - no clear control and no submit @a47ff0b5](../../tests/SearchField.test.tsx#L76)).
- tests/labelled-exports.test.tsx: `searchFieldSentinels` gains `submitSearch`, or "SearchField's
  sentinel labels cover every defaultSearchFieldLabels key" fails, and the `SearchField` harness
  passes an `onSubmit`, as the new `Notice` harness passes an `onDismiss`, so the key is on the
  page. Its bucket comment, which names `ChatMessageList`'s and `IconButton`'s labels props as the
  required ones, names all five ([validated by SearchField's sentinel labels cover every defaultSearchFieldLabels key @45ff9aa9](../../tests/labelled-exports.test.tsx#L781), [validated by no run of three Latin letters survives outside the sentinels for any labelsProp member @ffb54b18](../../tests/labelled-exports.test.tsx#L807)).
- tests/Button.test.tsx "every variant keeps focus:ring-2 ring-offset-2 beside the
  --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair" renders a
  `danger` button beside the three it renders today, so "every variant" stays true ([validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @512e1f83](../../tests/Button.test.tsx#L121)).
- tests/styles.test.ts "styles.css declares the bowman-sr-only rule the markdown notice, Toast,
  ConversationList, ChatComposer and useFocusGroups depend on" is retitled to name `ConfirmDialog`
  among them, and its titled link in specs/bowman-ui-stylesheet-entry/spec.md moves with it
  (§ Documentation) ([validated by styles.css declares the bowman-sr-only rule the markdown notice, Toast, ConversationList, ChatComposer, ConfirmDialog and useFocusGroups depend on @888966ba](../../tests/styles.test.ts#L156)).
- tests/useFocusTrap.test.tsx "an empty container leaves Tab handling alone" is retitled to name the
  missing `tabindex` and gains a `defaultPrevented` assertion, and its shared `Harness` gains a
  `tabIndex={-1}` option for a new test; "a never-attached container ref yields no focusable
  elements and no crash" gains a `defaultPrevented` assertion; both as the `useFocusTrap` section
  above records ([validated by an empty container without a tabindex leaves Tab handling alone @49cfd3ce](../../tests/useFocusTrap.test.tsx#L251), [validated by an empty container with a tabindex takes focus on open and Tab from it is prevented @813cc857](../../tests/useFocusTrap.test.tsx#L262), [validated by a never-attached container ref yields no focusable elements and no crash @a6e4539d](../../tests/useFocusTrap.test.tsx#L172)).
- tests/theming-tokens-dist.test.ts: its `EXPECTED_FALLBACKS` and `NEUTRAL_ROLE_READERS` maps and
  its `FOCUS_RING` reader list grow, and the `it()` titled "exactly the five offset-ring components"
  is retitled for six and also pins `FOCUS_VISIBLE_RING`'s composition and its one importer, as
  § Theming below lists ([validated by each token falls back to the same palette value at every site, matching the declared default @8ec9e511](../../tests/theming-tokens-dist.test.ts#L352), [validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381), [validated by `dist/theme/focusRing.js composes FOCUS_RING and FOCUS_VISIBLE_RING from the tokens module's ring colour and offset, exactly the six offset-ring components import FOCUS_RING, and ModalPanel alone imports FOCUS_VISIBLE_RING` @6a7f5e79](../../tests/theming-tokens-dist.test.ts#L447)).
- examples/chat-demo/tests/theming.spec.ts: "the chat matrix reaches every token the installed
  stylesheet declares, and the wrapper sets the same set" is retitled and widened to accept the nine
  new tokens' sites on the documentation pages (decision 19); its header comment, and the theming
  spec's statement it validates, move with it, and it reads `docsTokenPages` from the chat-demo's
  tests/helpers ([validated by the chat matrix and the documentation pages together reach exactly every token the installed stylesheet declares, the chat lacking only the confirm-dialog and notice pages' tokens, which the wrapper run reaches too, and the wrapper sets the same set @bc0935fe](../../examples/chat-demo/tests/theming.spec.ts#L413)).
- tests/fixtures/public-api.json gains the new names (§ The published surface) and
  tests/fixtures/forward-ref-components.json gains `TextField` and `Card`; the header comment of
  tests/forward-ref-components.test.ts speaks of a ninth forwardRef component ([validated by @3c9682f2](../../tests/public-api.test.ts#L40), [validated by @1a95e338](../../tests/public-api.test.ts#L46), [validated by every committed forwardRef component is a forwardRef exotic component in the built package @592f3970](../../tests/forward-ref-components.test.ts#L30), [validated by the built exports that are forwardRef exotic components are exactly the committed forwardRef components @27ab2b36](../../tests/forward-ref-components.test.ts#L38)).
- tests/icons.test.tsx "no file outside an explicit allowlist declares a name string member":
  its allowlist gains src/components/TextField.tsx, whose `name?: string` prop is the input's
  native form-field name, not an icon lookup ([validated by no file outside an explicit allowlist declares a name string member @7408f8c5](../../tests/icons.test.tsx#L90)).
- tests/check-at-pass.test.ts: its hard-coded `rowIds` list, which mirrors
  `scripts/check-at-pass.mjs`'s unexported `ROWS`, gains A8 and A9 (§ Accessibility checks) ([validated by --structure and --freshness both pass on a complete, current record @3536cfed](../../tests/check-at-pass.test.ts#L161), [validated by a single stack that was run is a complete record @59da55b8](../../tests/check-at-pass.test.ts#L471)).
- examples/chat-demo/tests/docs.spec.ts: `docsTokenPages` gains the new pages' token sites and moves
  to the chat-demo's tests/helpers, the suite gains a wrapper-theme run like the theming suite's
  (decision 19), and its literal `componentIds` list, which drives the index test's "every component
  link" and "every component page renders its purpose, import, usage, props and states", gains the
  six new pages' ids ([validated by bare / renders the index with the hero image and every component link @fc8a9ee5](../../examples/chat-demo/tests/docs.spec.ts#L86), [validated by every component page renders its purpose, import, usage, props and states @5b9e2905](../../examples/chat-demo/tests/docs.spec.ts#L129), [validated by @e45eed6e](../../examples/chat-demo/tests/docs.spec.ts#L293)).

## Conventions every new component follows

- `TextField`, `Dialog`, `ConfirmDialog`, `Notice`, `Card` and the internal `ModalPanel` open with
  `"use client"`, each for a trigger docs/design-notes.md decision 1 measures: an `on[A-Z]` JSX
  handler (all six, `Notice` for its dismiss button), a hook (`useId`, `useSyncExternalStore`,
  `useFocusTrap`, and in `ModalPanel` the busy layout effect) and, in `ModalPanel`, `document.body`
  as the portal target. `SearchField` already carries the directive. `KeyValueList` takes no handler
  and calls no hook, so its built file carries no directive and stays server-safe. The RSC fixture's
  page (examples/rsc-fixture/app/page.tsx), which renders only icons, `IconWrapper`, `ChatMessage`
  and `ChatMessageList` today, gains a `KeyValueList` and an `info` `Notice` without `onDismiss` in
  its server component, and scripts/rsc-fixture.sh, which greps the response only for the icons'
  markup and the export count today, also greps it for the `<dl>` and for the notice's
  `role="status"` together with the notice's own text, so the proof stays specific if another status
  element joins the page, so `npm run rsc` proves both render on the server;
  specs/bowman-ui-rsc-fixture/spec.md's statement of what the page renders gains them, and
  `npm run reanchor` heals its page.tsx line links ([validated by @aa2dfde1](../../tests/form-dialog-notice-dist.test.ts#L23), [validated by dist/components/KeyValueList.js exists and does not open with "use client"; @da69d141](../../tests/form-dialog-notice-dist.test.ts#L27), [validated by exits zero against src/ and dist/ @9fb125f7](../../tests/client-directives.test.ts#L90), [validated by @99edb3da](../../scripts/rsc-fixture.sh#L168), [validated by @e344daae](../../scripts/rsc-fixture.sh#L175)).
- `TextField` and `Card` are `forwardRef` components under decision 4, and
  tests/fixtures/forward-ref-components.json gains both, or tests/forward-ref-components.test.ts
  fails; docs/design-notes.md § Styled primitives' "`Button`, `IconButton` and `SearchField` are
  `forwardRef` components" names them too. The fixture grows from six entries to eight, so the test
  file's header comment, which speaks of "a seventh forwardRef component", speaks of a ninth.
  `Dialog` and `ConfirmDialog` hand back no element, though the plan asks every focusable element to
  forward its ref: their panel is focusable only as the trap's fallback target, the trap decides
  where focus goes, and a consumer that needs focus elsewhere puts it on a control in `children`
  with its own ref. `Notice` forwards no ref either, though its dismiss button is focusable: the
  button exists only to remove the notice, so focus never needs to return to it, and the consumer
  moves focus away from it in `onDismiss` (the `Notice` section). `SearchField`'s new submit button
  gets no ref of its own: `SearchField` forwards its ref to the input, as § Styled primitives
  records, and focus that needs to return after a search returns to the input, where the user types
  the next query ([validated by every committed forwardRef component is a forwardRef exotic component in the built package @592f3970](../../tests/forward-ref-components.test.ts#L30), [validated by the built exports that are forwardRef exotic components are exactly the committed forwardRef components @27ab2b36](../../tests/forward-ref-components.test.ts#L38), [validated by the source files that call forwardRef are exactly the committed declaring files, each declaring its name @bc17ebd7](../../tests/forward-ref-components.test.ts#L48), [validated by `a visible <label> holding fieldLabel names the input, and the ref reaches the input` @28c0dce2](../../tests/TextField.test.tsx#L24), [validated by `renders a <div> on SURFACE and BORDER with no role and no name, its heading an <h3>` @3e7ec05c](../../tests/Card.test.tsx#L21), [validated by `the forwarded ref reaches the <input>` @8a1a68d3](../../tests/SearchField.test.tsx#L54)).
- No component takes `className`, `style` or a render prop (§ Styled primitives) ([validated by tsc accepts form-dialog-notice-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @3a29614b](../../tests/form-dialog-notice-dist.test.ts#L36)).
- No icon is added: `CloseIcon`, `LoadingIcon`, `SearchIcon`, `InfoIcon`, `CheckIcon`, `WarningIcon`
  and `ErrorIcon` already ship ([validated by exports exactly the 24 icon components plus IconWrapper and getAccessibleIconProps @52b2a89a](../../tests/icons.test.tsx#L57)).
- No keyframe is added. The busy `LoadingIcon` is the only motion, stopped by
  `motion-reduce:animate-none` in CSS, so `useReducedMotion` has nothing to gate ([validated by declares exactly the four keyframes bowman-fade-in, bowman-toast-fade-in, bowman-fade-dot and bowman-pulse-subtle @4d80b735](../../tests/styles.test.ts#L32), [validated by disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text @da0db4e5](../../tests/ConfirmDialog.test.tsx#L184)).
- Fixture data in every test is invented.
- The `Dialog` and `ConfirmDialog` sentinel harnesses in tests/labelled-exports.test.tsx return the
  portalled panel, found by role and its sentinel title (`screen.getByRole("dialog", { name })` and
  `screen.getByRole("alertdialog", { name })`, so an earlier harness's dialog never matches), not
  the render container, which the portal leaves empty, and not `document.body`: "no run of three
  Latin letters survives outside the sentinels for any labelsProp member" renders every harness in
  one `it()` without cleanup, so `document.body` would still hold the earlier harnesses' text and
  fail it. Their behaviour tests call `stubFocusEnvironment` (tests/helpers/focus-environment.ts):
  jsdom 30 has no `checkVisibility` and reports a null `offsetParent`, so without the stub every
  control and the panel itself read as hidden, so the trap finds nothing to focus and the focus
  assertions fail. The portal, trap, focus-return and hydration assertions both components share
  live in one routine in tests/helpers/, which tests/Dialog.test.tsx and
  tests/ConfirmDialog.test.tsx each call with their own render, so the copy-paste gate at
  min-tokens 50 finds no clone (docs/design-notes.md § Lint guardrails decision 12) ([validated by Dialog's sentinel labels cover every defaultDialogLabels key plus the required dialogTitle @4c095324](../../tests/labelled-exports.test.tsx#L791), [validated by ConfirmDialog's sentinel labels cover every defaultConfirmDialogLabels key plus the required dialogTitle and confirmAction @c57256a5](../../tests/labelled-exports.test.tsx#L797), [validated by no run of three Latin letters survives outside the sentinels for any labelsProp member @ffb54b18](../../tests/labelled-exports.test.tsx#L807), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17), [validated by @bb94a4d9](../../tests/ConfirmDialog.test.tsx#L55)).
- tests/labelled-exports.test.tsx gains one key-coverage `it()` per new labelled component, in the
  shapes the file already uses: `TextField`'s sentinels are exactly `fieldLabel`, `fieldHint` and
  `fieldError`, as `IconButton`'s are exactly its one required key, because it ships no defaults
  object; `Dialog`'s cover every `defaultDialogLabels` key plus the required `dialogTitle`, and
  `ConfirmDialog`'s every `defaultConfirmDialogLabels` key plus the required `dialogTitle` and
  `confirmAction`, as `ChatMessageList`'s cover its defaults plus `aiDisclosure`; `Notice`'s cover
  every `defaultNoticeLabels` key ([validated by TextField's sentinel labels are exactly fieldLabel, fieldHint and fieldError @ca282007](../../tests/labelled-exports.test.tsx#L787), [validated by Dialog's sentinel labels cover every defaultDialogLabels key plus the required dialogTitle @4c095324](../../tests/labelled-exports.test.tsx#L791), [validated by ConfirmDialog's sentinel labels cover every defaultConfirmDialogLabels key plus the required dialogTitle and confirmAction @c57256a5](../../tests/labelled-exports.test.tsx#L797), [validated by Notice's sentinel labels cover every defaultNoticeLabels key @06e3129c](../../tests/labelled-exports.test.tsx#L803)).
- A new tests/form-dialog-notice-dist.test.ts, built on tests/helpers/built-package.ts's
  `expectClientDirectiveFirst`, `expectPackedWithTypes` and `expectTypeAssertionsCompile` rather
  than tests/primitives-dist.test.ts's hand-rolled `opensWithUseClient`, so the copy-paste gate
  finds no clone, checks the new built files' directives (the six client files, `TextField.js`,
  `Dialog.js`, `ConfirmDialog.js`, `Notice.js`, `Card.js` and `ModalPanel.js`, open with
  `"use client"`, and `KeyValueList.js` does not, a negative check it makes by calling the helpers'
  `stripLeadingTrivia` directly, since `expectClientDirectiveFirst` only asserts presence) and
  compiles a new tests/types/form-dialog-notice-type-assertions.tsx against dist/. That file's
  `@ts-expect-error` fixtures pin that omitting `labels`, or `labels` without `fieldLabel`,
  `dialogTitle` or `confirmAction`, is a compile error; that no new component takes `className`;
  that a `SearchFieldLabels` object without `submitSearch` is a compile error; and, with no
  `@ts-expect-error`, that `variant="danger"` compiles on `Button` and `IconButton`.
  tests/primitives-dist.test.ts and its assertions file stay as they are, but for one comment: the
  assertions file's "an object missing searchPlaceholder" names `submitSearch` too, since the object
  now lacks both, and the assertion beneath it still holds ([validated by @aa2dfde1](../../tests/form-dialog-notice-dist.test.ts#L23), [validated by dist/components/KeyValueList.js exists and does not open with "use client"; @da69d141](../../tests/form-dialog-notice-dist.test.ts#L27), [validated by npm pack --dry-run ships the seven new component files with their d.ts files @a4edf9e5](../../tests/form-dialog-notice-dist.test.ts#L32), [validated by tsc accepts form-dialog-notice-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @3a29614b](../../tests/form-dialog-notice-dist.test.ts#L36)).

## Theming

Nine `--bowman-*` custom properties join the 44, for 53, each read only through a `var()` fallback: ([validated by the tokens read in dist/theme/tokens.js and dist/styles.css are exactly the declared ones @f288d8f2](../../tests/theming-tokens-dist.test.ts#L332), [validated by `every --bowman-* occurrence outside the declaration block is a var() read with a non-empty fallback` @81ab886d](../../tests/theming-tokens-dist.test.ts#L338), [validated by each token falls back to the same palette value at every site, matching the declared default @8ec9e511](../../tests/theming-tokens-dist.test.ts#L352), [validated by the spelled token counts in docs/design-notes.md § Theming, .specify/spec.md, the theming spec, README.md and the demo sources equal the declaration block @2a3da4c8](../../tests/theming-tokens-dist.test.ts#L491))

| Property                          | Fallback                 | Role                            |
| --------------------------------- | ------------------------ | ------------------------------- |
| `--bowman-danger-fill`            | `var(--color-red-600)`   | `danger` button fill (light)    |
| `--bowman-danger-fill-dark`       | `var(--color-red-600)`   | the same fill (dark)            |
| `--bowman-danger-fill-hover`      | `var(--color-red-700)`   | its hover (light)               |
| `--bowman-danger-fill-hover-dark` | `var(--color-red-700)`   | its hover (dark)                |
| `--bowman-text-on-danger`         | `var(--color-white)`     | text on the danger fill         |
| `--bowman-info`                   | `var(--color-blue-600)`  | info icon and border (light)    |
| `--bowman-info-dark`              | `var(--color-blue-400)`  | info icon and border (dark)     |
| `--bowman-warning`                | `var(--color-amber-700)` | warning icon and border (light) |
| `--bowman-warning-dark`           | `var(--color-amber-300)` | warning icon and border (dark)  |

Every pair a component renders text on meets WCAG 2.2 AA's 4.5:1 and every icon, tone border and
focus indicator meets the 3:1 non-text minimum, in both themes ([validated by @f85cc2ec](../../examples/chat-demo/tests/accessibility.spec.ts#L109), [validated by @e7fcfaa5](../../examples/chat-demo/tests/accessibility.spec.ts#L120), [validated by @5fbb4b7b](../../examples/chat-demo/tests/accessibility.spec.ts#L141)). The table in
docs/design-notes.md § Theming records no ratio, so § Theming gains a paragraph holding the measured pairs below in the same
pull request. Measured from Tailwind v4's palette for the fallbacks:

| Pair                                                     | Light   | Dark    | Minimum |
| -------------------------------------------------------- | ------- | ------- | ------- |
| `TEXT_ON_DANGER` on `DANGER_FILL`                        | 4.76:1  | 4.76:1  | 4.5:1   |
| `TEXT_ON_DANGER` on `DANGER_FILL_HOVER`                  | 6.42:1  | 6.42:1  | 4.5:1   |
| `DANGER` (`TextField` error text) on surface             | 4.76:1  | 6.17:1  | 4.5:1   |
| `TEXT_MUTED` (`TextField` hint) on surface               | 4.77:1  | 6.79:1  | 4.5:1   |
| `TEXT_STRONG` (`TextField` label and input text)         | 17.84:1 | 16.28:1 | 4.5:1   |
| `CONTROL_BORDER` (`TextField` border)                    | 4.77:1  | 6.79:1  | 3:1     |
| `DANGER_BORDER` (invalid `TextField` border)             | 4.76:1  | 6.17:1  | 3:1     |
| `TEXT_BODY` (panel, card and notice body) on surface     | 10.34:1 | 14.49:1 | 4.5:1   |
| `TEXT_STRONG` (panel, card and notice heading)           | 17.84:1 | 16.28:1 | 4.5:1   |
| `TEXT_BODY` on `SURFACE_HOVER` (hovered card body)       | 9.88:1  | 11.90:1 | 4.5:1   |
| `TEXT_STRONG` on `SURFACE_HOVER` (hovered heading)       | 17.05:1 | 13.37:1 | 4.5:1   |
| `TEXT_MUTED` (`KeyValueList` term)                       | 4.77:1  | 6.79:1  | 4.5:1   |
| `TEXT_STRONG` (`KeyValueList` value)                     | 17.84:1 | 16.28:1 | 4.5:1   |
| `info` icon and border on surface                        | 5.26:1  | 6.77:1  | 3:1     |
| `success` icon and border on surface                     | 3.22:1  | 10.05:1 | 3:1     |
| `warning` icon and border on surface                     | 5.05:1  | 12.34:1 | 3:1     |
| `error` icon and border on surface                       | 4.76:1  | 6.17:1  | 3:1     |
| `TEXT_SECONDARY` (ghost close, dismiss and submit icons) | 7.56:1  | 6.79:1  | 3:1     |
| `FOCUS_RING_COLOR` on its `RING_OFFSET`                  | 3.76:1  | 6.77:1  | 3:1     |

The same pull request moves every place tests/theming-tokens-dist.test.ts pins the count or the
token set, or the suite reds: ([validated by dist/styles.css opens with one comment line per token, each stating its default @87f73091](../../tests/theming-tokens-dist.test.ts#L325), [validated by the spelled token counts in docs/design-notes.md § Theming, .specify/spec.md, the theming spec, README.md and the demo sources equal the declaration block @2a3da4c8](../../tests/theming-tokens-dist.test.ts#L491))

- the `src/styles.css` comment block, one line per new token, and the existing lines whose readers
  gain a component: `--bowman-danger` (`TextField`'s error text and border, `Notice`'s error tone),
  `--bowman-success` (`Notice`'s success tone), and the neutral roles the new components paint, such
  as `--bowman-surface` and `--bowman-border` ([validated by dist/styles.css opens with one comment line per token, each stating its default @87f73091](../../tests/theming-tokens-dist.test.ts#L325), [validated by the tokens read in dist/theme/tokens.js and dist/styles.css are exactly the declared ones @f288d8f2](../../tests/theming-tokens-dist.test.ts#L332)).
- docs/design-notes.md § Theming: its table, including the "Read by" column of those same existing
  rows; its three spelled counts; and the group breakdown in its opening sentence, whose
  semantic-colour group grows from eight to seventeen and whose parenthetical, which names only the
  danger and success roles, names the danger-fill, info and warning roles beside them under
  decision 6; and the sentence after it, which lists "the danger role's red text and soft surface,
  and the success role's green text and soft fill" as read through a `var()`, names the danger fill,
  info and warning colours too ([validated by the token table in docs/design-notes.md § Theming lists the same names and fallbacks, in the declared order @da70dd1c](../../tests/theming-tokens-dist.test.ts#L417), [validated by the group breakdown spelled in docs/design-notes.md § Theming and the theming spec sums to the declaration block @cc9d504c](../../tests/theming-tokens-dist.test.ts#L512)).
- docs/design-notes.md § Theming decision 12, which names the `FOCUS_RING` module's "five
  importers - `AppShell`, `AppSidebar`, `ConversationList`, `PromptChips` and `buttonStyles`", gains
  `Card` as the sixth, and records `FOCUS_VISIBLE_RING` beside it: the same two imports, a
  `focus-visible:` ring, and `ModalPanel` as its only importer, for the panel and scrolling body a
  mouse click can focus ([validated by `dist/theme/focusRing.js composes FOCUS_RING and FOCUS_VISIBLE_RING from the tokens module's ring colour and offset, exactly the six offset-ring components import FOCUS_RING, and ModalPanel alone imports FOCUS_VISIBLE_RING` @6a7f5e79](../../tests/theming-tokens-dist.test.ts#L447)).
- `specs/bowman-ui-theming-tokens/spec.md`: its four spelled counts and its group breakdown; its
  § Semantic colour roles, which names only the danger and success roles, gains the danger-fill,
  info and warning roles; its § What stays palette-mapped gains the dialog overlay beside the mobile
  overlay, and its first bullet, which names the width and outline classes `focus:ring-2`,
  `ring-offset-2` and `focus:outline-none` and says the outline and width ride in `FOCUS_RING` at
  the offset-ring sites, names `FOCUS_VISIBLE_RING` and its `focus-visible:ring-2` at the
  `ModalPanel` sites; and the new reading sites join the ones its intro says it pins ([validated by the spelled token counts in docs/design-notes.md § Theming, .specify/spec.md, the theming spec, README.md and the demo sources equal the declaration block @2a3da4c8](../../tests/theming-tokens-dist.test.ts#L491), [validated by the group breakdown spelled in docs/design-notes.md § Theming and the theming spec sums to the declaration block @cc9d504c](../../tests/theming-tokens-dist.test.ts#L512)).
- `.specify/spec.md`, CLAUDE.md invariant 13 ("Exactly 44"), README.md's three spelled counts,
  `examples/chat-demo/README.md`, `examples/chat-demo/src/themes.tsx` and
  `examples/chat-demo/src/docs/ThemingSection.tsx`'s two ([validated by CLAUDE.md invariant 13 states the same token count as the stylesheet's declaration block @2d9f9be0](../../tests/theming-tokens-dist.test.ts#L483), [validated by the spelled token counts in docs/design-notes.md § Theming, .specify/spec.md, the theming spec, README.md and the demo sources equal the declaration block @2a3da4c8](../../tests/theming-tokens-dist.test.ts#L491)).
- `examples/chat-demo/src/custom-theme.css`, which must set all 53 tokens, not only spell the count;
  the axe run scans the themed variants (decision 19), so its values for the nine new tokens must
  clear the same minimums as the table above in both schemes ([validated by examples/chat-demo/src/custom-theme.css sets exactly the declared tokens @b80f4a7d](../../tests/theming-tokens-dist.test.ts#L525), [validated by @f85cc2ec](../../examples/chat-demo/tests/accessibility.spec.ts#L109)).
- the test's `EXPECTED_FALLBACKS` map, which gains the nine tokens with their fallbacks in
  declaration order ([validated by each token falls back to the same palette value at every site, matching the declared default @8ec9e511](../../tests/theming-tokens-dist.test.ts#L352)).
- the test's `NEUTRAL_ROLE_READERS` map, which pins each class string to the built files that import
  it, so a site drifting back to a palette utility fails: ([validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381))
  - existing keys gain the new readers - `SURFACE`, `BORDER`, `TEXT_STRONG` and `TEXT_BODY` gain
    `ModalPanel` and `Card` (and `Notice`, which paints its container and text the same way);
    `SURFACE` and `TEXT_STRONG` also gain `TextField`, whose input sits on `SURFACE` with its text
    and label in `TEXT_STRONG`; `SURFACE_HOVER` gains `Card` for its selectable hover; `TEXT_MUTED`
    gains `TextField` and `KeyValueList`, and `TEXT_STRONG` `KeyValueList` too; and `DANGER` gains
    `TextField`. The test compares each list exactly, so a reader missing here fails it ([validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
  - every new class string `src/theme/tokens.ts` gains is keyed with its readers: `DANGER_FILL`,
    `DANGER_FILL_HOVER` and `TEXT_ON_DANGER` with `buttonStyles`, as `TEXT_ON_ACCENT` is keyed
    today; `DANGER_BORDER` and `CONTROL_BORDER` with `TextField`; and `INFO_TONE`, `SUCCESS_TONE`,
    `WARNING_TONE` and `DANGER_TONE`, which read `--bowman-info`, `--bowman-success`,
    `--bowman-warning` and `--bowman-danger` as icon and border colours, with `Notice` ([validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
- the `FOCUS_RING` readers: `Card` makes six offset-ring importers, and `ModalPanel`, for its panel
  and focusable scrolling body, imports `FOCUS_VISIBLE_RING` instead, so the test's reader list and
  its `it()` title ("exactly the five offset-ring components"), the titled link to it in
  specs/bowman-ui-theming-tokens/spec.md, and CLAUDE.md's "imported by five files (four components
  and `buttonStyles.ts`)", which becomes "six files (five components and `buttonStyles.ts`)" and
  names `FOCUS_VISIBLE_RING` and its one importer, `ModalPanel`, move with it; CLAUDE.md invariant
  13's "composes the shared focus-ring fragment from two of them" and src/theme/focusRing.ts's
  one-line header, "The offset sites' shared ring fragment", both name the two fragments. The test
  also asserts that dist/theme/focusRing.js composes `FOCUS_VISIBLE_RING` from the same two imports
  and that `ModalPanel` alone imports it; its `includes("FOCUS_RING")` reader scan does not match
  `FOCUS_VISIBLE_RING`, so the two lists stay apart, and `RING_OFFSET`'s empty component pin holds ([validated by `dist/theme/focusRing.js composes FOCUS_RING and FOCUS_VISIBLE_RING from the tokens module's ring colour and offset, exactly the six offset-ring components import FOCUS_RING, and ModalPanel alone imports FOCUS_VISIBLE_RING` @6a7f5e79](../../tests/theming-tokens-dist.test.ts#L447)).
- examples/chat-demo/tests/theming.spec.ts, which measures every declared token at a visible site in
  a real browser, under both schemes and in WebKit too, and today requires every site to be on the
  chat screen (decision 19) ([validated by the chat matrix and the documentation pages together reach exactly every token the installed stylesheet declares, the chat lacking only the confirm-dialog and notice pages' tokens, which the wrapper run reaches too, and the wrapper sets the same set @bc0935fe](../../examples/chat-demo/tests/theming.spec.ts#L413)).

## Accessibility checks

WCAG 2.2 AA is the floor. Three layers prove it, and none is a reviewer's sign-off:

- The unit tests keep checking roles, names and attributes in jsdom, as every component's tests do
  today ([validated by `renders role="dialog" with no aria-describedby, and the <h2> holds labels.dialogTitle` @c2253b22](../../tests/Dialog.test.tsx#L38), [validated by `renders role="alertdialog" described by the <div> holding description, with no close button` @4f65eb31](../../tests/ConfirmDialog.test.tsx#L82), [validated by](../../tests/Notice.test.tsx#L29), [validated by `a visible <label> holding fieldLabel names the input, and the ref reaches the input` @28c0dce2](../../tests/TextField.test.tsx#L24), [validated by `with onSelect and a heading, one left-aligned <button type=button> is named by the heading and described by the body` @25410157](../../tests/Card.test.tsx#L52)).
- The chat-demo's Playwright suite gains `@axe-core/playwright` as a devDependency of
  examples/chat-demo/package.json, pinned to an exact version as that file pins every dependency,
  with examples/chat-demo/package-lock.json updated in the same pull request, because
  scripts/consumer-app.sh installs it with `npm ci` - never of the package, which gains no
  dependency of any kind. It runs against each new component's documentation page in every state
  that applies - default, disabled, error, busy, open, closed and, on the `Dialog` page, open with a
  body that overflows; each open state opens from its own trigger, one dialog at a time, never two
  open on one page (decision 11), and the axe and token runs open each in turn - and against the
  `search-field` page with `onSubmit`. It runs in a real browser, so it measures contrast, including
  the `danger` fill, and its `scrollable-region-focusable` rule checks the overflowing body; the
  target is zero violations under the WCAG 2.2 AA rule tags in every state. Every scan runs under
  both `colorScheme: "light"` and `"dark"`, in Chromium and WebKit, through
  `test.use({ colorScheme })` as the docs token matrix does (examples/chat-demo/tests/docs.spec.ts),
  so the dark fallbacks and the themed variants' dark values are scanned too. A hovered state is
  scanned by hovering it: the run hovers each `danger` `Button` and `IconButton` figure on the
  `ConfirmDialog` page, waits until the button's computed `backgroundColor` equals the hover fill,
  as examples/chat-demo/tests/theming.spec.ts polls past `transition-colors`, and scans that figure
  again, so the white-on-hover-fill pair is measured, not only tabulated. Each scan is limited with
  `AxeBuilder.include()`: while no dialog is open, to the page's variant figures,
  `[data-doc-variant]` (examples/chat-demo/src/docs/ComponentDocPage.tsx); while one is open, to its
  panel alone, `[role="dialog"], [role="alertdialog"]`, which usually portals outside them; the
  themed variant's portals into its own wrapper inside a figure, which the panel-only scope covers
  the same way. The page behind an open dialog is not scanned: the `bg-black/50` overlay dims it,
  which axe's contrast rule would blend into the background but not the text, and `aria-modal` takes
  it out of the accessibility tree; the closed scan already covers the figures and their triggers.
  Either way the documentation chrome around them - a `CodeBlock` whose long usage line scrolls
  sideways (examples/chat-demo/src/docs/DocsUi.tsx), as the § Usage section's is - is not what is
  measured. The § Usage example sits beside that `CodeBlock` and is not scanned, so every state
  listed above, the default one included, is a variant figure of its own (§ Documentation). axe's
  `color-contrast` rule measures text only; the 3:1 non-text contrast of the focus rings, the
  `Notice` tone icons and borders and `TextField`'s border rests on the measurements in § Theming
  and the token matrix, as the `CONTROL_BORDER` bullet records for that border ([validated by @f85cc2ec](../../examples/chat-demo/tests/accessibility.spec.ts#L109), [validated by @e7fcfaa5](../../examples/chat-demo/tests/accessibility.spec.ts#L120), [validated by @5fbb4b7b](../../examples/chat-demo/tests/accessibility.spec.ts#L141)).
- Keyboard use is checked by hand against each page.

specs/bowman-ui-assistive-technology-pass/spec.md keeps its manual screen-reader procedure, and its
out-of-scope line for an automated scanner stays true of that pass: the scanner added here runs in
the chat-demo's suite, not in the pass. The pass itself, docs/accessibility/README.md, gains two
rows in the same pull request, A8 and A9, each recording what every screen reader in the pass
announces: a `ConfirmDialog` turning busy, and one opened already busy - the focus move to its panel
and the `confirmBusy` status message (decision 20) - and a `Notice` mounted with its text, in each
tone, plus a dismissible one whose dismiss button the runner reaches and hears named (decision 14) ([validated by --structure and --freshness both pass on a complete, current record @3536cfed](../../tests/check-at-pass.test.ts#L161)).
The rows' verdicts are owed by the human runner, as A1-A7's are. What moves with them:

- docs/accessibility/README.md's "The surface under test" sends the runner to `?view=chat` and calls
  a transcription taken anywhere else "of the wrong page"; the chat screen holds neither component
  (decision 19), so that section names the `ConfirmDialog` and `Notice` documentation pages as A8's
  and A9's surface, and A1-A7 keep the chat screen.
- docs/accessibility/README.md's other counts move: "the seven rows are around 30 minutes" becomes
  "the nine rows" with the minute figure dropped until a timed run of A8 and A9 sets a new one, as
  is the seven-row figure in "A repeat run against an unchanged surface is about 30 minutes", and
  "every declared stack needs its seven rows" becomes nine; the front-matter table's "`id`
  (`A1`..`A7`)", § Verdicts' "Every row A1 to A7" and § The body's "headed `## A1` to `## A7`"
  become A9; and its `covers` rule, "List every component the rows exercise, which today means all
  seven above", gains what A8 and A9 exercise: `ConfirmDialog.tsx`, `ModalPanel.tsx`, and
  `Button.tsx` (its cancel and danger confirm buttons) and `src/hooks/useFocusTrap.ts` (whose
  empty-container branch performs the focus move A8 hears for a dialog opened already busy) and
  `src/hooks/focusableSelector.ts` (whose `getFocusableElements` decides that the container is
  empty) for A8, and `Notice.tsx` and `IconButton.tsx` (its dismiss button) for A9.
- `scripts/check-at-pass.mjs`'s closed `ROWS` list gains `"A8"` and `"A9"`, or a new row is never
  checked for a verdict, and its header comment's "every row A1-A7" becomes A1-A9;
  tests/check-at-pass.test.ts's hard-coded `rowIds` gains both (see "Existing tests that change") ([validated by --structure and --freshness both pass on a complete, current record @3536cfed](../../tests/check-at-pass.test.ts#L161), [validated by a missing row verdict exits 1 naming the row and the stack @0545be49](../../tests/check-at-pass.test.ts#L192)).
- docs/accessibility/README.md's "fourteen verbatim transcriptions" - seven rows on two stacks -
  becomes eighteen; its "the seven are this document's rule", a count of paths, becomes fourteen;
  and its front-matter block, which calls itself "complete and copy-pasteable", lists the fourteen
  `covers` paths and rows A1-A9, or a record copied from it fails the gate once `ROWS` gains A8 and
  A9.
- specs/bowman-ui-assistive-technology-pass/spec.md: its "seven rows" becomes nine, its "A1-A7"
  references become "A1-A9", its "names all seven components the rows exercise" becomes fourteen
  files, two of them in src/hooks/, KU-22's "seven checks" becomes nine - its "None has been named"
  stays true of the pass, which claims no conformance: the WCAG 2.2 AA floor here is this spec's
  target for its own unit, axe and contrast checks, not a standard named for the screen-reader
  pass - and it gains a statement for each new row beside A1-A7's. Each new statement links to the
  owed record as A1-A7's do and sits inside the `re-lint/no-dead-md-links` disable block, whose
  comment, "the seven links below", becomes nine, as does eslint.config.mjs's comment on it, "a
  scoped disable for its seven deliberate links". A8 records what each screen reader announces and
  nothing about Tab, which the chat-demo's Playwright suite checks, so the pass's out-of-scope line,
  which excludes keyboard-only navigation and the app shell's mobile drawer
  (specs/bowman-ui-assistive-technology-pass/spec.md), stays true; the trap is only that line's
  reason for excluding the drawer, so the hook and its helper belong in A8's `covers`, and a later
  change to it marks the A8 record stale.

## The published surface

`tests/fixtures/public-api.json` grows from 66 to 75 runtime names (`TextField`, `Dialog`,
`ConfirmDialog`, `Notice`, `KeyValueList`, `Card`, `defaultDialogLabels`,
`defaultConfirmDialogLabels`, `defaultNoticeLabels`) and from 57 to 70 type names (`TextFieldType`,
`TextFieldLabels`, `TextFieldProps`, `DialogLabels`, `DialogProps`, `ConfirmDialogLabels`,
`ConfirmDialogProps`, `NoticeTone`, `NoticeLabels`, `NoticeProps`, `KeyValuePair`,
`KeyValueListProps`, `CardProps`), written by `node scripts/write-public-api.mjs` after the surface
was decided here, never regenerated to make the test pass ([validated by @3c9682f2](../../tests/public-api.test.ts#L40), [validated by @1a95e338](../../tests/public-api.test.ts#L46)). Nothing is removed or renamed:
`ButtonVariant` only widens, and `SearchField` gains a prop and a label key under names the snapshot
already holds ([validated by @3c9682f2](../../tests/public-api.test.ts#L40), [validated by @1a95e338](../../tests/public-api.test.ts#L46), [validated by tsc accepts form-dialog-notice-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @3a29614b](../../tests/form-dialog-notice-dist.test.ts#L36)). A diff of the published type declarations against the previous release shows only
added exports, added props, the added label key and the added variant, so this ships as a minor
release. `.specify/spec.md` § API Stability calls signature alterations and TypeScript changes to
props breaking; the package already reads that as removals and narrowings, not additions a consumer
may have to supply, as v0.3.0 shipped `ChatComposerLabels`' required `composerBusyHint` in a minor
release, and this spec follows that reading. Four changes a consumer can still feel are accepted
and named in the release notes:

- `ButtonVariant` gains `"danger"`, so a consumer's exhaustive `Record<ButtonVariant, …>` or
  `switch` over it needs a fourth case ([validated by tsc accepts form-dialog-notice-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @3a29614b](../../tests/form-dialog-notice-dist.test.ts#L36), [validated by variant="danger" on Button and IconButton carries the --bowman-danger-fill fill and hover and --bowman-text-on-danger text @ab5aa400](../../tests/Button.test.tsx#L147)).
- `SearchFieldLabels` gains the required `submitSearch`, so a consumer's complete catalogue typed
  `SearchFieldLabels` needs the key; `labels?: Partial<SearchFieldLabels>` and every consumer
  passing a partial object are unaffected. It is required, as `composerBusyHint` is in
  `ChatComposerLabels`, so README § Labels and translations' promise that "a missing key is a
  compile error" keeps holding for a translated catalogue (decision 6) ([validated by tsc accepts form-dialog-notice-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @3a29614b](../../tests/form-dialog-notice-dist.test.ts#L36)).
- The public `useFocusTrap` hook changes behaviour for an empty container, for focus on the
  container itself and for an unmount while open (the `useFocusTrap` section). A consumer that
  relied on an empty trap leaving Tab alone now sees Tab prevented only when its container carries a
  `tabindex` and is visible; one without, such as `AppShell`'s drawer, is unaffected ([validated by an empty container without a tabindex leaves Tab handling alone @49cfd3ce](../../tests/useFocusTrap.test.tsx#L251), [validated by an empty container with a tabindex takes focus on open and Tab from it is prevented @813cc857](../../tests/useFocusTrap.test.tsx#L262), [validated by an empty container with a tabindex that fails the visibility check takes no focus and leaves Tab alone @34858645](../../tests/useFocusTrap.test.tsx#L271), [validated by Tab from the focused container itself reaches the first element @a65768b2](../../tests/useFocusTrap.test.tsx#L294), [validated by unmounting while open returns focus to the element that held it before opening @52422c57](../../tests/useFocusTrap.test.tsx#L310)).
- `FOCUSABLE_SELECTOR` counts natively tabbable `<summary>`, editing-host, controlled-media and
  `<iframe>` elements, so the public `useFocusTrap` and `useFocusGroups` hooks and `ErrorBoundary`'s
  recovery focus may now stop on one where they skipped it before (the `useFocusTrap` section) ([validated by `a <details> summary is a trap stop: Shift+Tab from it wraps to the last, Tab from the last wraps to it` @35f45f31](../../tests/useFocusTrap.test.tsx#L401), [validated by matches a details' first summary, an editing host, controlled media and a frame, and not their opted-out variants @afc8d40e](../../tests/useFocusTrap.test.tsx#L415)).

The prose that spells the surface moves with it in the same pull request: `.specify/spec.md`'s "66
named value exports: 17 components, … 14 label-defaults objects … plus 57 type exports"
becomes 75, 23, 17 and 70; CLAUDE.md invariant 3's "66 runtime + 57 type names" becomes 75 and 70;
CLAUDE.md's directory map counts 26 `.tsx` files in `src/components/`, adds the six new components
and `ModalPanel` to the names it lists in parentheses, and names `ModalPanel` beside
`FeedbackButtons` as internal; its `buttonStyles.ts` entry, "shared by Button and IconButton", gains
`ConfirmDialog`, which imports `buttonIconClassNames`; and its `src/hooks/` entry names
`getFocusableElements` beside `focusableSelector`; and in specs/bowman-ui-styled-primitives/spec.md
the `ButtonVariant` block gains `"danger"` and the `SearchField` block gains `onSubmit` and
`submitSearch`, each citing this spec. docs/design-notes.md § Styled primitives records both
amendments in the same pull request: its `ButtonVariant` decision names four variants, and its
`SearchField` decision drops "no submit" (decision 3). Its refusal of layout primitives is narrowed
for `Card` (decision 7); its opening sentence, "`Button`, `IconButton`, `PromptChips` and
`SearchField` are a closed set", and its "applied to four more components" both count the new styled
components; and § Theming decision 11, which lists the token imports of `buttonStyles.ts` as
`ACCENT_BG`, `ACCENT_BG_HOVER` and `FOCUS_RING_COLOR` though the file already imports `FOCUS_RING`
and more tokens than those (src/components/buttonStyles.ts), is restated to match the file, the
three danger strings included. docs/design-notes.md § Labels decisions 2, 3 and 5 are amended
(decision 6). CLAUDE.md's spec count, "30 feature specs", already lags `main`'s 32 and becomes 33
with this spec.

## Recorded decisions

1. **`Dialog` is a `role="dialog"` panel on `useFocusTrap`, not the native `<dialog>`.** jsdom 30,
   the suite's environment, implements no `showModal`, so a native dialog's modality could only be
   tested in a browser; `AppShell`'s mobile drawer already carries `role="dialog"`, `aria-modal` and
   the trap, and one focus primitive serves both. Without the native top layer the panel needs a
   portal: a transformed ancestor, such as `AppShell`'s translated drawer, becomes the containing
   block of a fixed descendant, so an overlay rendered in place would cover that ancestor rather
   than the viewport, and be clipped wherever that ancestor sets `overflow`. `createPortal` comes
   from `react-dom`, already a peer and already imported, for `flushSync`, by `ErrorBoundary`. The
   plan says dialogs "build on the browser's built-in modal support"; this is the one place the spec
   departs from it on purpose. What the dialogs keep from the browser is `aria-modal` and the native
   `disabled`, focus and form-submit behaviour ([validated by `renders role="dialog" with no aria-describedby, and the <h2> holds labels.dialogTitle` @c2253b22](../../tests/Dialog.test.tsx#L38), [validated by `portals a fixed z-50 bg-black/50 overlay as document.body's last child, holding the modal panel named by its <h2>` @4efbe038](../../tests/helpers/modal-panel-contract.tsx#L122), [validated by opening focuses the first control in children, and Tab from the last control wraps inside @3c9d6e80](../../tests/helpers/modal-panel-contract.tsx#L170)).
2. **No dismissal on an overlay click.** `ConfirmDialog` guards destructive actions, and a stray
   click that closed it would discard what the user had typed; Escape, Cancel and `Dialog`'s close
   button are deliberate. `Dialog` shares the rule so the two never differ ([validated by Escape calls the dismiss callback once, and a click on the overlay calls nothing @3f3c04b1](../../tests/helpers/modal-panel-contract.tsx#L184), [validated by @bb94a4d9](../../tests/Dialog.test.tsx#L17), [validated by @bb94a4d9](../../tests/ConfirmDialog.test.tsx#L55)).
3. **`SearchField` gains a submit, amending § Styled primitives.** That section records "no submit",
   because filtering as the user types was left to the consumer. Some searches cannot run on every
   keystroke - a server query, a paid lookup - and the consumer's own `<form>` and `Button` put the
   submit control outside the field's border with a name of its own choosing. An optional `onSubmit`
   keeps the recorded behaviour for every consumer who does not pass it, and the design record is
   amended in the same pull request ([validated by renders no button without onSubmit - no clear control and no submit @a47ff0b5](../../tests/SearchField.test.tsx#L76), [validated by with onSubmit, a ghost size="sm" IconButton named "Submit search" replaces the leading icon at the trailing edge @fb034417](../../tests/SearchField.test.tsx#L96)).
4. **The danger fill takes its own roles.** `--bowman-danger` is a text role whose dark value,
   `red-400`, is too light for white text on top of it. Reusing it as a fill would fail contrast in
   dark mode. Reusing `--bowman-text-on-accent` would tie danger text to the accent's theme: that
   token exists so a consumer with a pale accent can switch the primary button's text to dark
   (docs/design-notes.md § Theming), and that switch must not also turn the danger button's text
   dark on red. The dark hover darkens to `red-700` rather than lightening to `red-500`, because
   white on `red-500` measures 3.82:1 and fails AA ([validated by variant="danger" on Button and IconButton carries the --bowman-danger-fill fill and hover and --bowman-text-on-danger text @ab5aa400](../../tests/Button.test.tsx#L147), [validated by each token falls back to the same palette value at every site, matching the declared default @8ec9e511](../../tests/theming-tokens-dist.test.ts#L352)).
5. **A notice's text never sits on a tinted surface, and info and warning get their own roles.** The
   existing soft surfaces fail as text backgrounds for their own tone colour: `--bowman-success` on
   `--bowman-success-soft` measures 2.93:1 and `--bowman-danger` on `--bowman-danger-soft` 3.90:1.
   Adding a text role per tone would cost eight tokens; keeping the text in the body roles on
   `SURFACE` and colouring only the icon and the left border needs non-text contrast, 3:1, which
   success and danger already meet on `SURFACE`. Info does not borrow `--bowman-accent`, though the
   accent's fallbacks, `blue-500` light and `blue-600` dark, pass 3:1 on their surfaces today: the
   accent is the brand fill a consumer re-themes first, and a brand colour chosen for buttons would
   then recolour every info notice, however it measured as an icon. Warning has no role at all, and
   amber no stand-in in the palette. Neither needs a soft twin ([validated by @4f0384b9](../../tests/Notice.test.tsx#L53), [validated by `heading renders in a bold TEXT_STRONG <span>, never a heading element, and children in TEXT_BODY` @fef9bfed](../../tests/Notice.test.tsx#L65), [validated by each token falls back to the same palette value at every site, matching the declared default @8ec9e511](../../tests/theming-tokens-dist.test.ts#L352)).
6. **`TextField`'s strings are required labels, never string props.** `fieldLabel`, `fieldHint` and
   `fieldError` ride in `labels: TextFieldLabels`, so the `stringPropOnly` list stays at three. The
   presence of a non-empty `labels.fieldError` is the invalid state: a separate `invalid` boolean
   could disagree with it, and an invalid input with no message gives a screen reader nothing to
   read. Five components now take a required `labels` prop: `ChatMessageList`, `IconButton`,
   `TextField`, `Dialog` and `ConfirmDialog`. `IconButton` and `TextField` ship no defaults object,
   because no key of theirs has a meaningful default. `TextFieldLabels` is the first labels type
   with optional keys: `fieldHint` and `fieldError` have no default because a hint and an error are
   not always there. `SearchFieldLabels`' new `submitSearch` is required and defaulted, as
   `composerBusyHint` is: an optional defaulted key would let a translated catalogue typed
   `SearchFieldLabels` omit it and still compile, showing English, which breaks README § Labels and
   translations' "a missing key is a compile error". `Dialog` and `ConfirmDialog` require only their
   title and confirm text and default the rest, as `ChatMessageList` does, so `defaultDialogLabels`
   and `defaultConfirmDialogLabels` are typed `Readonly<Required<Pick<…>>>` over their defaulted
   keys, as `defaultChatMessageListLabels` is typed over an `Omit` today. That departs from
   docs/design-notes.md § Labels decision 2, which fixes
   `defaultXLabels: Readonly<Required<XLabels>>`, and widens decision 5, which allows a required key
   but not an optional one; both decisions are amended in the same pull request to name the
   defaulted-keys typing and an optional key with no default, and § Labels decision 3 is amended to
   record that a component wrapping `IconButton` feeds its per-instance `accessibleName` from a
   concept-named key of its own rather than taking the union. Every place that lists the required
   labels records all five in the same pull request: § Labels, which today speaks of "these two
   exceptions"; `.specify/spec.md`'s Labels Convention capability, which names "the two required
   labels with no default"; CLAUDE.md invariant 1, which names `ChatMessageList.labels` and
   `IconButton.labels` as required; the bucket comment in tests/labelled-exports.test.tsx; and
   README.md § Labels and translations, whose "Each labelled component takes
   `labels?: Partial<XLabels>`" gains the five required exceptions beside its three string-prop
   ones ([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L187), [validated by TextField's sentinel labels are exactly fieldLabel, fieldHint and fieldError @ca282007](../../tests/labelled-exports.test.tsx#L787)).
7. **`Card` narrows the refusal of layout primitives.** § Styled primitives refuses layout
   primitives because they would decide spacing the consumer's page already decides. `Card` decides
   one inner padding and nothing about the page: no grid, no gap, no width. It ships for what a
   consumer gets wrong by hand - a whole surface that is one button, with one accessible name and
   the package's focus ring. docs/design-notes.md § Styled primitives and
   specs/bowman-ui-styled-primitives/spec.md record the narrowed refusal in the same pull request.
   `Card` ships with the other seven changes: the plan ships all eight together. Its one accessible
   name is the heading when there is one, not the whole visible content the plan names: a name built
   from a long body is read in full before the user learns what the card is, so the body becomes the
   description ([validated by `with onSelect and a heading, one left-aligned <button type=button> is named by the heading and described by the body` @25410157](../../tests/Card.test.tsx#L52)).
8. **`ConfirmDialog` is a form.** Enter in a field confirms, as a user expects, and the guard lives
   in one place: the submit handler checks `confirmDisabled` and `busy`, so neither the confirm
   button nor Enter can bypass it ([validated by submitting the form directly calls onConfirm once and prevents the default @27c15e93](../../tests/ConfirmDialog.test.tsx#L146), [validated by while confirmDisabled holds, confirm carries the native attribute and a submit never calls onConfirm @c9338272](../../tests/ConfirmDialog.test.tsx#L155), [validated by disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text @da0db4e5](../../tests/ConfirmDialog.test.tsx#L184)).
9. **`Notice` is not a toast.** specs/bowman-ui-toast/spec.md ships no variants or severity styling,
   and `Notice` does not give it any: a toast is transient and positioned, a notice is inline and
   stays.
10. **Warning and error notices are alerts; info and success are status.** A warning and an error
    both ask the user to act before going on, which is what an alert is for; info and success report
    and wait. `role="alert"` makes some screen readers interrupt on every load, so a condition a
    page shows from its first render that asks nothing of the user is an `info` notice, not a
    `warning`; the chat-demo's `Notice` page says so ([validated by](../../tests/Notice.test.tsx#L29)).
11. **One modal at a time.** `AppShell`'s open mobile drawer is itself a modal, so a `Dialog` opened
    over it is the nested-dialog case this spec leaves out. Both traps listen on `document`: one
    Escape would close both, and Tab would never move, because the drawer's trap pulls focus back
    into the drawer and the dialog's then pulls it back to its own first element. A consumer closes
    the drawer before opening a dialog from it; the chat-demo's `Dialog` page says so.
12. **Initial focus follows the DOM, not a prop.** `useFocusTrap` focuses the first focusable
    element, and a public hook's signature should not widen for one caller. Putting `Dialog`'s close
    button last in DOM order lands focus on its first field; `ConfirmDialog` has no close button
    (decision 17), and its Cancel button precedes Confirm, so a bare confirmation lands on Cancel,
    the least destructive action, as the WAI-ARIA alert dialog pattern advises; focus never starts
    on the confirm button. Enter in a field still submits (decision 8), so a confirmation whose
    field the consumer pre-fills with the expected answer confirms on one keystroke: a consumer
    guarding with a typed confirmation leaves the field empty and holds `confirmDisabled` until it
    matches ([validated by with nothing focusable in children or footer, opening focuses the close button @030a7e12](../../tests/Dialog.test.tsx#L80), [validated by with no control in children, opening focuses the first control in footer, not the close button @ccb6e3e3](../../tests/Dialog.test.tsx#L90), [validated by opening focuses the first control in children, and Tab from the last control wraps inside @3c9d6e80](../../tests/helpers/modal-panel-contract.tsx#L170), [validated by opening with no control in children focuses the cancel button, never confirm @33a9c48c](../../tests/ConfirmDialog.test.tsx#L176), [validated by with confirmDisabled, Enter in the TextField does not confirm until the typed reference matches @97806f04](../../examples/chat-demo/tests/docs.spec.ts#L653)).
13. **`ConfirmDialog` is an `alertdialog`; `Dialog` is not.** A confirmation interrupts to ask about
    a consequence, which is what the WAI-ARIA alert dialog pattern is for, and its `description`
    prop gives `aria-describedby` a target that holds the consequence and not the fields' labels. A
    `Dialog` holds arbitrary content, such as a settings form, with no single description to point
    at ([validated by `renders role="alertdialog" described by the <div> holding description, with no close button` @4f65eb31](../../tests/ConfirmDialog.test.tsx#L82), [validated by `renders role="dialog" with no aria-describedby, and the <h2> holds labels.dialogTitle` @c2253b22](../../tests/Dialog.test.tsx#L38)).
14. **A `Notice` mounted with its text is announced on a best-effort basis.**
    specs/bowman-ui-toast/spec.md's lesson - a live region must exist before its text - would need
    the notice to mount empty and fill after an effect, so the server render and the first paint
    would show an empty notice. A notice describes a condition the page shows, so it stays readable
    in the reading order whether or not it is announced; an outcome that must be announced belongs
    in a `Toast`, and the assistive-technology procedure records what each screen reader does with a
    mounted notice.
15. **Busy disables natively; it does not use `aria-disabled`.** `aria-disabled` would keep focus on
    the pressed button with no race against the browser's focus fixup, but `Button` and `IconButton`
    take `disabled` only, and adding an `aria-disabled` prop would widen two public components'
    closed prop surface for one internal caller. The native attribute also keeps a busy button out
    of the tab order and inert to a click with no handler-level guard. The layout effect moves focus
    to the panel before the fixup runs, and the second widened trap behaviour keeps Tab inside from
    there; the chat-demo's Playwright suite proves the move in a real browser ([validated by disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text @da0db4e5](../../tests/ConfirmDialog.test.tsx#L184), [validated by setting busy with focus on the confirm button moves focus to the panel @0105fddd](../../tests/ConfirmDialog.test.tsx#L261), [validated by `Enter on the focused confirm button turns the dialog busy and moves focus to the panel, never to <body>` @e394a87e](../../examples/chat-demo/tests/docs.spec.ts#L681)).
16. **A string the component needs to name its own chrome is a label; content is a node.** The
    dialog's title is required, is the dialog's accessible name and is only ever text, so it rides
    in `labels` as `dialogTitle`. `Card`'s and `Notice`'s `heading`, and `ConfirmDialog`'s
    `description`, are optional or composed content that may carry markup, so they are `ReactNode`
    props, as `Button`'s `children` are ([validated by Dialog's sentinel labels cover every defaultDialogLabels key plus the required dialogTitle @4c095324](../../tests/labelled-exports.test.tsx#L791), [validated by ConfirmDialog's sentinel labels cover every defaultConfirmDialogLabels key plus the required dialogTitle and confirmAction @c57256a5](../../tests/labelled-exports.test.tsx#L797)).
17. **`ConfirmDialog` has no close button.** A confirmation asks for one decision, so it offers
    exactly two controls, Cancel and the action; a third that also cancels adds a tab stop and a
    second name for the same outcome. Escape still cancels, as the WAI-ARIA alert dialog pattern
    expects, and while `busy` holds nothing dismisses it ([validated by `renders role="alertdialog" described by the <div> holding description, with no close button` @4f65eb31](../../tests/ConfirmDialog.test.tsx#L82), [validated by disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text @da0db4e5](../../tests/ConfirmDialog.test.tsx#L184)).
18. **A `Notice` is dismissible only when the consumer can act on it.** The dismiss button renders
    only with `onDismiss`, and `Notice` holds no open state: a notice that hid itself would come
    back on the next render of a page that still holds the condition, and a consumer that persists
    the dismissal needs the callback anyway. No tone label ships: the icon's shape and colour carry
    the tone on screen, and the consumer's `heading` and text carry it in words, so `NoticeLabels`
    holds the one key the component needs to name its own chrome ([validated by without onDismiss, no button renders @2bc36f09](../../tests/Notice.test.tsx#L86), [validated by with onDismiss, a ghost IconButton named "Dismiss" sits outside the live region and calls onDismiss @45288c2d](../../tests/Notice.test.tsx#L92)).
19. **The nine new tokens are measured on their documentation pages, not the chat screen.**
    examples/chat-demo/tests/theming.spec.ts proves every declared token at a visible site of
    `/?view=chat`, and its "the chat matrix reaches every token the installed stylesheet declares"
    test fails while any declared token has no site there. A chat screen has no honest place for a
    danger button, an info notice or a warning notice, and adding them only to reach the tokens
    would put demo furniture in the screen the suite exists to prove. A documentation-page matrix
    already exists: examples/chat-demo/tests/docs.spec.ts measures each entry of its
    `docsTokenPages` on its page under both schemes ("the ${componentId} page paints its tokens").
    The new pages join that list - the danger `Button` at rest and hovered, on the `ConfirmDialog`
    page (§ Documentation), with its text, and an info and a warning `Notice`, measured through the
    tone icon's `color` and the container's `borderLeftColor`, which
    examples/chat-demo/tests/helpers/colors.ts's `ColorProperty` gains, since a mixed border's
    computed `borderColor` lists four colours - rather than a second matrix being built, which the
    copy-paste gate would flag. `docsTokenPages` moves to the chat-demo's tests/helpers so
    theming.spec.ts can read it; the docs suite gains a wrapper-theme run like the theming suite's.
    The chat-demo's `?theme=` parameter applies only with `?view=chat`
    (examples/chat-demo/src/App.tsx), so rather than threading it into the docs view, the
    `ConfirmDialog` and `Notice` pages each show a themed variant inside a page-local
    `.custom-theme` wrapper, as examples/chat-demo/src/docs/ThemingSection.tsx does, and that
    variant's `ConfirmDialog` portals into the wrapper through `container`; the run measures the
    nine tokens there; and the theming test is retitled to say the chat matrix and the documentation
    pages together reach every declared token, asserting exactly that union. The file's header
    comment and the theming spec's statement it validates move with it. Every one of the 44 existing
    tokens stays measured on the chat screen ([validated by the chat matrix and the documentation pages together reach exactly every token the installed stylesheet declares, the chat lacking only the confirm-dialog and notice pages' tokens, which the wrapper run reaches too, and the wrapper sets the same set @bc0935fe](../../examples/chat-demo/tests/theming.spec.ts#L413), [validated by @e45eed6e](../../examples/chat-demo/tests/docs.spec.ts#L293)).
20. **A busy `ConfirmDialog` announces itself through a fourth label key.** The busy state has no
    `aria-busy` (it could silence the focus move) and an aria-hidden spinner, so without a status
    message a screen reader would learn of it only from focus landing on the panel, which reads the
    dialog's name again - a gap against WCAG 4.1.3. The plan lists ConfirmDialog's keys as
    `dialogTitle`, `confirmAction` and `cancelAction`, and also makes WCAG 2.2 AA its floor; where
    the two meet, the floor wins. `confirmBusy` is defaulted, so no consumer has to supply it, and
    follows the precedent of `ChatComposerLabels`' `composerBusyHint`, the package's existing string
    for a busy control. This amends the plan's key list; it is the one label key the spec adds
    beyond it ([validated by defaultConfirmDialogLabels is frozen and equals { cancelAction: "Cancel", confirmBusy: "Working, please wait" } @da9e1b11](../../tests/ConfirmDialog.test.tsx#L74), [validated by a polite bowman-sr-only status region sits in the panel empty, fills with confirmBusy while busy and empties when busy clears @92b5a9d0](../../tests/ConfirmDialog.test.tsx#L209)).
21. **`TextField`'s border reads the muted-text role.** WCAG 2.2 AA needs a control's boundary at
    3:1 against its background where the boundary is what identifies it, as an empty text input's
    is; a button identified by its text, such as the `secondary` cancel `Button` or a selectable
    `Card`, does not depend on its border, so neither changes. No existing role meets 3:1 as a
    border: `--bowman-border` is a divider colour at about 1.2:1. A new token would grow the count
    past the plan's nine. `--bowman-text-muted` is the lightest role that clears 3:1 in both modes
    (4.77:1 and 6.79:1), so `CONTROL_BORDER` reads it as a border colour and declares nothing. The
    cost is coupling: a consumer who recolours muted text recolours every `TextField` border too,
    and a muted colour light enough to fail 3:1 fails both. docs/design-notes.md § Theming
    decision 12, which names each role for what a designer overrides, records this first border use
    of the muted role in the same pull request; a dedicated control-border token is a follow-up
    should the coupling bite ([validated by `the input at rest takes rounded-lg border px-3 py-2 text-sm on SURFACE in TEXT_STRONG, the focus ring, the disabled pair and CONTROL_BORDER` @57ff2794](../../tests/TextField.test.tsx#L37), [validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).
22. **A dialog portals into a `container` the consumer may choose.** Theming works on any wrapper
    (docs/design-notes.md § Theming; README § Theming), and the chat-demo's own custom theme is
    wrapper-scoped (examples/chat-demo/src/custom-theme.css). A panel portalled only to `<body>`
    would leave that wrapper, lose its `--bowman-*` overrides and its `dark` class, and paint the
    default palette inside a themed app. The plan names no such prop; without it, wrapper-scoped
    theming would silently stop at every dialog, so the floor the plan sets for theming wins.
    `container` defaults to `document.body`, read only on the client, so the hydration rule above
    holds. The docs suite's wrapper-theme run (decision 19) opens the `ConfirmDialog` page's themed
    variant, portalled into its page-local `.custom-theme` wrapper, and measures its danger fill,
    panel surface and text there, so a portal that escaped the wrapper fails it ([validated by container={wrapper} portals into the wrapper; container={null} portals into document.body @16f1f099](../../tests/helpers/modal-panel-contract.tsx#L135), [validated by the themed ConfirmDialog portals into its wrapper, and closing returns focus to its trigger @29f8a58d](../../examples/chat-demo/tests/docs.spec.ts#L760), [validated by @e45eed6e](../../examples/chat-demo/tests/docs.spec.ts#L293)).
23. **An overflowing dialog body with nothing focusable in it becomes focusable.** A keyboard user
    scrolls a region by focusing it, and a prose-only body that overflows offers nothing to focus;
    Chrome and Firefox make such a scroller focusable on their own, Safari does not, and WCAG 2.1.1
    needs it everywhere. The body gains `tabIndex={0}` only in that case, which is the case those
    browsers cover natively and the one axe's `scrollable-region-focusable` flags. A body that
    always took focus would sit first in DOM order and take initial focus from the first field,
    against decision 12. Its name is the dialog's heading, the one name the body has, and its ring
    is the panel's `FOCUS_VISIBLE_RING` ([validated by `the panel and the scrolling body carry FOCUS_VISIBLE_RING beside ring-offset-2 and no shadow, and the body pads p-1` @0a1a4b9d](../../tests/helpers/modal-panel-contract.tsx#L162), [validated by `an overflowing prose-only body becomes a focusable region named by the <h2> and takes initial focus` @4bb41ddd](../../tests/helpers/modal-panel-contract.tsx#L246), [validated by an overflowing body that holds a control takes no tabindex, and the control takes focus @538cbd09](../../tests/helpers/modal-panel-contract.tsx#L257), [validated by the overflowing Dialog body is a named, focusable region that takes initial focus @621d4eb8](../../examples/chat-demo/tests/docs.spec.ts#L727)).

## Out of scope

Data tables, pagination, tabs, selects, checkboxes, radio groups, date pickers and a multi-line text
field; tones or a close button for `Toast`; locking page scroll behind an open dialog, and `inert`
on the page behind it, beyond what `aria-modal` gives; nested dialogs, including a `Dialog` over
`AppShell`'s open drawer (decision 11); validation logic, which stays the consumer's, as `TextField`
only shows the error it is handed; raising `SearchField`'s resting border, `BORDER`, to the 3:1
non-text minimum `TextField` meets through `CONTROL_BORDER`, because the plan holds `SearchField`'s
look unchanged without `onSubmit` - a gap a follow-up should close on its own; a `form` prop on
`Button`, which would let a `Dialog`'s footer button submit a form in its body; re-evaluating the
scrolling body's attributes when what is focusable in it changes without any size changing, as when
a consumer disables its only field while `busy`, an accepted gap since the panel then holds focus
and Tab stays trapped; a Firefox gap: Firefox makes a scroll container its own tab stop even when it
holds controls, so in an overflowing body with controls a second Shift+Tab from the first control
may reach the page behind the dialog, an exposure `AppSidebar`'s drawer scroller already has and
which the chat-demo's Playwright suite, running Chromium and WebKit only, does not test; and an
`isComposing` check on the trap's Escape handler, without which the Escape that cancels an IME
composition in a field inside a dialog also closes the dialog.

## Documentation

The chat-demo's documentation app gains one page per new component, each showing every state the
accessibility checks run against as a variant, a `default` variant included, since the scans read
only the variant figures, the `Dialog` page including one whose body overflows; each open dialog
state sits behind its own trigger, so at most one dialog is open at a time (decision 11), and the
`ConfirmDialog` and `Notice` pages carry the themed variant decision 19 measures ([validated by bare / renders the index with the hero image and every component link @fc8a9ee5](../../examples/chat-demo/tests/docs.spec.ts#L86), [validated by every component page renders its purpose, import, usage, props and states @5b9e2905](../../examples/chat-demo/tests/docs.spec.ts#L129), [validated by @f85cc2ec](../../examples/chat-demo/tests/accessibility.spec.ts#L109)). The `danger`
variant gets no page of its own: the `ConfirmDialog` page's confirm button is the danger `Button`,
and that page also shows it on its own, at rest, hovered and disabled, beside a `danger`
`IconButton` in the same three states, so the token matrix and the axe run reach it there ([validated by @5fbb4b7b](../../examples/chat-demo/tests/accessibility.spec.ts#L141), [validated by @e45eed6e](../../examples/chat-demo/tests/docs.spec.ts#L293)). The
existing `search-field` page gains an `on-submit` variant, so the submit button is shown and
scanned; its props table in examples/chat-demo/src/docs/propDocs.ts gains `onSubmit`, and its
purpose text in examples/chat-demo/src/docs/componentDocs.tsx, "A controlled search input with a
leading icon", says the icon becomes a submit button with `onSubmit` ([validated by the search field's on-submit variant runs the search on Enter and on its submit button @d4ea6e61](../../examples/chat-demo/tests/docs.spec.ts#L795), [validated by @f85cc2ec](../../examples/chat-demo/tests/accessibility.spec.ts#L109)). The `use-focus-trap` entry in
examples/chat-demo/src/docs/overview.ts, "AppShell uses it for the mobile drawer", names `Dialog`
and `ConfirmDialog` beside it.

README.md has no section per component today; its § Hooks is one section of short annotated
snippets. It gains one section in that shape, "Forms, dialogs and notices", with a subsection per
new component, as the plan's completion gate asks, each naming the component's props, labels and
focus behaviour; the subsection for `Dialog` names `container` and the wrapper-theme case, and the
section opens with the `danger` variant and `SearchField`'s `onSubmit`. In the same pull request:
its § Hooks comment on `useFocusTrap`, "Tab is trapped, Escape closes and refocuses the trigger",
stays true and gains nothing, since the widened behaviours keep it so; its § Accessibility, which
says "the test suite checks that markup", names the chat-demo's axe scan of the documentation pages
beside it, and its "What no test can check is what a screen reader actually says" stays true; its
three spelled token counts move to fifty-three; its § Theming sentence "Two semantic roles sit
beside them - `--bowman-danger` and `--bowman-success`, each with a `-soft` surface and `-dark`
twins - …" is restructured rather than appended to, so the `-soft` claim stays with danger and
success and the new danger-fill, info and warning roles, none of which has a `-soft` surface, are
named with their own twins, and `--bowman-text-on-danger` as having none; its sentence "Forty-two of
the tokens form twenty-one light/dark pairs … Two have no twin" becomes fifty, twenty-five and
three, naming `--bowman-text-on-danger` as the third, the one text colour on the danger fill in both
modes; its § Styles sentence listing what the `bowman-sr-only` rule hides gains `ConfirmDialog`'s
busy status region and the `ChatComposer` busy hint it already lacks; tests/styles.test.ts's title
"styles.css declares the bowman-sr-only rule the markdown notice, Toast, ConversationList,
ChatComposer and useFocusGroups depend on", which already names `ChatComposer`, gains
`ConfirmDialog`, and the titled link to it in specs/bowman-ui-stylesheet-entry/spec.md moves with it
(see "Existing tests that change"); and its App Router paragraph gains the new function-valued
props, and `container`, a DOM element, and `returnFocusRef`, a ref object, which a server component
cannot pass either, because that list is a claim about every export ([validated by styles.css declares the bowman-sr-only rule the markdown notice, Toast, ConversationList, ChatComposer, ConfirmDialog and useFocusGroups depend on @888966ba](../../tests/styles.test.ts#L156), [validated by the spelled token counts in docs/design-notes.md § Theming, .specify/spec.md, the theming spec, README.md and the demo sources equal the declaration block @2a3da4c8](../../tests/theming-tokens-dist.test.ts#L491)). Two docs/design-notes.md
sentences move too: § Lint guardrails' list of what shares `.bowman-sr-only` gains `ConfirmDialog`'s
busy status region, and the `ChatComposer` busy hint it already lacks; and § Styled primitives'
"four component files open with the directive" counts the styled components that do once the closed
set grows.
