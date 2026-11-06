# bowman-ui styled primitives

| Field  | Value                |
| ------ | -------------------- |
| Issue  | re-cinq/bowman-ui#43 |
| Status | In Progress          |

Issue: re-cinq/bowman-ui#43, "Ship styled primitives for the controls every consumer rebuilds
in the slots". Every slot the package exposes (`prompts`, `attachSlot`, `AppSidebar`'s children
and `footer`, the avatar slots) is unstyled, so a consumer integrating the package by hand
rebuilds the same handful of controls with hand-written utility class strings;
`examples/chat-demo/src/docs/HeroPreview.tsx` and `examples/chat-demo/src/App.tsx` carry the
same strings. This issue ships a small, closed set of styled primitives that cover the
hand-styled cases, following the labels convention and the `forwardRef` policy. The decision
record lives in docs/design-notes.md § Styled primitives; this file pins the signatures and the
per-behaviour tests.

"Styled" means what it means for every other component in the package: the primitive ships
Tailwind v4 utility class names in its built file, light and `dark:` variants included, and the
consumer's own Tailwind build generates their CSS by scanning the installed `dist` through the
`@source` line README § Styles prescribes. `src/styles.css` gains nothing - the primitives need
no keyframe and no rule Tailwind cannot generate - so `dist/styles.css` still declares exactly
the four keyframes and the stylesheet tests are unchanged
([validated by declares exactly the four keyframes bowman-fade-in, bowman-toast-fade-in, bowman-fade-dot and bowman-pulse-subtle @4d80b735](../../tests/styles.test.ts#L32)).

## What ships

Four components, two defaults objects and nine types, all from the package root
([validated by @3c9682f2](../../tests/public-api.test.ts#L40), [L46@1a95e338](../../tests/public-api.test.ts#L46),
[validated by is frozen and equals { suggestedPrompts: "Suggested prompts" } @57036184](../../tests/PromptChips.test.tsx#L127), [validated by defaultSearchFieldLabels is frozen and equals { searchInput: "Search", searchPlaceholder: "Search..." } @dd98595f](../../tests/SearchField.test.tsx#L106)).
Every value export lands in one bucket of `tests/labelled-exports.test.tsx`
([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L165)). The `labelsProp` bucket holds
`IconButton`, `PromptChips` and `SearchField`, with a sentinel harness each
([validated by @4a070485](../../tests/labelled-exports.test.tsx#L93),
[L94@daef69b6](../../tests/labelled-exports.test.tsx#L94),
[L95@5fd828bb](../../tests/labelled-exports.test.tsx#L95),
[validated by IconButton's sentinel labels are exactly the one required key accessibleName @5ffa4440](../../tests/labelled-exports.test.tsx#L673),
[validated by PromptChips' sentinel labels cover every defaultPromptChipsLabels key @621a2f48](../../tests/labelled-exports.test.tsx#L677),
[validated by SearchField's sentinel labels cover every defaultSearchFieldLabels key @45ff9aa9](../../tests/labelled-exports.test.tsx#L683),
[validated by no run of three Latin letters survives outside the sentinels for any labelsProp member @ffb54b18](../../tests/labelled-exports.test.tsx#L689)). The `noStrings` bucket holds `Button`,
`defaultPromptChipsLabels` and `defaultSearchFieldLabels`
([validated by](../../tests/labelled-exports.test.tsx#L138),
[L151@cd574397](../../tests/labelled-exports.test.tsx#L151),
[L152@c98f1259](../../tests/labelled-exports.test.tsx#L152)). The `stringPropOnly` list stays at its three
closed members ([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L165)).

### `Button`

```ts
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps {
  variant: ButtonVariant;
  /** Default "md". */
  size?: ButtonSize;
  /** Leading icon, sized by the button; decorative beside the visible text. */
  icon?: ComponentType<{ className?: string }>;
  /** The visible text - consumer content, never a label. */
  children: ReactNode;
  /** Default "button", so a Button inside a form never submits it by accident. */
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;
```

- Renders one `<button>` with `type` defaulting to `"button"`, the `children` as its accessible
  name, and the `ref` forwarded to that element ([validated by `renders one <button type="button"> whose accessible name is the children "Ny samtale"` @85244768](../../tests/Button.test.tsx#L26),
  [validated by type="submit" renders type="submit" @9a107474](../../tests/Button.test.tsx#L33), [validated by `the ref reaches the <button> element` @76ae0373](../../tests/Button.test.tsx#L43)).
- `variant` picks the look: `primary` is the composer send button's accent fill (the
  `ACCENT_BG` and `ACCENT_BG_HOVER` token strings from `src/theme/tokens.ts`, reading
  `--bowman-accent` and `--bowman-accent-hover`, with the `TEXT_ON_ACCENT` string reading
  `--bowman-text-on-accent`), `secondary` is the
  chat-demo's "new chat" look (a `border-slate-200` border on `bg-white` with `text-slate-700`),
  `ghost` is borderless text with a hover surface (`text-slate-600 hover:bg-slate-50`), each with
  its `dark:` counterpart. Every variant carries the package's focus ring (`focus:ring-2` beside
  the `FOCUS_RING_COLOR` token string, reading `--bowman-focus-ring`) and the
  `disabled:cursor-not-allowed disabled:opacity-50` pair ([validated
  by](../../tests/Button.test.tsx#L96),
  [validated by variant="primary" carries the --bowman-accent background and hover, --bowman-text-on-accent text and no border-slate-200 @98b3781e](../../tests/Button.test.tsx#L96), [validated by variant="ghost" reads --bowman-text-secondary, its hover reads --bowman-text-strong, beside --bowman-surface-hover with neither a border token nor the --bowman-accent background @273e2213](../../tests/Button.test.tsx#L113),
  [validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @59bf81c0](../../tests/Button.test.tsx#L123)).
- `ghost`'s hover text and the `SearchField` input read `--bowman-text-strong`
  (docs/design-notes.md § Theming decision 6), so a consumer recolours the emphasised text on
  both with the theme rather than the fixed slate they carried before
  ([validated by variant="ghost" reads --bowman-text-secondary, its hover reads --bowman-text-strong, beside --bowman-surface-hover with neither a border token nor the --bowman-accent background @3ff5ea71](../../tests/Button.test.tsx#L110), [validated by the input reads the strong text token, so a consumer recolours the query text with the theme @33b271c4](../../tests/SearchField.test.tsx#L123)).
- `size` picks the padding and type scale: `md` is `px-4 py-2.5 text-sm`, `sm` is
  `px-3 py-1.5 text-xs` ([validated by @a999edc8](../../tests/Button.test.tsx#L143),
  [L150@9338a074](../../tests/Button.test.tsx#L150)).
- `icon`, when given, renders before the text with `h-4 w-4` at `md` and `h-3.5 w-3.5` at `sm`;
  a package icon rendered this way carries `aria-hidden="true"` because it receives no
  `ariaLabel` ([validated by `icon={PlusIcon} at md renders an aria-hidden <svg class="h-4 w-4"> before the text "Ny samtale"` @9e79a803](../../tests/Button.test.tsx#L163),
  [L183@4877b3b2](../../tests/Button.test.tsx#L183),
  [validated by with icon omitted no svg renders and the button holds only the text @94bb244c](../../tests/Button.test.tsx#L193)).
- `onClick` receives the click event; `disabled` renders the native attribute and the click never
  fires ([validated by clicking "Ny samtale" calls onClick once with the click event @07bf0cd1](../../tests/Button.test.tsx#L57), [validated by disabled renders the native attribute and the click never reaches onClick @61123d4e](../../tests/Button.test.tsx#L69)).
- `Button` renders no string of its own - its text is `children` - so it sits in `noStrings` and
  takes no `labels` prop ([validated by](../../tests/labelled-exports.test.tsx#L138),
  [validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports @55e0da40](../../tests/labelled-exports.test.tsx#L165)).

### `IconButton`

```ts
export interface IconButtonLabels {
  /** The button's accessible name. Required: no plausible English default exists. */
  accessibleName: string;
}

export interface IconButtonProps {
  icon: ComponentType<{ className?: string }>;
  /** Required, no defaults object: an icon-only button without a name is the defect. */
  labels: IconButtonLabels;
  /** Default "secondary". */
  variant?: ButtonVariant;
  /** Default "md". */
  size?: ButtonSize;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const IconButton: ForwardRefExoticComponent<
  IconButtonProps & RefAttributes<HTMLButtonElement>
>;
```

- Renders one `<button>` named by `labels.accessibleName` through `aria-label`, containing only
  the icon (`h-4 w-4` at `md`, `h-3.5 w-3.5` at `sm`, `aria-hidden`), with square padding
  (`p-2` at `md`, `p-1.5` at `sm`) and the same variant looks, focus ring and disabled pair as
  `Button` ([validated by `renders one <button type="button"> named "Tilføj 4711" through aria-label with empty text content` @426c48b3](../../tests/IconButton.test.tsx#L27),
  [validated by `the button contains only one aria-hidden <svg class="h-4 w-4"> at md` @db4ce6b9](../../tests/IconButton.test.tsx#L50),
  [validated by with size omitted the button carries the square md padding p-2 and no text scale @de1de210](../../tests/IconButton.test.tsx#L124), [L133@88e300dd](../../tests/IconButton.test.tsx#L133),
  [validated by with variant omitted the button is secondary: border beside --bowman-border, --bowman-surface and --bowman-text-body, no --bowman-accent background @7bdffa81](../../tests/IconButton.test.tsx#L83), [validated by variant="primary" carries the --bowman-accent background and hover, --bowman-text-on-accent text and no border-slate-200 @98b3781e](../../tests/IconButton.test.tsx#L96),
  [validated by variant="ghost" reads --bowman-text-secondary and --bowman-surface-hover and no border class at all @36d993c6](../../tests/IconButton.test.tsx#L99), [validated by focus:ring-2 ring-offset-2 stay beside the --bowman-focus-ring and --bowman-ring-offset colours and the disabled pair is present @645af565](../../tests/IconButton.test.tsx#L112)).
- `IconButton` shares `Button`'s `type` default and `"submit"` option, its `onClick` event and its
  `disabled` behaviour ([validated by type="submit" renders type="submit" @9a107474](../../tests/IconButton.test.tsx#L36),
  [validated by `renders one <button type="button"> named "Tilføj 4711" through aria-label with empty text content` @426c48b3](../../tests/IconButton.test.tsx#L27), [validated by clicking "Tilføj 4711" calls onClick once with the click event @ac3c0a66](../../tests/IconButton.test.tsx#L61),
  [validated by disabled renders the native attribute and the click never reaches onClick @61123d4e](../../tests/IconButton.test.tsx#L69)).
- `labels` is required and `IconButtonLabels` has no defaults object: the accessible name is the
  component's only string and no English default may stand in for it, the same reasoning as
  `aiDisclosure` (docs/design-notes.md § Labels decision 5). Omitting `labels` is a compile
  error against the built package ([validated by IconButton's sentinel labels are exactly the one required key accessibleName @5ffa4440](../../tests/labelled-exports.test.tsx#L673),
  [L55@578e2ae7](../../tests/types/primitives-type-assertions.tsx#L55),
  [validated by tsc accepts primitives-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @5f78b662](../../tests/primitives-dist.test.ts#L42)).
- The accessible name goes through `labels`, never a string prop, so `IconButton` is a
  `labelsProp` member and the closed `stringPropOnly` list is untouched
  ([validated by @4a070485](../../tests/labelled-exports.test.tsx#L93),
  [validated by no run of three Latin letters survives outside the sentinels for any labelsProp member @ffb54b18](../../tests/labelled-exports.test.tsx#L689)).

### `PromptChips`

```ts
export interface PromptChipsLabels {
  /** The chip group's accessible name. */
  suggestedPrompts: string;
}

export const defaultPromptChipsLabels: Readonly<Required<PromptChipsLabels>>; // "Suggested prompts"

export interface PromptChipsProps {
  prompts: ReadonlyArray<string>;
  /** Receives the picked prompt's text; pairs with ChatComposerHandle.setValue. */
  onPick: (text: string) => void;
  labels?: Partial<PromptChipsLabels>;
}

export function PromptChips(props: PromptChipsProps): ReactElement | null;
```

- Renders a `<ul role="list">` named by `suggestedPrompts`, one `<li>` per prompt holding a
  `<button type="button">` whose accessible name is the prompt text, laid out as a wrapping,
  centred row of rounded chips (`flex flex-wrap justify-center gap-2`; chip:
  `rounded-full border border-slate-200 bg-white px-4 py-2 text-sm`)
  ([validated by `renders a <ul> with role="list" named "Suggested prompts" by default` @a8036d1c](../../tests/PromptChips.test.tsx#L21),
  [validated by labels={{ suggestedPrompts: "Forslag" }} names the list "Forslag" and "Suggested prompts" appears nowhere @011e3ca9](../../tests/PromptChips.test.tsx#L31),
  [validated by labels={{ suggestedPrompts: undefined }} falls back to "Suggested prompts" @e5e6a5c3](../../tests/PromptChips.test.tsx#L44), [validated by `three prompts render three type="button" chips named by the prompt texts, in order, one per <li>` @d08c2843](../../tests/PromptChips.test.tsx#L65),
  [validated by a chip carries the rounded-full pill classes beside the --bowman-border, --bowman-surface, --bowman-surface-hover and --bowman-text-body tokens @eff6fe0c](../../tests/PromptChips.test.tsx#L109)).
- Clicking a chip calls `onPick` once with exactly that prompt's text
  ([validated by clicking "Hvor er min booking?" calls onPick once with exactly that string @54c67f22](../../tests/PromptChips.test.tsx#L82),
  [validated by clicking "Skift afrejsedato" leaves the other two prompts uncalled @3e75266a](../../tests/PromptChips.test.tsx#L93)).
- An empty `prompts` array renders nothing at all - no list, no accessible name
  ([validated by @9f810efa](../../tests/PromptChips.test.tsx#L56)).
- Two identical prompt strings render two chips; keys are index-qualified so React never
  collapses them ([validated by two identical prompts "Send faktura 4711" render two chips @11fbdedc](../../tests/PromptChips.test.tsx#L103)).
- `PromptChips` is the intended content of `ChatMessageList`'s `prompts` slot, which stays typed
  `ReactNode`: the consumer renders `prompts={<PromptChips prompts={...} onPick={pick} />}` and
  wires `onPick` to `ChatComposerHandle.setValue` itself. The slot contract does not change
  ([validated by @9eb448da](../../tests/ChatMessageList.test.tsx#L165)).

### `SearchField`

```ts
export interface SearchFieldLabels {
  /** The input's accessible name - a real label, never the placeholder. */
  searchInput: string;
  searchPlaceholder: string;
}

export const defaultSearchFieldLabels: Readonly<Required<SearchFieldLabels>>; // "Search", "Search..."

export interface SearchFieldProps {
  value: string;
  /** Receives the input's new value verbatim - untrimmed, a controlled input's contract. */
  onChange: (value: string) => void;
  disabled?: boolean;
  labels?: Partial<SearchFieldLabels>;
}

export const SearchField: ForwardRefExoticComponent<
  SearchFieldProps & RefAttributes<HTMLInputElement>
>;
```

- Renders a wrapper `<div class="relative">` holding a decorative `SearchIcon` (absolutely
  positioned at the left, `pointer-events-none`, `aria-hidden`) and one `<input type="search">`
  named by `searchInput` through `aria-label`, with `searchPlaceholder` as its placeholder and
  the `ref` forwarded to the input ([validated by `renders one <input type="search"> named "Search" with placeholder "Search..." by default` @dd7180cf](../../tests/SearchField.test.tsx#L16),
  [validated by `the SearchIcon is an aria-hidden, pointer-events-none absolute <svg> inside a relative wrapper` @50597927](../../tests/SearchField.test.tsx#L64), [validated by `the forwarded ref reaches the <input>` @8a1a68d3](../../tests/SearchField.test.tsx#L54),
  [validated by labels={{ searchInput: "Søg i samtaler", searchPlaceholder: "Søg..." }} renders both overrides with no "Search" left in the DOM @00f2bd62](../../tests/SearchField.test.tsx#L84), [validated by labels={{ searchInput: undefined }} falls back to the "Search" default @41ebc09e](../../tests/SearchField.test.tsx#L100)).
- The input is controlled: it renders `value`, and every change calls `onChange` with the
  input's new value verbatim. `type="search"` brings the browser's own clear control, which
  empties the controlled field through `onChange("")` in Chromium and WebKit alike;
  `Escape`-to-clear is Chromium's own, and WebKit leaves the value (issue 218) - measured on
  the demo's `search-field` documentation page (issue 151)
  ([validated by value="4711" renders as the input's value @c5fa5032](../../tests/SearchField.test.tsx#L25),
  [validated by a change to " Hvor " calls onChange once with " Hvor " untrimmed @b77368a3](../../tests/SearchField.test.tsx#L31),
  [browser@fe193eeb](../../examples/chat-demo/tests/docs.spec.ts#L196)).
- `disabled` renders the native attribute ([validated by disabled renders the native disabled attribute @6c07bf8e](../../tests/SearchField.test.tsx#L42),
  [validated by the input is enabled when disabled is omitted @75ffe78a](../../tests/SearchField.test.tsx#L48)).
- No clear button, no submit, no debounce: filtering as the user types is the consumer's, and
  `useDebounce` already ships for it ([validated by renders no button - no clear control and no submit @4b1b51c6](../../tests/SearchField.test.tsx#L76)).

## Conventions every primitive follows

- All four component files open with `"use client"` as their first statement: each takes a
  handler prop, which the trigger list (docs/design-notes.md decision 1, rule 5) measures off
  the AST, and the built `dist/components/*.js` files open with the directive
  ([validated by @aa2dfde1](../../tests/primitives-dist.test.ts#L23)).
- `Button`, `IconButton` and `SearchField` are `forwardRef` components (decision 4: no cleanup
  rewrites `forwardRef` away), so a consumer can focus the control - a "jump to latest" button,
  a search box behind a keyboard shortcut - without reaching into the DOM
  ([validated by `the ref reaches the <button> element` @76ae0373](../../tests/Button.test.tsx#L43), [validated by `the ref reaches the <button> element` @76ae0373](../../tests/IconButton.test.tsx#L42),
  [validated by `the forwarded ref reaches the <input>` @8a1a68d3](../../tests/SearchField.test.tsx#L54)).
- No primitive takes `className`, `style` or a render prop. Layout is the wrapper's: a `Button`
  in a `flex flex-col` sidebar column stretches to the column's width on its own, and a floating
  "jump to latest" `IconButton` is positioned by the element the consumer wraps it in. The
  stance is `Toast`'s (docs/design-notes.md § Toast): a consumer needing a different shape
  renders its own element ([validated by @6e02ef94](../../tests/types/primitives-type-assertions.tsx#L50),
  [L57@542502d2](../../tests/types/primitives-type-assertions.tsx#L57),
  [L60@77abdfdd](../../tests/types/primitives-type-assertions.tsx#L60),
  [L63@2cc891df](../../tests/types/primitives-type-assertions.tsx#L63),
  [validated by tsc accepts primitives-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @5f78b662](../../tests/primitives-dist.test.ts#L42)).
- No icon is added: `PlusIcon`, `SearchIcon` and `ChevronDownIcon` cover the issue's six cases,
  and `SearchField` is the first shipped component to render `SearchIcon`
  ([validated by exports exactly the 24 icon components plus IconWrapper and getAccessibleIconProps @52b2a89a](../../tests/icons.test.tsx#L57), [validated by `the SearchIcon is an aria-hidden, pointer-events-none absolute <svg> inside a relative wrapper` @50597927](../../tests/SearchField.test.tsx#L64)).
- `Button` and `IconButton` share their variant and size class maps through a private
  `src/components/buttonStyles.ts` that the barrel does not export: the built runtime and type
  export lists equal the committed snapshot, which carries none of its names
  ([validated by @3c9682f2](../../tests/public-api.test.ts#L40), [L46@1a95e338](../../tests/public-api.test.ts#L46),
  [validated by with variant omitted the button is secondary: border beside --bowman-border, --bowman-surface and --bowman-text-body, no --bowman-accent background @7bdffa81](../../tests/IconButton.test.tsx#L83)).
- The built `dist/components/buttonStyles.js` ships in the pack beside the four primitives and does
  not open with `"use client"`: it has no handler and no hook (decision 1)
  ([validated by dist/components/buttonStyles.js exists and does not open with "use client"; @e8837c6b](../../tests/primitives-dist.test.ts#L28),
  [validated by npm pack --dry-run ships the four primitives and buttonStyles with their d.ts files @c94492a3](../../tests/primitives-dist.test.ts#L33)).

## The published surface

`tests/fixtures/public-api.json` grows by six runtime names (`Button`, `IconButton`,
`PromptChips`, `SearchField`, `defaultPromptChipsLabels`, `defaultSearchFieldLabels`) and nine
type names (`ButtonProps`, `ButtonSize`, `ButtonVariant`, `IconButtonLabels`,
`IconButtonProps`, `PromptChipsLabels`, `PromptChipsProps`, `SearchFieldLabels`,
`SearchFieldProps`), written by `node scripts/write-public-api.mjs` after the surface was
decided here, never regenerated to make the test pass ([validated
by](../../tests/public-api.test.ts#L40),
[L46@1a95e338](../../tests/public-api.test.ts#L46)). Nothing is removed or renamed.

## Recorded decisions

1. **A third variant, `ghost`.** The issue proposes `primary | secondary`. Two controls need a
   borderless look - the attach control inside the composer's dashed footer row (the issue's
   fifth case), and the chat-demo's sign-out footer button, a control the issue did not
   enumerate - and a bordered `secondary` there reads as chrome. One `ButtonVariant` union
   serves both components so a consumer never learns two
   vocabularies ([validated by variant="ghost" reads --bowman-text-secondary, its hover reads --bowman-text-strong, beside --bowman-surface-hover with neither a border token nor the --bowman-accent background @273e2213](../../tests/Button.test.tsx#L113),
   [validated by variant="ghost" reads --bowman-text-secondary and --bowman-surface-hover and no border class at all @36d993c6](../../tests/IconButton.test.tsx#L99),
   [L48@c5aebd49](../../tests/types/primitives-type-assertions.tsx#L48)).
2. **`IconButton` ships no `defaultIconButtonLabels`.** Its one key is required, so the defaults
   object would be an empty frozen object exported for ceremony. `IconButton` therefore joins
   `ChatMessageList` as a component whose `labels` prop is itself required; docs/design-notes.md
   § Labels records both ([validated by IconButton's sentinel labels are exactly the one required key accessibleName @5ffa4440](../../tests/labelled-exports.test.tsx#L673),
   [L55@578e2ae7](../../tests/types/primitives-type-assertions.tsx#L55),
   [validated by tsc accepts primitives-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture @5f78b662](../../tests/primitives-dist.test.ts#L42)).
3. **The `prompts` slot stays `ReactNode`.** Folding the chips into `ChatMessageList` (a
   `prompts: string[]` plus an `onPromptPick`) would break the slot's type for every consumer
   and still could not reach the composer, which is a sibling. The list renders what it is
   handed; the consumer wires the pick to `setValue`.
4. **No `className` on any primitive.** A class-name escape hatch reintroduces the hand-written
   utility strings the issue exists to retire, and Tailwind's generated order - not attribute
   order - decides which of two conflicting utilities wins, so appended classes fail silently
   ([validated by @6e02ef94](../../tests/types/primitives-type-assertions.tsx#L50),
   [L57@542502d2](../../tests/types/primitives-type-assertions.tsx#L57),
   [L60@77abdfdd](../../tests/types/primitives-type-assertions.tsx#L60),
   [L63@2cc891df](../../tests/types/primitives-type-assertions.tsx#L63)).
5. **`SearchField` reports the raw value.** A controlled input that trimmed on the way out would
   fight the caret; `ChatComposer` trims because it clears, `SearchField` does not because it
   reflects ([validated by a change to " Hvor " calls onChange once with " Hvor " untrimmed @b77368a3](../../tests/SearchField.test.tsx#L31)).
6. **`Text` and layout primitives are refused**, as the issue says: the greeting and the sidebar
   footer are consumer prose, and a layout primitive would decide spacing the consumer's page
   already decides.

## Out of scope

README § Minimal app keeps its hand-written "new chat" button and `examples/chat-demo` keeps its
hand-styled controls: both are the follow-ups the issue names for after this lands (the README
one also closes re-cinq/bowman-ui#42). README's App Router paragraph and docs/design-notes.md
§ RSC fixture gain the four components in their list of function-valued props, because that
list is a claim about every export; nothing else in README changes.
