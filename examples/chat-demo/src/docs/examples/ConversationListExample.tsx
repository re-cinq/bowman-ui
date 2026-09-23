import { useState } from "react";
import { ConversationList } from "@re-cinq/bowman-ui";
import type { ConversationListItem } from "@re-cinq/bowman-ui";

const placeholderId = "3";
const settledTitle = "Gift wrapping for a first edition";

const initialItems: ReadonlyArray<ConversationListItem> = [
  { id: "1", title: "Delivery change for MB-4821-XQ", timestamp: "today 09:14" },
  {
    id: "2",
    title: "Damaged copy of The Cartographer's Atlas",
    timestamp: "yesterday 16:02",
    badge: "2",
  },
  {
    id: placeholderId,
    title: "New conversation",
    timestamp: "today 10:31",
    isPlaceholderTitle: true,
  },
];

// The typewriter runs only when a title replaces a known placeholder: this is
// what a producer does once it has generated the real title.
const settle = (item: ConversationListItem): ConversationListItem =>
  item.id === placeholderId ? { ...item, title: settledTitle, isPlaceholderTitle: false } : item;

export function ConversationListExample() {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState("1");

  return (
    <div className="flex flex-col gap-3">
      <ConversationList
        items={items}
        activeId={activeId}
        onSelect={setActiveId}
        onDelete={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      />
      <button
        type="button"
        className="self-start rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        onClick={() => setItems((current) => current.map(settle))}
      >
        Give the new conversation its title
      </button>
    </div>
  );
}
