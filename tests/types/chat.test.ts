import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  AssistantChatEntry,
  ChatEntry,
  ThinkingChatEntry,
  ToolChatEntry,
  UserChatEntry,
} from "../../src/types/chat.js";

const chatDtsPath = resolve(process.cwd(), "dist/types/chat.d.ts");
const chatJsPath = resolve(process.cwd(), "dist/types/chat.js");
const indexDtsPath = resolve(process.cwd(), "dist/index.d.ts");
const fixturePath = resolve(process.cwd(), "tests/fixtures/hal-session-entries.json");
const halExportsPath = resolve(process.cwd(), "tests/fixtures/hal-engine-exports.txt");

const readChatDts = (): string => {
  if (!existsSync(chatDtsPath)) {
    throw new Error("dist/types/chat.d.ts is missing - run npm run build first");
  }

  return readFileSync(chatDtsPath, "utf8");
};

const chatExports = [
  "ChatEntry",
  "ChatEntryRole",
  "UserChatEntry",
  "AssistantChatEntry",
  "ThinkingChatEntry",
  "ToolChatEntry",
  "ChatStreamState",
  "ChatErrorInfo",
];

interface FixtureFile {
  _meta: { source: string; commit: string };
  entries: {
    user: { role: "user"; content: string; timestamp: string };
    assistant: { role: "assistant"; content: string; timestamp: string; isStreaming: boolean };
    thinking: { role: "thinking"; content: string; isStreaming: boolean };
    tool: { role: "tool"; toolName: string; toolInput: Record<string, unknown> };
  };
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as FixtureFile;

// Test-local adapter stand-in. Deliberately NOT exported from the package:
// the real protocol adapter belongs to the consuming app. It supplies the
// opaque id and drops timestamp - nothing else.
type FixtureEntry = FixtureFile["entries"][keyof FixtureFile["entries"]];

const toChatEntry = (entry: FixtureEntry, id: string): ChatEntry => {
  if (entry.role === "user") {
    return { id, role: "user", content: entry.content };
  }

  if (entry.role === "assistant") {
    return { id, role: "assistant", content: entry.content, isStreaming: entry.isStreaming };
  }

  if (entry.role === "thinking") {
    return { id, role: "thinking", content: entry.content, isStreaming: entry.isStreaming };
  }

  return { id, role: "tool", toolName: entry.toolName, toolInput: entry.toolInput };
};

const droppedFields = (entry: FixtureEntry, mapped: ChatEntry): string[] =>
  Object.keys(entry).filter((key) => !(key in mapped));

describe("type-level assertions", () => {
  it("tsc accepts chat-type-assertions.ts, proving a fifth role and a streamless assistant entry fail to typecheck", () => {
    const result = spawnSync(
      "node",
      [
        "node_modules/typescript7/bin/tsc",
        "--ignoreConfig",
        "--noEmit",
        "--strict",
        "--target",
        "es2022",
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
        "--skipLibCheck",
        "tests/types/chat-type-assertions.ts",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});

describe("dist/types/chat.d.ts", () => {
  it("declares no property named index, devMetadata, correlationId, traceId, timings, reflection, scores, tenantId, organizationId or timestamp", () => {
    const chatDts = readChatDts();
    const bannedProperties = [
      "index",
      "devMetadata",
      "correlationId",
      "traceId",
      "timings",
      "reflection",
      "scores",
      "tenantId",
      "organizationId",
      "timestamp",
    ];

    for (const name of bannedProperties) {
      expect(chatDts).not.toMatch(new RegExp(`^\\s*(readonly\\s+)?${name}\\??\\s*:`, "m"));
    }
  });

  it("declares no index signature", () => {
    expect(readChatDts()).not.toMatch(/^\s*\[[A-Za-z_$][\w$]*\s*:\s*(string|number)\s*\]\s*:/m);
  });

  it("exports exactly the eight chat type names", () => {
    const exportedNames = [
      ...readChatDts().matchAll(/^export (?:interface|type) ([A-Za-z0-9_]+)/gm),
    ].map((match) => match[1]);

    expect([...exportedNames].sort()).toEqual([...chatExports].sort());
  });
});

describe("collision with @re-cinq/hal-engine exports", () => {
  const halExports = readFileSync(halExportsPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  it("hal-engine-exports.txt records the hal-engine type surface", () => {
    expect(halExports).toEqual(
      expect.arrayContaining([
        "Message",
        "SessionEntry",
        "UserEntry",
        "AssistantEntry",
        "ThinkingEntry",
        "ToolEntry",
        "OutgoingMessage",
        "IncomingMessage",
        "ErrorCodes",
      ])
    );
  });

  it("no name exported by src/types/chat.ts appears in hal-engine's exports", () => {
    expect(chatExports.filter((name) => halExports.includes(name))).toEqual([]);
  });
});

describe("representability of the protocol's §6.1-6.4 examples", () => {
  it("carries the four examples verbatim, with provenance in _meta", () => {
    expect(fixture._meta).toEqual({
      source: "hal-engine docs/websocket-protocol.md §6.1-6.4",
      commit: "0fb475caae1dc3c07948911faf4c16510e263f88",
    });
    expect(fixture.entries.user).toEqual({
      role: "user",
      content: "What is the weather in Berlin?",
      timestamp: "2026-01-15T14:30:00Z",
    });
    expect(fixture.entries.assistant).toEqual({
      role: "assistant",
      content: "Berlin currently has a temperature of 18 degrees Celsius.",
      timestamp: "2026-01-15T14:30:01Z",
      isStreaming: false,
    });
    expect(fixture.entries.thinking).toEqual({
      role: "thinking",
      content: "I should look up the weather for Berlin using the get_weather tool.",
      isStreaming: false,
    });
    expect(fixture.entries.tool).toEqual({
      role: "tool",
      toolName: "get_weather",
      toolInput: { location: "Berlin", units: "celsius" },
    });
  });

  it("maps the user example to a UserChatEntry, dropping only timestamp", () => {
    const mapped = toChatEntry(fixture.entries.user, "entry-0") as UserChatEntry;

    expect(mapped).toEqual({
      id: "entry-0",
      role: "user",
      content: "What is the weather in Berlin?",
    });
    expect(droppedFields(fixture.entries.user, mapped)).toEqual(["timestamp"]);
  });

  it("maps the assistant example to an AssistantChatEntry, dropping only timestamp", () => {
    const mapped = toChatEntry(fixture.entries.assistant, "entry-1") as AssistantChatEntry;

    expect(mapped).toEqual({
      id: "entry-1",
      role: "assistant",
      content: "Berlin currently has a temperature of 18 degrees Celsius.",
      isStreaming: false,
    });
    expect(droppedFields(fixture.entries.assistant, mapped)).toEqual(["timestamp"]);
  });

  it("maps the thinking example to a ThinkingChatEntry with every field surviving", () => {
    const mapped = toChatEntry(fixture.entries.thinking, "entry-2") as ThinkingChatEntry;

    expect(mapped).toEqual({
      id: "entry-2",
      role: "thinking",
      content: "I should look up the weather for Berlin using the get_weather tool.",
      isStreaming: false,
    });
    expect(droppedFields(fixture.entries.thinking, mapped)).toEqual([]);
  });

  it("maps the tool example to a ToolChatEntry with every field surviving and no content", () => {
    const mapped = toChatEntry(fixture.entries.tool, "entry-3") as ToolChatEntry;

    expect(mapped).toEqual({
      id: "entry-3",
      role: "tool",
      toolName: "get_weather",
      toolInput: { location: "Berlin", units: "celsius" },
    });
    expect(droppedFields(fixture.entries.tool, mapped)).toEqual([]);
    expect("content" in mapped).toBe(false);
  });

  it("keeps the mapping function out of the published surface - dist/index.d.ts has no such symbol", () => {
    expect(readFileSync(indexDtsPath, "utf8")).not.toContain("toChatEntry");
  });
});

describe("dist/types/chat.js", () => {
  it("is absent or contains no statement other than export {}", () => {
    if (!existsSync(chatJsPath)) {
      return;
    }
    expect(readFileSync(chatJsPath, "utf8").trim()).toBe("export {};");
  });
});
