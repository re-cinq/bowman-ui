import { ChatCard } from "@re-cinq/bowman-ui";
import type { CardChatEntry } from "@re-cinq/bowman-ui";

const order: CardChatEntry = {
  id: "card-1",
  role: "card",
  kind: "order_card",
  data: { orderNumber: "BK-2041", status: "Shipped", arrives: "Friday by 12:00" },
};

// The consumer reads its own data; returning null for a kind it does not draw shows the fallback label.
export function describeOrder(entry: CardChatEntry) {
  if (entry.kind !== "order_card") {
    return null;
  }

  const { orderNumber, status, arrives } = entry.data;

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium">Order {String(orderNumber)}</span>
      <span>
        {String(status)}, arrives {String(arrives)}
      </span>
    </div>
  );
}

export function ChatCardExample() {
  return <ChatCard entry={order} describeCard={describeOrder} labels={{ card: "Order status" }} />;
}
