import { useRef, useState } from "react";
import { Button, ConfirmDialog } from "@re-cinq/bowman-ui";

export function ConfirmDialogExample() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  // The delete button leaves with the draft, so focus returns to a heading that stays.
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <div className="flex flex-col items-start gap-3">
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="text-sm font-medium text-slate-900 dark:text-slate-100"
      >
        {deleted ? "No saved draft" : "One saved draft"}
      </h3>
      {!deleted && (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete the draft
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setDeleted(true);
          setOpen(false);
        }}
        returnFocusRef={headingRef}
        labels={{ dialogTitle: "Delete the draft?", confirmAction: "Delete the draft" }}
        description={<p>The draft reply to MB-4821-XQ is removed and cannot be restored.</p>}
      />
    </div>
  );
}
