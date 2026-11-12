import type { ReactElement, ReactNode } from "react";
import { TEXT_MUTED, TEXT_STRONG } from "../theme/tokens.js";

export interface KeyValuePair {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

export interface KeyValueListProps {
  pairs: readonly KeyValuePair[];
  /** Default "inline": label and value side by side; "stacked": value under label. */
  layout?: "inline" | "stacked";
}

const layoutClassNames = Object.freeze({
  inline: { row: "flex gap-4 py-1.5", term: "w-1/3 shrink-0", detail: "min-w-0 flex-1" },
  stacked: { row: "py-1.5", term: "", detail: "mt-0.5" },
});

export function KeyValueList({ pairs, layout = "inline" }: KeyValueListProps): ReactElement | null {
  if (pairs.length === 0) {
    return null;
  }
  const classNames = layoutClassNames[layout];

  return (
    <dl className="text-sm">
      {pairs.map((pair) => (
        <div key={pair.key} className={classNames.row}>
          <dt className={`${classNames.term} ${TEXT_MUTED}`.trim()}>{pair.label}</dt>
          <dd className={`${classNames.detail} ${TEXT_STRONG}`}>{pair.value}</dd>
        </div>
      ))}
    </dl>
  );
}
