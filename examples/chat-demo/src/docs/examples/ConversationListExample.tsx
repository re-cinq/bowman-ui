import { useState } from "react";
import { ConversationList } from "@re-cinq/bowman-ui";
import type { ConversationListItem } from "@re-cinq/bowman-ui";

const initialItems: ReadonlyArray<ConversationListItem> = [
  {
    id: "1",
    title: "Delivery change for MB-4821-XQ",
    timestamp: "today 09:14",
  },
  {
    id: "2",
    title: "Damaged copy of The Cartographer's Atlas",
    timestamp: "yesterday 16:02",
    badge: "2",
  },
  {
    id: "3",
    title: "New conversation",
    timestamp: "today 10:31",
    isPlaceholderTitle: true,
  },
];

export function ConversationListExample() {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState("1");

  return (
    <ConversationList
      items={items}
      activeId={activeId}
      onSelect={setActiveId}
      onDelete={(id) =>
        setItems((current) => current.filter((item) => item.id !== id))
      }
    />
  );
}
