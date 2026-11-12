import { useState } from "react";
import { Card } from "@re-cinq/bowman-ui";

const options = [
  { id: "standard", name: "Standard delivery", detail: "Three to five working days, free" },
  { id: "express", name: "Express delivery", detail: "Next working day, 6.50" },
];

export function CardExample() {
  const [chosen, setChosen] = useState("standard");
  const chosenName = options.find((option) => option.id === chosen)?.name;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <Card key={option.id} heading={option.name} onSelect={() => setChosen(option.id)}>
            {option.detail}
          </Card>
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Chosen: {chosenName}</p>
    </div>
  );
}
