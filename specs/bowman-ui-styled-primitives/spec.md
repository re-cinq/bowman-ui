# bowman-ui styled primitives

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
([validated by](../../tests/styles.test.ts#L31)).

## What ships

Four components, two defaults objects and nine types, all from the package root
([validated by](../../tests/public-api.test.ts#L40), [L46](../../tests/public-api.test.ts#L46),
[L117](../../tests/PromptChips.test.tsx#L117), [L105](../../tests/SearchField.test.tsx#L105)).
Every value export lands in one bucket of `tests/labelled-exports.test.tsx`
([validated by](../../tests/labelled-exports.test.tsx#L158)). The `labelsProp` bucket holds
`IconButton`, `PromptChips` and `SearchField`, with a sentinel harness each
([validated by](../../tests/labelled-exports.test.tsx#L88),
[L89](../../tests/labelled-exports.test.tsx#L89),
[L90](../../tests/labelled-exports.test.tsx#L90),
[L617](../../tests/labelled-exports.test.tsx#L617),
[L621](../../tests/labelled-exports.test.tsx#L621),
[L627](../../tests/labelled-exports.test.tsx#L627),
[L633](../../tests/labelled-exports.test.tsx#L633)). The `noStrings` bucket holds `Button`,
`defaultPromptChipsLabels` and `defaultSearchFieldLabels`
([validated by](../../tests/labelled-exports.test.tsx#L132),
[L144](../../tests/labelled-exports.test.tsx#L144),
[L145](../../tests/labelled-exports.test.tsx#L145)). The `stringPropOnly` list stays at its three
closed members ([validated by](../../tests/labelled-exports.test.tsx#L158)).

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
  name, and the `ref` forwarded to that element ([validated by](../../tests/Button.test.tsx#L15),
  [L22](../../tests/Button.test.tsx#L22), [L32](../../tests/Button.test.tsx#L32)).
- `variant` picks the look: `primary` is the composer send button's blue fill
  (`bg-blue-500 text-white`), `secondary` is the chat-demo's "new chat" look (a `border-slate-200`
  border on `bg-white` with `text-slate-700`), `ghost` is borderless text with a hover surface
  (`text-slate-600 hover:bg-slate-50`), each with its `dark:` counterpart. Every variant carries
  the package's focus ring (`focus:ring-2 focus:ring-blue-500`) and the
  `disabled:cursor-not-allowed disabled:opacity-50` pair ([validated
  by](../../tests/Button.test.tsx#L82),
  [L89](../../tests/Button.test.tsx#L89), [L102](../../tests/Button.test.tsx#L102),
  [L110](../../tests/Button.test.tsx#L110)).
- `size` picks the padding and type scale: `md` is `px-4 py-2.5 text-sm`, `sm` is
  `px-3 py-1.5 text-xs` ([validated by](../../tests/Button.test.tsx#L133),
  [L140](../../tests/Button.test.tsx#L140)).
- `icon`, when given, renders before the text with `h-4 w-4` at `md` and `h-3.5 w-3.5` at `sm`;
  a package icon rendered this way carries `aria-hidden="true"` because it receives no
  `ariaLabel` ([validated by](../../tests/Button.test.tsx#L153),
  [L173](../../tests/Button.test.tsx#L173),
  [L183](../../tests/Button.test.tsx#L183)).
- `onClick` receives the click event; `disabled` renders the native attribute and the click never
  fires ([validated by](../../tests/Button.test.tsx#L46), [L58](../../tests/Button.test.tsx#L58)).
- `Button` renders no string of its own - its text is `children` - so it sits in `noStrings` and
  takes no `labels` prop ([validated by](../../tests/labelled-exports.test.tsx#L132),
  [L158](../../tests/labelled-exports.test.tsx#L158)).

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
  `Button` ([validated by](../../tests/IconButton.test.tsx#L17),
  [L40](../../tests/IconButton.test.tsx#L40),
  [L111](../../tests/IconButton.test.tsx#L111), [L120](../../tests/IconButton.test.tsx#L120),
  [L73](../../tests/IconButton.test.tsx#L73), [L80](../../tests/IconButton.test.tsx#L80),
  [L87](../../tests/IconButton.test.tsx#L87), [L96](../../tests/IconButton.test.tsx#L96)).
- `IconButton` shares `Button`'s `type` default and `"submit"` option, its `onClick` event and its
  `disabled` behaviour ([validated by](../../tests/IconButton.test.tsx#L26),
  [L17](../../tests/IconButton.test.tsx#L17), [L51](../../tests/IconButton.test.tsx#L51),
  [L59](../../tests/IconButton.test.tsx#L59)).
- `labels` is required and `IconButtonLabels` has no defaults object: the accessible name is the
  component's only string and no English default may stand in for it, the same reasoning as
  `aiDisclosure` (docs/design-notes.md § Labels decision 5). Omitting `labels` is a compile
  error against the built package ([validated by](../../tests/labelled-exports.test.tsx#L617),
  [L55](../../tests/types/primitives-type-assertions.tsx#L55),
  [L39](../../tests/primitives-dist.test.ts#L39)).
- The accessible name goes through `labels`, never a string prop, so `IconButton` is a
  `labelsProp` member and the closed `stringPropOnly` list is untouched
  ([validated by](../../tests/labelled-exports.test.tsx#L88),
  [L633](../../tests/labelled-exports.test.tsx#L633)).

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
  ([validated by](../../tests/PromptChips.test.tsx#L13),
  [L23](../../tests/PromptChips.test.tsx#L23),
  [L36](../../tests/PromptChips.test.tsx#L36), [L57](../../tests/PromptChips.test.tsx#L57),
  [L101](../../tests/PromptChips.test.tsx#L101)).
- Clicking a chip calls `onPick` once with exactly that prompt's text
  ([validated by](../../tests/PromptChips.test.tsx#L74),
  [L85](../../tests/PromptChips.test.tsx#L85)).
- An empty `prompts` array renders nothing at all - no list, no accessible name
  ([validated by](../../tests/PromptChips.test.tsx#L48)).
- Two identical prompt strings render two chips; keys are index-qualified so React never
  collapses them ([validated by](../../tests/PromptChips.test.tsx#L95)).
- `PromptChips` is the intended content of `ChatMessageList`'s `prompts` slot, which stays typed
  `ReactNode`: the consumer renders `prompts={<PromptChips prompts={...} onPick={pick} />}` and
  wires `onPick` to `ChatComposerHandle.setValue` itself. The slot contract does not change
  ([validated by](../../tests/ChatMessageList.test.tsx#L140)).

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
  the `ref` forwarded to the input ([validated by](../../tests/SearchField.test.tsx#L15),
  [L63](../../tests/SearchField.test.tsx#L63), [L53](../../tests/SearchField.test.tsx#L53),
  [L83](../../tests/SearchField.test.tsx#L83), [L99](../../tests/SearchField.test.tsx#L99)).
- The input is controlled: it renders `value`, and every change calls `onChange` with the
  input's new value verbatim ([validated by](../../tests/SearchField.test.tsx#L24),
  [L30](../../tests/SearchField.test.tsx#L30)).
- `disabled` renders the native attribute ([validated by](../../tests/SearchField.test.tsx#L41),
  [L47](../../tests/SearchField.test.tsx#L47)).
- No clear button, no submit, no debounce: filtering as the user types is the consumer's, and
  `useDebounce` already ships for it ([validated by](../../tests/SearchField.test.tsx#L75)).

## Conventions every primitive follows

- All four component files open with `"use client"` as their first statement: each takes a
  handler prop, which the trigger list (docs/design-notes.md decision 1, rule 5) measures off
  the AST, and the built `dist/components/*.js` files open with the directive
  ([validated by](../../tests/primitives-dist.test.ts#L20)).
- `Button`, `IconButton` and `SearchField` are `forwardRef` components (decision 4: no cleanup
  rewrites `forwardRef` away), so a consumer can focus the control - a "jump to latest" button,
  a search box behind a keyboard shortcut - without reaching into the DOM
  ([validated by](../../tests/Button.test.tsx#L32), [L32](../../tests/IconButton.test.tsx#L32),
  [L53](../../tests/SearchField.test.tsx#L53)).
- No primitive takes `className`, `style` or a render prop. Layout is the wrapper's: a `Button`
  in a `flex flex-col` sidebar column stretches to the column's width on its own, and a floating
  "jump to latest" `IconButton` is positioned by the element the consumer wraps it in. The
  stance is `Toast`'s (docs/design-notes.md § Toast): a consumer needing a different shape
  renders its own element ([validated by](../../tests/types/primitives-type-assertions.tsx#L50),
  [L57](../../tests/types/primitives-type-assertions.tsx#L57),
  [L60](../../tests/types/primitives-type-assertions.tsx#L60),
  [L63](../../tests/types/primitives-type-assertions.tsx#L63),
  [L39](../../tests/primitives-dist.test.ts#L39)).
- No icon is added: `PlusIcon`, `SearchIcon` and `ChevronDownIcon` cover the issue's six cases,
  and `SearchField` is the first shipped component to render `SearchIcon`
  ([validated by](../../tests/icons.test.tsx#L56), [L63](../../tests/SearchField.test.tsx#L63)).
- `Button` and `IconButton` share their variant and size class maps through a private
  `src/components/buttonStyles.ts` that the barrel does not export: the built runtime and type
  export lists equal the committed snapshot, which carries none of its names
  ([validated by](../../tests/public-api.test.ts#L40), [L46](../../tests/public-api.test.ts#L46),
  [L73](../../tests/IconButton.test.tsx#L73)).
- The built `dist/components/buttonStyles.js` ships in the pack beside the four primitives and does
  not open with `"use client"`: it has no handler and no hook (decision 1)
  ([validated by](../../tests/primitives-dist.test.ts#L25),
  [L30](../../tests/primitives-dist.test.ts#L30)).

## The published surface

`tests/fixtures/public-api.json` grows by six runtime names (`Button`, `IconButton`,
`PromptChips`, `SearchField`, `defaultPromptChipsLabels`, `defaultSearchFieldLabels`) and nine
type names (`ButtonProps`, `ButtonSize`, `ButtonVariant`, `IconButtonLabels`,
`IconButtonProps`, `PromptChipsLabels`, `PromptChipsProps`, `SearchFieldLabels`,
`SearchFieldProps`), written by `node scripts/write-public-api.mjs` after the surface was
decided here, never regenerated to make the test pass ([validated
by](../../tests/public-api.test.ts#L40),
[L46](../../tests/public-api.test.ts#L46)). Nothing is removed or renamed.

## Recorded decisions

1. **A third variant, `ghost`.** The issue proposes `primary | secondary`. Two controls need a
   borderless look - the attach control inside the composer's dashed footer row (the issue's
   fifth case), and the chat-demo's sign-out footer button, a control the issue did not
   enumerate - and a bordered `secondary` there reads as chrome. One `ButtonVariant` union
   serves both components so a consumer never learns two
   vocabularies ([validated by](../../tests/Button.test.tsx#L102),
   [L87](../../tests/IconButton.test.tsx#L87),
   [L48](../../tests/types/primitives-type-assertions.tsx#L48)).
2. **`IconButton` ships no `defaultIconButtonLabels`.** Its one key is required, so the defaults
   object would be an empty frozen object exported for ceremony. `IconButton` therefore joins
   `ChatMessageList` as a component whose `labels` prop is itself required; docs/design-notes.md
   § Labels records both ([validated by](../../tests/labelled-exports.test.tsx#L617),
   [L55](../../tests/types/primitives-type-assertions.tsx#L55),
   [L39](../../tests/primitives-dist.test.ts#L39)).
3. **The `prompts` slot stays `ReactNode`.** Folding the chips into `ChatMessageList` (a
   `prompts: string[]` plus an `onPromptPick`) would break the slot's type for every consumer
   and still could not reach the composer, which is a sibling. The list renders what it is
   handed; the consumer wires the pick to `setValue`.
4. **No `className` on any primitive.** A class-name escape hatch reintroduces the hand-written
   utility strings the issue exists to retire, and Tailwind's generated order - not attribute
   order - decides which of two conflicting utilities wins, so appended classes fail silently
   ([validated by](../../tests/types/primitives-type-assertions.tsx#L50),
   [L57](../../tests/types/primitives-type-assertions.tsx#L57),
   [L60](../../tests/types/primitives-type-assertions.tsx#L60),
   [L63](../../tests/types/primitives-type-assertions.tsx#L63)).
5. **`SearchField` reports the raw value.** A controlled input that trimmed on the way out would
   fight the caret; `ChatComposer` trims because it clears, `SearchField` does not because it
   reflects ([validated by](../../tests/SearchField.test.tsx#L30)).
6. **`Text` and layout primitives are refused**, as the issue says: the greeting and the sidebar
   footer are consumer prose, and a layout primitive would decide spacing the consumer's page
   already decides.

## Out of scope

README § Minimal app keeps its hand-written "new chat" button and `examples/chat-demo` keeps its
hand-styled controls: both are the follow-ups the issue names for after this lands (the README
one also closes re-cinq/bowman-ui#42). README's App Router paragraph and docs/design-notes.md
§ RSC fixture gain the four components in their list of function-valued props, because that
list is a claim about every export; nothing else in README changes.
