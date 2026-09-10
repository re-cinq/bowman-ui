"use client";

import type { ReactElement } from "react";
import { resolveLabels } from "../labels.js";
import { FOCUS_RING_COLOR } from "../theme/tokens.js";

export interface PromptChipsLabels {
  /** The chip group's accessible name. */
  suggestedPrompts: string;
}

export const defaultPromptChipsLabels: Readonly<Required<PromptChipsLabels>> = Object.freeze({
  suggestedPrompts: "Suggested prompts",
});

export interface PromptChipsProps {
  prompts: ReadonlyArray<string>;
  /** Receives the picked prompt's text; pairs with ChatComposerHandle.setValue. */
  onPick: (text: string) => void;
  labels?: Partial<PromptChipsLabels>;
}

const chipClassName = `cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ring-offset-2 focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} focus:ring-offset-white dark:ring-offset-slate-900`;

export function PromptChips({ prompts, onPick, labels }: PromptChipsProps): ReactElement | null {
  const resolved = resolveLabels(defaultPromptChipsLabels, labels);

  if (prompts.length === 0) {
    return null;
  }

  return (
    // Explicit role="list": Safari drops a list-style: none ul's list semantics and its accessible name with them.
    <ul
      role="list"
      aria-label={resolved.suggestedPrompts}
      className="flex flex-wrap justify-center gap-2"
    >
      {prompts.map((prompt, index) => (
        <li key={`${index}-${prompt}`}>
          <button type="button" onClick={() => onPick(prompt)} className={chipClassName}>
            {prompt}
          </button>
        </li>
      ))}
    </ul>
  );
}
