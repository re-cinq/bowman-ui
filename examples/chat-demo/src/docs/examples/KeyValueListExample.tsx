import { KeyValueList } from "@re-cinq/bowman-ui";
import type { KeyValuePair } from "@re-cinq/bowman-ui";

const account: readonly KeyValuePair[] = [
  { key: "name", label: "Name", value: "Mara Winter" },
  { key: "email", label: "Email", value: "mara@example.invalid" },
  { key: "since", label: "Customer since", value: "March 2021" },
];

export function KeyValueListExample() {
  return <KeyValueList pairs={account} />;
}
