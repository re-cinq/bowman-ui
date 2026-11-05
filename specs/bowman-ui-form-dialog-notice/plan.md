# Form, dialog and notice components

## What we want and why





Bowman UI is built for chat interfaces. Apps that use it for anything else, such as admin pages, settings or a confirmation step before a destructive action, find no text field, no dialog, no inline notice and no danger button. Each app then builds its own. That costs time, the copies drift apart in look and behaviour, and accessibility is redone by hand in every one, where it is easiest to get wrong.

We want Bowman to offer these general-purpose components itself:

- a `danger` variant for `Button`, for destructive actions
- `TextField`: a labelled input with hint and error text
- an `onSubmit` callback for `SearchField`, for searches that run on Enter or a click instead of on every keystroke
- Dialog: a modal that presents content requiring the user’s full attention before they can continue
- ConfirmDialog: a ready-made implementation of the dialog for confirming before a destructive or irreversible action containing the following UI elements:
  - a title,
  - a description,
  - a Cancel button
  - a danger-styled Confirm button;

  the consumer can add extra inputs between the description and the buttons when a yes-or-no click alone is not enough
- `Notice`: an inline message in an info, success, warning or error tone
- `KeyValueList`: label and value pairs
- `Card`: a panel, optionally selectable as a whole

Each follows Bowman's existing conventions, so an app can build such a screen from Bowman alone.

The teams most immediately affected are any that have already built their own admin pages or settings screens on top of Bowman. Today they own their own focus management, keyboard handling, colour choices and accessible markup for every modal, every inline alert and every labelled field — work that the library should absorb once and get right once. Bringing these components into Bowman means every future screen built on the library begins from a tested, accessible foundation rather than from scratch.

ConfirmDialog is a ready-made Dialog for confirming before a destructive or irreversible action; it always presents a title, a description, a Cancel button and a Confirm button, and it defines a busy prop. When an action triggered by the Confirm button is in progress — for example, while a server processes a delete request — the consumer sets the busy prop; this keeps the Confirm button non-interactive and prevents the user from submitting the same action twice, and the dialog cannot be dismissed while busy. When a yes-or-no click alone is not enough — for instance when the user must type the name of something they are about to delete, or supply a reason that is recorded alongside the action — the consumer places those extra inputs inside the dialog, between the description and the buttons. The dialog does not validate what is typed; the consumer manages that and keeps the Confirm button disabled until its own conditions are met.


The eight components address exactly the gap between what Bowman offers today and what a team needs to build a typical settings, confirmation or admin screen without stepping outside the library.

## Success criteria
























```kpi
{
  "kpiId": "kpi_32a1f868-2e51-4d9e-8407-8826534d04e9",
  "metric": "Components delivered",
  "baseline": "0 of 8",
  "target": "8 of 8",
  "direction": "up",
  "deadline": "",
  "rationale": "Each new component is exported from the package entry point with its Props type. TextField, Dialog, ConfirmDialog and Notice are also exported with their Labels types. ConfirmDialog and Notice also ship English default labels (\"Confirm\", \"Cancel\" for ConfirmDialog and \"Close\" for Dialog and Notice), while TextField has none because every one of its labels is specific to the field. The labels exported are exactly those listed in the KPIs. Each follows Bowman’s conventions. Custom labels defined in the component prop are merged against their defaults by the library, text arrives display-ready, focusable elements forward their refs, motion respects reduced motion, and styling uses only the existing colour tokens plus the approved danger colour. Each component has a README section and a harness demo of each of its states."
}
```

```kpi
{
  "kpiId": "kpi_7f177455-02d6-4fee-b83c-881f95cafca6",
  "metric": "Behaviour covered by tests",
  "baseline": "None",
  "target": "100% lines, statements, functions and branches as reported by the code coverage check",
  "direction": "up",
  "deadline": "",
  "rationale": "The tests prove, among other things, the following. A disabled danger button doesn't call onClick. TextField links its hint and error to the input and marks the input invalid on an error. SearchField calls onSubmit on Enter. Dialog moves focus inside, keeps it there, closes on Escape and returns focus to the element that opened it. ConfirmDialog keeps its confirm button disabled while confirmation is disabled, and does nothing while the dialog in in the busy state. Notice is announced politely for info and success and as an alert for warning and error. KeyValueList renders as a description list. A selectable Card is one button, and a static Card has no interactive role."
}
```

```kpi
{
  "kpiId": "kpi_08acbfc8-6157-458b-9ada-8b3852c3744e",
  "metric": "Accessibility: WCAG 2.2 AA contrast in light and dark themes",
  "baseline": "-",
  "target": "0 automated accessibility violations in every documented state",
  "direction": "hold",
  "deadline": "",
  "rationale": "The automated checks use axe and run on each state that applies to a component: default, disabled, error, busy, open and closed. Keyboard use is checked by hand. Contrast covers text and focus indicators, including the new danger button background. There is no separate reviewer gate; passing the automated checks and the hand-verified keyboard review is the bar."
}
```

```kpi
{
  "kpiId": "kpi_140c3025-f855-4175-aeec-bf07e6fb89ac",
  "metric": "Backward compatibility",
  "baseline": "-",
  "target": "0 removed or changed signatures, every existing test passing unchanged",
  "direction": "hold",
  "deadline": "",
  "rationale": "A diff of the published type declarations between the current release and this release shows only added exports and props. SearchField without an onSubmit handler behaves exactly as before. No existing consumer needs to change anything to pick up the new version."
}
```

Each component that carries assistive-technology strings ships them through its labels prop. The strings, and what each communicates to the user, are:

- **Text field** — the field's accessible name (always required), labels prop (always required), optional hint text displayed beneath the field, and optional error text announced when the field is in an invalid state.
- **Search field** — the existing input name and placeholder labels it already ships, plus an accessible name for the submit button added by this work.
- **Dialog** — an accessible name for the close button.
- **ConfirmDialog** — accessible names for the Cancel button and the Confirm button. The title text and the body description are consumer content, not labels. ConfirmDialog accepts a busy prop. When set, the Confirm button is non-interactive and the dialog cannot be dismissed, preventing a repeated submission while an action is in progress. The consumer sets the prop when an async action starts and clears it when the action settles.
  ConfirmDialog requires a specific user decision, so it does not expose the Dialog's default Close button.
- **Notice** — an accessible name for the dismiss button, when one is present.
- **Danger button, KeyValueList, Card** — no new labels. The danger button uses the same consumer-visible text as every other button variant. KeyValueList renders consumer-provided term and value pairs. Card's selectable form takes its accessible name from its visible content. The library enforces that no two components share a key name (i.e. the "key" in the "key-value" list with different meanings. This list is the starting point for verifying that constraint before implementation begins.

## In and out of scope


**In scope**

- The eight changes above, in the `bowman-ui` repo
- Their tests, accessibility checks, README sections and harness demos.

**Out of scope**

- Any screen, routing or data fetching in a consuming app. The library stays presentational.
- Data tables, pagination, tabs, selects, checkboxes, date pickers and toast tones. They're left for when an app needs them.
- Changes to existing components beyond the added `danger` variant and the `onSubmit` callback.
- A theme or token redesign. The new components use the existing colour tokens and add only the danger colour.
- Migrating existing apps. Each app moves to the components on its own schedule.

## Prototype

```prototype
{
  "maturity": "none",
  "url": "",
  "agreedBy": "",
  "notes": ""
}
```

## Constraints









- **Bowman's conventions:**
  - labels passed in through `labels` props, with `default…Labels` exports and `resolveLabels`
  - text that arrives display-ready, so the library reads no clock, locale or translations
  - forwarded refs on focusable elements
  - support for `reducedMotion`
  - styling with the existing Tailwind colour tokens
- **Releases:** changes only add to the API, so this is a minor release with no breaking changes.
- **Dependencies:** no new runtime dependencies. Dialogs use the native `<dialog>` element and the existing `useFocusTrap` hook.
- **Accessibility:** WCAG 2.2 AA is the minimum.
- **Colour token count:** The library tracks its colour token set exactly — the design record, the stylesheet, and an automated test must all agree on the number. Any new token added for this work (for example, a filled-button danger background, or info and warning tones for Notice) must be declared consistently in all places in the same release. The count cannot drift between them. The danger button needs 2 new colour tokens, so the total token count should be 44 + 2 = 46.
- **Published API snapshot:** Every new export — each component, its Props type, its Labels type and its default labels object — is added intentionally. An automated test holds the exact list of public names; the snapshot must be updated in the same pull request that adds the export.
- **Closed string-prop exceptions:** New components must define their user-visible strings through the labels convention, unless the design record is amended simultaneously in the same release. The fact that there are existing exceptions to this rule does not change anything.
- **Test coverage floor:** Source coverage must stay at 100% across lines, statements, functions and branches. No new component ships with gaps.



- **Danger button visual form — decided:** The danger button takes a filled form: solid red background, white text, matching the visual weight of the primary button. Because the existing danger colour tokens cover text and soft surfaces only, this form requires two new colour tokens — one for the button’s resting background and one for its hover state. The library currently tracks 44 colour tokens; after this release it will track 46. Both new tokens must be added to the design record, the stylesheet comment block, and the other places checked by the automated token count test in the same release, and every one of those update sites must agree on the new total of 46. The count cannot drift between them.
- **Notice tone colours — decided:** Blue is ti be used for its info tone. Yellow is to be used for its warning tone. Existing green tokens are to be used for success. Existing red danger tokens are to be used for error
  Existing palette values should be reused  in both cases; no new colour token is added for either tone.
  Any consuming app that overrides the accent blue or danger red tokens will see those overrides reflected in the corresponding Notice tones; the warning and info tones are not individually overridable.

## Who operates it

re:cinq builds, deploys and operates the library, which includes features in this plan.

## Delivery implications




All eight changes ship together in one minor release. A minor release adds to the published API without removing or changing anything, so every consuming app that upgrades receives the new components and nothing breaks. Apps that are not ready to use the new components ignore them and continue working unchanged.

Nothing ships half-done. A component is complete only when its tests, its accessibility checks, its harness demo and its README section are all present and passing. There is no accessibility reviewer is required to sign off; the automated checks and the hand-verified keyboard coverage described in the success criteria are the bar that must be cleared. No partial release to meet an external deadline is acceptable; the release ships when all eight components are complete. Any earlier reference to an accessibility reviewer gate should be treated as a draft-sequence artifact — the KPI, the settled answers and this prose are consistent: no reviewer gate.

There is no fixed delivery date.

The release is published through the existing staged, reviewer-approved publish process. No maintainer publishes by hand; the release tag triggers the pipeline, and a maintainer approves the staged package on the package registry before it becomes public.



## Open questions
