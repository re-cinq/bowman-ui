# Form, dialog and notice components

| Field  | Value       |
| ------ | ----------- |
| Issue  | -           |
| Status | Draft       |

Bowman UI is built for chat interfaces. Apps that use it for anything else, such as admin pages, settings or a confirmation step before a destructive action, find no text field, no dialog, no inline notice and no danger button. Each app then builds its own. That costs time, the copies drift apart in look and behaviour, and accessibility is redone by hand in every one. This spec introduces general-purpose components to address exactly the gap between what Bowman offers today and what a team needs to build a typical settings, confirmation or admin screen without stepping outside the library. The decision record lives in docs/design-notes.md § Form, dialog and notice components.

## Overview

We want Bowman to offer these general-purpose components itself, so every future screen built on the library begins from a tested, accessible foundation rather than from scratch:

- a `danger` variant for `Button` and `IconButton`, for destructive actions ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-3))
- `TextField`: a labelled input with hint and error text ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-4))
- an `onSubmit` callback for `SearchField`, for searches that run on Enter or a click instead of on every keystroke ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-5))
- Dialog: a modal that presents content requiring the user’s full attention before they can continue ([from plan](plan.md))
- ConfirmDialog: a ready-made implementation of the dialog for confirming before a destructive or irreversible action containing the following UI elements:
  - a title,
  - a description,
  - a Cancel button
  - a danger-styled Confirm button;

  the consumer can add extra inputs between the description and the buttons when a yes-or-no click alone is not enough ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#p_13644075-15d3-4dc1-b80f-7bb251ebacf7), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#p_26727aed-6334-4fea-86f1-a547d0222f0b))

- `Notice`: an inline message in an info, success, warning or error tone, optionally dismissible ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-7))
- `KeyValueList`: label and value pairs ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-8))
- `Card`: a panel, optionally selectable as a whole ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-9))

- Bowman UI is built for chat interfaces; apps that build admin pages, settings screens or confirmation flows on top of Bowman today find no text field, no dialog, no inline notice and no danger button, and must build and maintain their own. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-1))
- Bowman offers these general-purpose components so every future screen built on the library begins from a tested, accessible foundation rather than from scratch. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-2))
- The teams most immediately affected are those that have already built admin pages or settings screens on top of Bowman and today own their own focus management, keyboard handling, colour choices and accessible markup; bringing these components into Bowman absorbs that responsibility once. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-14))
- The eight components cover exactly the gap between what Bowman offers today and what a team needs to build a typical settings, confirmation or admin screen without stepping outside the library. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-16))

## What ships

### Button and IconButton — danger variant

The `danger` variant for `Button` and `IconButton` is intended for destructive actions ([from plan](plan.md)).

### SearchField

SearchField receives an `onSubmit` callback for searches that run on Enter or a click instead of on every keystroke ([from plan](plan.md)).

### TextField

TextField is a general-purpose labelled input component that provides support for hint text and error text to be announced when the field is in an invalid state ([from plan](plan.md)).

### Dialog

Dialog is a modal component that presents content requiring the user’s full attention before they can continue ([from plan](plan.md)).

### ConfirmDialog

ConfirmDialog is a ready-made Dialog for confirming before a destructive or irreversible action; it always presents a title, a description, a Cancel button and a Confirm button, and it defines a `confirmDisabled` prop and a `busy` prop ([from plan](plan.md), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#p_26727aed-6334-4fea-86f1-a547d0222f0b)).
When a yes-or-no click alone is not enough — for instance when the user must type the name of something they are about to delete, or supply a reason that is recorded alongside the action — the consumer places those extra inputs inside the dialog, between the description and the buttons ([from plan](plan.md)). The dialog does not validate what is typed; the consumer manages that and keeps the Confirm button disabled until its own conditions are met ([from plan](plan.md)).
When an action triggered by the Confirm button is in progress — for example, while a server processes a delete request — the consumer sets the busy prop; this keeps the Confirm button non-interactive and prevents the user from submitting the same action twice, and the dialog cannot be dismissed while busy ([from plan](plan.md)).

### Notice

Notice is a general-purpose inline message component that can be rendered in an info, success, warning or error tone ([from plan](plan.md)).

### KeyValueList

KeyValueList is a component that renders a list of label and value pairs ([from plan](plan.md)).

### Card

Card is a panel component that can optionally be rendered as a single selectable element ([from plan](plan.md)).

## Label keys

- Each component that carries assistive-technology strings ships them through its `labels` prop. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-11))
- TextField's `labels` prop is required and carries three keys: `fieldLabel`, the field's visible label and accessible name (required, no default); `fieldHint`, optional help text displayed beneath the field; and `fieldError`, optional error text announced when the field is invalid — its presence is what marks the field invalid. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-12))
- SearchField's `labels` carries: the existing `searchInput` (the input's accessible name) and `searchPlaceholder` keys, unchanged, plus `submitSearch`, the accessible name of the submit button added by this work (default `"Submit search"`). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-13))
- Dialog's `labels` carries: `dialogTitle`, the dialog's heading and accessible name (required, no default); and `closeDialog`, the close button's accessible name (default `"Close"`). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-14))
- ConfirmDialog's `labels` carries: `dialogTitle`, the dialog's heading and accessible name (required, no default, same meaning as Dialog's); `confirmAction`, the Confirm button's text, naming the action (required, no default — it must name the action, never a generic "OK" or "Confirm"); and `cancelAction`, the Cancel button's text (default `"Cancel"`). The description is consumer content, not a label. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-15))
- Notice's `labels` carries: an accessible name for the dismiss button (the `dismissNotice` key, default `"Dismiss"`), when one is present. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-16))
- The danger button, KeyValueList, and Card carry no new label keys: the danger button uses the same consumer-visible text as every other button variant; KeyValueList renders consumer-provided term and value pairs; Card's selectable form takes its accessible name from its visible content. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-17))
- No two components share a label key name with different meanings. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-18))

- The key `dialogTitle` is shared between Dialog and ConfirmDialog with the same meaning in both, which Bowman's convention allows; no other key is shared between any of the new components. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-17))
- The existing automated labels test re-checks the full set of exported label keys when the new components are added, confirming that none of the new keys collides with any key already exported by the library. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-17))

## Conventions all new components follow

- Custom labels defined in the component prop are merged against their defaults by the library. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Text arrives display-ready. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Focusable elements forward their refs. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Motion respects the user's reduced-motion preference. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Styling uses only the existing colour tokens plus all nine new colour tokens — five for the danger button (`--bowman-danger-fill`, `--bowman-danger-fill-dark`, `--bowman-danger-fill-hover`, `--bowman-danger-fill-hover-dark`, `--bowman-text-on-danger`) and four for Notice (`--bowman-info`, `--bowman-info-dark`, `--bowman-warning`, `--bowman-warning-dark`). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Each component has a README section and a harness demo of each of its states. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))

## The published surface

- Each new component is exported from the package entry point with its Props type. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- TextField, Dialog, ConfirmDialog, and Notice are also exported with their Labels types. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Dialog, ConfirmDialog, and Notice each ship English default labels objects — `defaultDialogLabels` ("Close" for the close button), `defaultConfirmDialogLabels` ("Cancel" for the Cancel button), and `defaultNoticeLabels` ("Dismiss" for the dismiss button); SearchField's existing default labels object gains `"Submit search"` for the new `submitSearch` key; TextField ships no defaults object because every one of its labels is specific to the field; ConfirmDialog ships no default for `confirmAction` because it must name the action, never a generic value. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- A diff of the published type declarations between the current release and this release shows only added exports, added props, and the added danger variant. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f740be61-150f-4d33-823e-3edb467ed290))
- SearchField without an `onSubmit` handler behaves exactly as before. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f740be61-150f-4d33-823e-3edb467ed290))
- No existing consumer needs to change anything to pick up the new version. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f740be61-150f-4d33-823e-3edb467ed290))

- Each exported Labels type carries exactly the keys described in the Label keys section and no others. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))

## Recorded decisions

1. **ConfirmDialog extra fields.** The "optional extra fields" are a consumer-rendered content slot. The consumer provides the markup and manages its own field values. The dialog does not check what's typed; the app does that itself and uses the `confirmDisabled` or `busy` prop to keep the Confirm button disabled ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-confirmdialog-extra-fields)).

2. **Danger button visual form.** The danger button takes a filled form: solid red background, white text, matching the visual weight of the primary button. Because existing danger colour tokens cover text and soft surfaces only, five new colour tokens are required — `--bowman-danger-fill` (resting fill) and `--bowman-danger-fill-dark` (resting fill in dark mode), `--bowman-danger-fill-hover` (hover fill) and `--bowman-danger-fill-hover-dark` (hover fill in dark mode), and `--bowman-text-on-danger` (text colour on the fill, one value for both modes) — all declared in `src/theme/tokens.ts`; the existing danger text colour cannot be reused as the fill because it is too light in dark mode to carry white text, and the existing `--bowman-text-on-accent` token cannot be reused because a switch to dark text on the primary button must not also affect the danger button. Adding the danger variant amends a recorded design decision: `ButtonVariant` (in `src/components/buttonStyles.ts`) grows from three members (primary, secondary, ghost) to four, and both `Button` (`src/components/Button.tsx`) and `IconButton` gain the variant in the same release; the total colour token count rises from 44 to 53 across all nine new tokens in this release, and all update sites MUST agree on 53 in the same release. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-15), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-danger-button-form))
3. **Notice tone colours.** Info uses blue: two new themeable tokens `--bowman-info` and `--bowman-info-dark`, declared in `src/theme/tokens.ts`, with values taken from the existing blue palette. Warning uses yellow/amber: two new themeable tokens `--bowman-warning` and `--bowman-warning-dark`, with values taken from the existing amber palette (the library has no existing yellow token). Success reuses the existing `--bowman-success` tokens. Error reuses the existing `--bowman-danger` tokens. Each tone colours the icon and border and meets the 3:1 non-text contrast minimum in both themes; Notice text stays on the existing body text colours. A consuming app that overrides `--bowman-success` or `--bowman-danger` sees those overrides reflected in the matching Notice tones; the info and warning tones are individually overridable through their own tokens. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-16), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-notice-tones-tokens))

## Scope

**In scope** ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#sec_1ff9b9f5-21ee-43bf-93cd-4ca07cd42d06))

- All eight deliverables and their changes are confined to the `bowman-ui` repo; no other repository is modified: the danger variant of `src/components/Button.tsx`, the `onSubmit` callback added to `src/components/SearchField.tsx`, and the six new files `src/components/TextField.tsx`, `src/components/Dialog.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/Notice.tsx`, `src/components/KeyValueList.tsx`, and `src/components/Card.tsx`. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#8b34e548-4f4f-42e2-85a1-bdaaba16dfc2))
- Each deliverable MUST ship with Vitest behaviour tests reaching 100% line, statement, function, and branch coverage over `src/**` (enforced by `vitest.config.ts#L26`), an accessibility check, a README section, and a demo registered in `examples/chat-demo/src/docs/componentDocs.tsx` with example source files under `examples/chat-demo/src/docs/examples/`. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#147b96d4-3eab-45c7-80ef-49cdb5171359))

**Out of scope** ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#0e8e06c6-8eca-4b69-a4e1-7e7c0afc164a))

- Any screen, routing or data fetching in a consuming app. The library stays presentational; `src/` performs no routing, state management, or data-fetching. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#84a7bfbe-8149-4194-bca7-27828a4effce))
- Data tables, pagination, tabs, selects, checkboxes, date pickers, and toast tones. These are left until a consuming app needs them. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#c0060b3b-f605-4a16-8468-3870f46ca2f3))
- Changes to existing components beyond the danger variant added to `src/components/Button.tsx` and the `onSubmit` callback added to `src/components/SearchField.tsx`. No other file in `src/components/` is modified. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#617bb9f5-c7d2-4247-926b-82fb84cc19c3))
- A theme or token redesign. The new components use the existing `--bowman-*` colour tokens; the only colour additions are `--bowman-danger-bg` and `--bowman-danger-bg-hover`, declared in `src/theme/tokens.ts` and `src/styles.css`, raising the total from 44 to 46 custom properties. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#19e2c206-305b-4c22-9226-f902fafe36b9))
- Migrating existing apps to the new components. Each consuming app moves on its own schedule. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#8e046583-3503-4357-812f-e64871b23493))

## KPIs

- A disabled danger button does not call `onClick`. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- TextField links its hint and error text to the input via `aria-describedby` and marks the input `aria-invalid` on an error. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- SearchField calls `onSubmit` when the user presses Enter. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- Dialog moves focus inside on open, keeps it there, closes on Escape, and returns focus to the element that opened it. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- ConfirmDialog keeps its Confirm button disabled while confirmation is not yet given; when in the busy state, neither button reports a click, Escape does nothing, and the dialog cannot be dismissed, preventing a repeated submission while an action is in progress. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- Notice is announced politely for info and success tones and as an alert for warning and error tones. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- KeyValueList renders as a description list. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- A selectable Card is rendered as a single button, and a static Card has no interactive role. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- The axe accessibility checker is added as a development-only dependency of the chat demo's browser tests and runs against each new component's harness demo in every applicable state: default, disabled, error, busy, open, and closed; it runs in a real browser so that it can measure contrast. The library's unit tests keep checking roles, names, and attributes as they do today. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))
- Keyboard use is verified by hand. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))
- Contrast is verified for text and focus indicators, including the new danger button background. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))
- Passing the automated axe checks and the hand-verified keyboard review is the acceptance bar; there is no separate reviewer gate. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))

- ConfirmDialog does not expose the Dialog's default Close button; because it requires a specific user decision, the only dismissal path is the Cancel button (or the action settling when busy). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-15))

- Notice shows a dismiss button only when a dismiss callback is provided, and clicking the dismiss button calls that callback. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))

## Constraints

- All new components follow Bowman UI's existing design and code conventions. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#86615455-cdda-470f-98fc-a002981cce98), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-10))
- This release only adds to the published API surface; no existing exports are changed or removed, making it a minor release with no breaking changes; two recorded design decisions are amended in the same release and `docs/design-notes.md` MUST be updated for both: (1) the danger variant added to `Button` and `IconButton`, amending the shared `ButtonVariant` variant list, and (2) `SearchField`'s new optional `onSubmit` callback and submit button, amending the recorded decision that `SearchField` ships no submit (without the callback it behaves exactly as before). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f7792ce3-ed4d-4b5d-9592-eb390c94ca6d))
- No new runtime dependencies may be introduced; the only new dependency is the axe accessibility checker, added as a development-only dependency to the chat demo (`examples/chat-demo`) for its browser tests — it is never added to `src/` or shipped to consumers. Dialog and ConfirmDialog MUST use the native `<dialog>` element and the existing `useFocusTrap` hook at `src/hooks/useFocusTrap.ts`, unchanged. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2c5f73ec-6cea-42f7-9333-b68ccb3da516))
- All new components MUST meet WCAG 2.2 AA as the minimum accessibility standard. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#e7b480e1-27d1-4581-b4ef-f0018a4dc666))
- The colour token set MUST be tracked exactly across the design record, the stylesheet, and an automated test; all three must agree on the same count in every release. This work adds nine new colour tokens — five for the danger button (`--bowman-danger-fill` and `--bowman-danger-fill-dark` for resting fill, `--bowman-danger-fill-hover` and `--bowman-danger-fill-hover-dark` for hover fill, and `--bowman-text-on-danger` for text on the fill, all declared in `src/theme/tokens.ts`) and four for Notice (`--bowman-info` and `--bowman-info-dark` for the info tone, `--bowman-warning` and `--bowman-warning-dark` for the warning tone) — raising the total from 44 to 53; the semantic-colour group grows from eight to seventeen (fifteen theme + twenty-one neutral + seventeen semantic = fifty-three); all update sites (`src/styles.css`, `CLAUDE.md` invariant 13, `docs/design-notes.md`, `specs/bowman-ui-theming-tokens/spec.md`, `.specify/spec.md`, `README.md`, `examples/chat-demo/README.md`, `examples/chat-demo/src/custom-theme.css`, `examples/chat-demo/src/docs/ThemingSection.tsx`, and `tests/theming-tokens-dist.test.ts`) MUST be updated to 53 in the same release and the count cannot drift between them. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-7))
- Every new export — each component, its Props type, its Labels type, and its default labels object — MUST be declared intentionally in `tests/fixtures/public-api.json`, updated in the same pull request via `node scripts/write-public-api.mjs`; `tests/public-api.test.ts` (line 40 for runtime count, line 46 for type count) asserts that the counts match the snapshot exactly. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-8))
- The `stringPropOnly` closed list in `docs/design-notes.md` currently contains exactly three entries — the icon `ariaLabel` prop, the `useFocusGroups` `announce` prop, and the `Toast` `message` prop — and none of the new components may carry user-visible strings as a direct string prop; any addition to this list MUST amend `docs/design-notes.md` in the same release; enforced by `tests/labelled-exports.test.tsx`, which asserts the three-way partition of all barrel exports. The design record's required-labels list grows from two to five components — adding `TextField` (`fieldLabel`), `Dialog` (`dialogTitle`), and `ConfirmDialog` (`dialogTitle` and `confirmAction`) — and MUST be amended in `docs/design-notes.md` in the same release. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-9))
- Source coverage MUST remain at 100% across lines, statements, functions, and branches over `src/**`, as enforced by `vitest.config.ts:26`; no new component ships with coverage gaps. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-10))

- Notice MUST use two new themeable tokens — `--bowman-info` and `--bowman-info-dark`, declared in `src/theme/tokens.ts`, with values taken from the existing blue palette where available — for its info tone, and two new themeable tokens — `--bowman-warning` and `--bowman-warning-dark`, with values taken from the existing amber palette where available — for its warning tone (the library has no existing yellow token); success reuses the existing `--bowman-success` tokens and error reuses the existing `--bowman-danger` tokens; each tone colours the icon and border and MUST meet the 3:1 non-text contrast minimum in both light and dark themes; Notice text uses the existing body text colours; a consuming app that overrides `--bowman-success` or `--bowman-danger` sees those overrides reflected in the matching Notice tones, while the info and warning tones are individually overridable through their own tokens. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-16))

## Ownership

- re:cinq builds, deploys and operates the library, which includes features in this plan. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#actions-ownership))

## Delivery

- All eight changes ship together in a single minor release. A minor release adds to the published API surface without removing or changing any existing exports, so every consuming app that upgrades receives the new components and nothing breaks; apps not ready to use the new components ignore them and continue working unchanged. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#delivery-p-1))
- Nothing ships half-done: a component is complete only when its unit tests, its accessibility checks, its harness demo page and its README section are all present and passing; there is no target date, and no accessibility reviewer is required to sign off — the automated axe checks and the hand-verified keyboard review described in the KPIs are the bar. No partial release to meet an external deadline is acceptable; nothing ships half-done, and the release ships when all eight components are complete. Any earlier reference to an accessibility reviewer gate is a draft-sequence artifact: the KPI, the settled answers, and this prose are consistent — no reviewer gate. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#delivery-p-2))
- The release is published through `.github/workflows/publish.yml`, the existing pipeline triggered by `release: types: [published]`, which runs `npm stage publish` with npm OIDC trusted publishing; `workflow_dispatch` re-runs a failed stage on an existing tag and fails on any other ref. No maintainer publishes by hand; the staged package must be approved by a maintainer with 2FA on npmjs.com before it becomes public. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#delivery-p-3))

- There is no fixed delivery date. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f1061085-158c-4241-8d7e-d55a6348913d))
