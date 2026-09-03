// Compiled by tests/ToolActivity.test.tsx with tsc --noEmit against the BUILT
// package: the self-referencing "@re-cinq/bowman-ui" import resolves through
// package.json's "." exports entry to dist/index.d.ts. Pins describeTool's
// second parameter as additive - a one-parameter callback written before the
// widening stays assignable, so this file suppresses no compile error.
import type { ComponentProps, ReactNode } from "react";
import { ToolActivity, type ToolChatEntry } from "@re-cinq/bowman-ui";

const weatherEntry: ToolChatEntry = {
  id: "t1",
  role: "tool",
  toolName: "get_weather",
  toolInput: { location: "Berlin" },
};

const describeWithEntry = (entry: ToolChatEntry) => entry.toolName;
const oneParameter: ComponentProps<typeof ToolActivity>["describeTool"] = describeWithEntry;

void oneParameter;

const describeWithPending = (entry: ToolChatEntry, pending: boolean): ReactNode =>
  pending ? `Consultando ${entry.toolName}` : `Consultado ${entry.toolName}`;
const bothParameters: ComponentProps<typeof ToolActivity>["describeTool"] = describeWithPending;

void bothParameters;

const Consumer = () => (
  <>
    <ToolActivity entry={weatherEntry} describeTool={describeWithEntry} />
    <ToolActivity entry={weatherEntry} describeTool={describeWithPending} pending />
  </>
);

void Consumer;
