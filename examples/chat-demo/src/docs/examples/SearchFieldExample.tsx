import { useState } from "react";
import { SearchField } from "@re-cinq/bowman-ui";

const titles: ReadonlyArray<string> = [
  "Delivery change for MB-4821-XQ",
  "Damaged copy of The Cartographer's Atlas",
  "Gift wrapping for a first edition",
];

export function SearchFieldExample() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matching = titles.filter((title) => title.toLowerCase().includes(needle));

  return (
    <div className="flex flex-col gap-3">
      <SearchField
        value={query}
        onChange={setQuery}
        labels={{ searchPlaceholder: "Search conversations..." }}
      />
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Matching {matching.length} of {titles.length} conversations
      </p>
    </div>
  );
}
