# Form, dialog and notice components

| Field  | Value |
| ------ | ----- |
| Issue  | -     |
| Status | Draft |

Bowman UI is built for chat interfaces. Apps that use it for anything else, such as admin pages, settings or a confirmation step before a destructive action, find no text field, no dialog, no inline notice and no danger button. Each app then builds its own. That costs time, the copies drift apart in look and behaviour, and accessibility is redone by hand in every one. This spec introduces general-purpose components to address exactly the gap between what Bowman offers today and what a team needs to build a typical settings, confirmation or admin screen without stepping outside the library. The decision record lives in docs/design-notes.md § Form, dialog and notice components.

## Overview

We want Bowman to offer these general-purpose components itself, so every future screen built on the library begins from a tested, accessible foundation rather than from scratch:

- `TextField`: a labelled input with hint and error text ([from plan](plan.md))
- Dialog: a modal that presents content requiring the user’s full attention before they can continue ([from plan](plan.md))
- ConfirmDialog: a ready-made dialog for confirming before a destructive or irreversible action ([from plan](plan.md))
- `Notice`: an inline message in an info, success, warning or error tone ([from plan](plan.md))
- `KeyValueList`: label and value pairs ([from plan](plan.md))
- `Card`: a panel, optionally selectable as a whole ([from plan](plan.md))

## What ships

### TextField

### Dialog

### ConfirmDialog

ConfirmDialog is a specialised form of Dialog for one job: asking the user to confirm before an action they cannot undo. Every instance presents a title, a brief description of what will happen, a Cancel button and a Confirm button styled as a danger action ([from plan](plan.md)).
When a yes-or-no click is not enough, the consumer places extra inputs inside the dialog, between the description and the buttons ([from plan](plan.md)). The consumer manages these inputs and keeps the Confirm button disabled until its own conditions are met ([from plan](plan.md)).
While a triggered action is in progress, the consumer signals this with a `busy` prop, which keeps the Confirm button non-interactive and prevents the dialog from being dismissed ([from plan](plan.md)).

### Notice

### KeyValueList

### Card

## Label keys

## Conventions all new components follow

## The published surface

## Recorded decisions

1. **ConfirmDialog extra fields.** The "optional extra fields" are a consumer-rendered content slot. The consumer provides the markup and manages its own field values. The dialog does not check what's typed; the app does that itself and uses the `busy` or `disabled` prop to keep the Confirm button disabled ([from plan](plan.md)).
