# Form, dialog and notice components

| Field  | Value |
| ------ | ----- |
| Issue  | -     |
| Status | Draft |

Bowman UI is built for chat interfaces. Apps that use it for anything else, such as admin pages, settings or a confirmation step before a destructive action, find no text field, no dialog, no inline notice and no danger button. Each app then builds its own. That costs time, the copies drift apart in look and behaviour, and accessibility is redone by hand in every one. This spec introduces general-purpose components to address exactly the gap between what Bowman offers today and what a team needs to build a typical settings, confirmation or admin screen without stepping outside the library. The decision record lives in docs/design-notes.md § Form, dialog and notice components.

## Overview

We want Bowman to offer these general-purpose components itself, so every future screen built on the library begins from a tested, accessible foundation rather than from scratch:

- a `danger` variant for `Button`, for destructive actions ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-3))
- `TextField`: a labelled input with hint and error text ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-4))
- an `onSubmit` callback for `SearchField`, for searches that run on Enter or a click instead of on every keystroke ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-5))
- Dialog: a modal that presents content requiring the user’s full attention before they can continue ([from plan](plan.md))
- ConfirmDialog: a ready-made implementation of the dialog for confirming before a destructive or irreversible action containing the following UI elements:
  - a title,
  - a description,
  - a Cancel button
  - a danger-styled Confirm button;

  the consumer can add extra inputs between the description and the buttons when a yes-or-no click alone is not enough ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#p_13644075-15d3-4dc1-b80f-7bb251ebacf7))

- `Notice`: an inline message in an info, success, warning or error tone ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-7))
- `KeyValueList`: label and value pairs ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-8))
- `Card`: a panel, optionally selectable as a whole ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-9))

- Bowman UI is built for chat interfaces; apps that build admin pages, settings screens or confirmation flows on top of Bowman today find no text field, no dialog, no inline notice and no danger button, and must build and maintain their own. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-1))
- Bowman offers these general-purpose components so every future screen built on the library begins from a tested, accessible foundation rather than from scratch. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-2))
- The teams most immediately affected are those that have already built admin pages or settings screens on top of Bowman and today own their own focus management, keyboard handling, colour choices and accessible markup; bringing these components into Bowman absorbs that responsibility once. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-14))
- The eight components cover exactly the gap between what Bowman offers today and what a team needs to build a typical settings, confirmation or admin screen without stepping outside the library. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-16))

## What ships

### Button — danger variant

The `danger` variant for Button is intended for destructive actions ([from plan](plan.md)).

### SearchField

SearchField receives an `onSubmit` callback for searches that run on Enter or a click instead of on every keystroke ([from plan](plan.md)).

### TextField

TextField is a general-purpose labelled input component that provides support for hint text and error text to be announced when the field is in an invalid state ([from plan](plan.md)).

### Dialog

Dialog is a modal component that presents content requiring the user’s full attention before they can continue ([from plan](plan.md)).

### ConfirmDialog

ConfirmDialog is a ready-made Dialog for confirming before a destructive or irreversible action; it always presents a title, a description, a Cancel button and a Confirm button, and it defines a busy prop ([from plan](plan.md)).
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
- TextField's `labels` carries: an accessible name for the field (the `accessibleName` key, always required), optional hint text displayed beneath the field, and optional error text announced when the field is in an invalid state. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-12))
- SearchField's `labels` carries: the existing input-name and placeholder labels it already ships, plus an accessible name for the submit button (the `searchSubmit` key, default `"Search"`) added by this work. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-13))
- Dialog's `labels` carries: an accessible name for the close button (the `closeDialog` key, default `"Close"`). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-14))
- ConfirmDialog's `labels` carries: accessible names for the Cancel button (the `cancelAction` key, default `"Cancel"`) and the Confirm button (the `confirmAction` key, default `"Confirm"`); the title text and the body description are consumer content, not labels. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-15))
- Notice's `labels` carries: an accessible name for the dismiss button (the `dismissNotice` key, default `"Dismiss"`), when one is present. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-16))
- The danger button, KeyValueList, and Card carry no new label keys: the danger button uses the same consumer-visible text as every other button variant; KeyValueList renders consumer-provided term and value pairs; Card's selectable form takes its accessible name from its visible content. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-17))
- No two components share a label key name with different meanings. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-18))

## Conventions all new components follow

- Custom labels defined in the component prop are merged against their defaults by the library. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Text arrives display-ready. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Focusable elements forward their refs. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Motion respects the user's reduced-motion preference. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Styling uses only the existing colour tokens plus the approved danger colour. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Each component has a README section and a harness demo of each of its states. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))

## The published surface

- Each new component is exported from the package entry point with its Props type. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- TextField, Dialog, ConfirmDialog, and Notice are also exported with their Labels types. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- Dialog, ConfirmDialog, and Notice each ship English default labels; TextField ships no defaults object because every one of its labels is specific to the field. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))
- A diff of the published type declarations between the current release and this release shows only added exports and props. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f740be61-150f-4d33-823e-3edb467ed290))
- SearchField without an `onSubmit` handler behaves exactly as before. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f740be61-150f-4d33-823e-3edb467ed290))
- No existing consumer needs to change anything to pick up the new version. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f740be61-150f-4d33-823e-3edb467ed290))

- Each exported Labels type carries exactly the keys described in the Label keys section and no others. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2cd3f1fe-2a14-4966-a8a8-d06a48483eeb))

## Recorded decisions

1. **ConfirmDialog extra fields.** The "optional extra fields" are a consumer-rendered content slot. The consumer provides the markup and manages its own field values. The dialog does not check what's typed; the app does that itself and uses the `confirmDisabled` or `busy` prop to keep the Confirm button disabled ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-confirmdialog-extra-fields)).

2. **Danger button visual form.** The danger button takes a filled form: solid red background, white text, matching the visual weight of the primary button. Because existing danger colour tokens cover text and soft surfaces only, two new tokens are required — `--bowman-danger-bg` (resting background) and `--bowman-danger-bg-hover` (hover state), declared in `src/theme/tokens.ts`; the token count rises from 44 to 46, and all update sites must agree on the new total in the same release. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-15), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-danger-button-form))
3. **Notice tone colours.** Notice uses existing colour resources for all four tones: info uses the `--bowman-accent` token family (the same blue used for focus rings and the primary button); success reuses `--bowman-success` tokens; error reuses `--bowman-danger` tokens; warning uses existing palette yellow values directly with no new themeable token, so the token count does not change for this tone. Consuming apps that override `--bowman-accent` or `--bowman-danger` will see those overrides reflected in the corresponding Notice tones; the warning and info tones are not individually overridable. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-16), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-notice-tones-tokens))

## Scope

**In scope** ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#sec_1ff9b9f5-21ee-43bf-93cd-4ca07cd42d06))

- The eight deliverables ship in the `bowman-ui` repo: the danger variant of `src/components/Button.tsx`, the `onSubmit` callback added to `src/components/SearchField.tsx`, and the six new files `src/components/TextField.tsx`, `src/components/Dialog.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/Notice.tsx`, `src/components/KeyValueList.tsx`, and `src/components/Card.tsx`. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#8b34e548-4f4f-42e2-85a1-bdaaba16dfc2))
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
- ConfirmDialog keeps its Confirm button disabled while confirmation is not yet given; when in the busy state, the Confirm button is non-interactive and the dialog cannot be dismissed, preventing a repeated submission while an action is in progress. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- Notice is announced politely for info and success tones and as an alert for warning and error tones. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- KeyValueList renders as a description list. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- A selectable Card is rendered as a single button, and a static Card has no interactive role. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#d5f4945d-650a-4ef3-b882-a213dec48d03))
- Automated accessibility checks use axe and run on each applicable state: default, disabled, error, busy, open, and closed. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))
- Keyboard use is verified by hand. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))
- Contrast is verified for text and focus indicators, including the new danger button background. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))
- Passing the automated axe checks and the hand-verified keyboard review is the acceptance bar; there is no separate reviewer gate. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#edb81712-c000-4539-9a59-8d12b682b1e6))

- ConfirmDialog does not expose the Dialog's default Close button; because it requires a specific user decision, the only dismissal path is the Cancel button (or the action settling when busy). ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#kpis-p-15))

## Constraints

- All new components follow Bowman UI's existing design and code conventions. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#86615455-cdda-470f-98fc-a002981cce98), [from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#intent-p-10))
- This release only adds to the published API surface; no existing exports are changed or removed, making it a minor release with no breaking changes. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f7792ce3-ed4d-4b5d-9592-eb390c94ca6d))
- No new runtime dependencies may be introduced. Dialog and ConfirmDialog MUST use the native `<dialog>` element and the existing `useFocusTrap` hook at `src/hooks/useFocusTrap.ts`, unchanged. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#2c5f73ec-6cea-42f7-9333-b68ccb3da516))
- All new components MUST meet WCAG 2.2 AA as the minimum accessibility standard. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#e7b480e1-27d1-4581-b4ef-f0018a4dc666))
- The colour token set MUST be tracked exactly across the design record, the stylesheet, and an automated test; all three must agree on the same count in every release. The danger button variant adds two new tokens — `--bowman-danger-bg` (resting background) and `--bowman-danger-bg-hover` (hover state), declared in `src/theme/tokens.ts` — raising the total from 44 to 46; all update sites (`src/styles.css`, `CLAUDE.md` invariant 13, `docs/design-notes.md`, `specs/bowman-ui-theming-tokens/spec.md`, `.specify/spec.md`, `README.md`, `examples/chat-demo/README.md`, `examples/chat-demo/src/custom-theme.css`, `examples/chat-demo/src/docs/ThemingSection.tsx`, and `tests/theming-tokens-dist.test.ts`) MUST be updated to 46 in the same release and the count cannot drift between them. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-7))
- Every new export — each component, its Props type, its Labels type, and its default labels object — MUST be declared intentionally in `tests/fixtures/public-api.json`, updated in the same pull request via `node scripts/write-public-api.mjs`; `tests/public-api.test.ts` (line 40 for runtime count, line 46 for type count) asserts that the counts match the snapshot exactly. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-8))
- The `stringPropOnly` closed list in `docs/design-notes.md` currently contains exactly three entries — the icon `ariaLabel` prop, the `useFocusGroups` `announce` prop, and the `Toast` `message` prop — and none of the new components may carry user-visible strings as a direct string prop; any addition to this list MUST amend `docs/design-notes.md` in the same release; enforced by `tests/labelled-exports.test.tsx`, which asserts the three-way partition of all barrel exports. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-9))
- Source coverage MUST remain at 100% across lines, statements, functions, and branches over `src/**`, as enforced by `vitest.config.ts:26`; no new component ships with coverage gaps. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-10))

- Notice MUST use blue (the `--bowman-accent` token family) for its info tone and existing palette yellow directly for its warning tone, reusing existing palette values with no new colour token added for either tone; success reuses `--bowman-success` tokens and error reuses `--bowman-danger` tokens. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#constraints-p-16))

## Ownership

- re:cinq builds, deploys and operates the library, which includes features in this plan. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#actions-ownership))

## Delivery

- All eight changes ship together in a single minor release. A minor release adds to the published API surface without removing or changing any existing exports, so every consuming app that upgrades receives the new components and nothing breaks; apps not ready to use the new components ignore them and continue working unchanged. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#delivery-p-1))
- Nothing ships half-done: a component is complete only when its unit tests, its accessibility checks, its harness demo page and its README section are all present and passing; there is no target date, and no accessibility reviewer is required to sign off — the automated axe checks and the hand-verified keyboard review described in the KPIs are the bar. No partial release to meet an external deadline is acceptable; nothing ships half-done, and the release ships when all eight components are complete. Any earlier reference to an accessibility reviewer gate is a draft-sequence artifact: the KPI, the settled answers, and this prose are consistent — no reviewer gate. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#delivery-p-2))
- The release is published through `.github/workflows/publish.yml`, the existing pipeline triggered by `release: types: [published]`, which runs `npm stage publish` with npm OIDC trusted publishing; `workflow_dispatch` re-runs a failed stage on an existing tag and fails on any other ref. No maintainer publishes by hand; the staged package must be approved by a maintainer with 2FA on npmjs.com before it becomes public. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#delivery-p-3))

- There is no fixed delivery date. ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#f1061085-158c-4241-8d7e-d55a6348913d))

## Open Questions

- Is there a target date for this release, and who is the accessibility reviewer who must sign off before it publishes? ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-deadline-and-reviewer))
- The reasoning recorded alongside the deadline-and-reviewer question states that the success criteria named an accessibility reviewer gate, but the success criteria have never contained such a gate. Is a reviewer happy to treat this as a known draft-sequence artifact, with the understanding that the KPI, the answer, and the delivery prose are all consistent (no reviewer gate, no fixed date)? ([from plan](https://lore.gcp.re-cinq.com/repos/re-cinq/bowman-ui/plans/6f01ddd8-b3bd-443f-8b93-82e29712ed6c#q-stale-reviewer-gate-premise))
