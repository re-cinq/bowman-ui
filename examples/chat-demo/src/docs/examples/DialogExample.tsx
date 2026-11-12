import { useState } from "react";
import { Button, Dialog, KeyValueList } from "@re-cinq/bowman-ui";

const orderDetails = [
  { key: "order", label: "Order", value: "MB-4821-XQ" },
  { key: "title", label: "Title", value: "The Cartographer's Atlas" },
  { key: "arrives", label: "Arrives", value: "Friday by 12:00" },
];

export function DialogExample() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Show the order
      </Button>
      <Dialog
        open={open}
        onClose={close}
        labels={{ dialogTitle: "Order MB-4821-XQ" }}
        footer={
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        }
      >
        <KeyValueList pairs={orderDetails} />
      </Dialog>
    </>
  );
}
