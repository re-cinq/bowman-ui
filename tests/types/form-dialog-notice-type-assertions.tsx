// Compiled by tests/form-dialog-notice-dist.test.ts with tsc --noEmit against
// the BUILT package. Pins specs/bowman-ui-form-dialog-notice/spec.md: the
// required labels of TextField, Dialog and ConfirmDialog, no new component
// taking className, submitSearch required in SearchFieldLabels, and the
// danger variant compiling on Button and IconButton.
import { useRef } from "react";
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  IconButton,
  KeyValueList,
  Notice,
  PlusIcon,
  TextField,
  type KeyValuePair,
  type NoticeTone,
  type SearchFieldLabels,
  type TextFieldType,
} from "@re-cinq/bowman-ui";

// @ts-expect-error -- a SearchFieldLabels catalogue without submitSearch is a compile error
const catalogue: SearchFieldLabels = { searchInput: "Søg", searchPlaceholder: "Søg..." };

const tone: NoticeTone = "warning";
const fieldType: TextFieldType = "email";
const pairs: readonly KeyValuePair[] = [{ key: "a", label: "Nummer", value: "4711" }];

const Consumer = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const noop = () => {};

  return (
    <>
      <Button variant="danger">{catalogue.searchInput}</Button>
      <IconButton variant="danger" icon={PlusIcon} labels={{ accessibleName: "Slet" }} />
      <TextField
        ref={inputRef}
        value=""
        onChange={noop}
        type={fieldType}
        labels={{ fieldLabel: "Navn" }}
      />
      {/* @ts-expect-error -- omitting labels is a compile error: fieldLabel has no default */}
      <TextField value="" onChange={noop} />
      {/* @ts-expect-error -- labels without fieldLabel is a compile error */}
      <TextField value="" onChange={noop} labels={{ fieldHint: "4711" }} />
      {/* @ts-expect-error -- TextField takes no className */}
      <TextField value="" onChange={noop} labels={{ fieldLabel: "Navn" }} className="mt-2" />
      <Dialog open onClose={noop} labels={{ dialogTitle: "Indstillinger" }}>
        4711
      </Dialog>
      {/* @ts-expect-error -- omitting labels is a compile error: dialogTitle has no default */}
      <Dialog open onClose={noop}>
        4711
      </Dialog>
      {/* @ts-expect-error -- labels without dialogTitle is a compile error */}
      <Dialog open onClose={noop} labels={{ closeDialog: "Luk" }}>
        4711
      </Dialog>
      {/* @ts-expect-error -- Dialog takes no className */}
      <Dialog open onClose={noop} labels={{ dialogTitle: "Indstillinger" }} className="mt-2">
        4711
      </Dialog>
      <ConfirmDialog
        open
        onConfirm={noop}
        onCancel={noop}
        labels={{ dialogTitle: "Slet", confirmAction: "Slet" }}
        description="4711"
      />
      {/* @ts-expect-error -- omitting labels is a compile error */}
      <ConfirmDialog open onConfirm={noop} onCancel={noop} description="4711" />
      <ConfirmDialog
        open
        onConfirm={noop}
        onCancel={noop}
        // @ts-expect-error -- labels without dialogTitle is a compile error
        labels={{ confirmAction: "Slet" }}
        description="4711"
      />
      <ConfirmDialog
        open
        onConfirm={noop}
        onCancel={noop}
        // @ts-expect-error -- labels without confirmAction is a compile error
        labels={{ dialogTitle: "Slet" }}
        description="4711"
      />
      <ConfirmDialog
        open
        onConfirm={noop}
        onCancel={noop}
        labels={{ dialogTitle: "Slet", confirmAction: "Slet" }}
        description="4711"
        // @ts-expect-error -- ConfirmDialog takes no className
        className="mt-2"
      />
      <Notice tone={tone}>4711</Notice>
      {/* @ts-expect-error -- Notice takes no className */}
      <Notice tone="info" className="mt-2">
        4711
      </Notice>
      <KeyValueList pairs={pairs} layout="stacked" />
      {/* @ts-expect-error -- KeyValueList takes no className */}
      <KeyValueList pairs={pairs} className="mt-2" />
      <Card ref={cardRef} onSelect={noop}>
        4711
      </Card>
      {/* @ts-expect-error -- Card takes no className */}
      <Card className="mt-2">4711</Card>
    </>
  );
};

void Consumer;
