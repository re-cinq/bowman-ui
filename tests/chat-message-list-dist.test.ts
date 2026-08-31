import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BUILT_FILE = "dist/components/ChatMessageList.js";

// CONTRACT.md decision 1 requires "use client" as the first *statement*, so
// leading comments and blank lines are allowed above it (018's positional
// check, same as tests/build-contract.test.ts).
const stripLeadingTrivia = (source: string): string => {
  let rest = source;
  for (;;) {
    const trimmed = rest.replace(/^\s+/, "");
    if (trimmed.startsWith("//")) {
      const lineEnd = trimmed.indexOf("\n");
      if (lineEnd === -1) return "";
      rest = trimmed.slice(lineEnd + 1);
      continue;
    }
    if (trimmed.startsWith("/*")) {
      const blockEnd = trimmed.indexOf("*/");
      if (blockEnd === -1) return "";
      rest = trimmed.slice(blockEnd + 2);
      continue;
    }
    return trimmed;
  }
};

// tsc's declaration emit re-exports names from the barrel and never inlines a
// body, so an interface's members live in the emitting component's .d.ts. The
// member list is read from there; dist/index.d.ts is asserted separately to
// export the name.
const declaredMembers = (source: string, interfaceName: string): string[] => {
  const opening = source.indexOf(`interface ${interfaceName} {`);
  if (opening === -1) {
    throw new Error(`${interfaceName} is not declared in the built declarations`);
  }
  const body = source.slice(opening, source.indexOf("\n}", opening));
  return [...body.matchAll(/^ {4}(\w+)\??:/gm)].map(([, name]) => name);
};

describe("ChatAttribution's built shape", () => {
  const listDeclarations = readFileSync("dist/components/ChatMessageList.d.ts", "utf8");
  const indexDeclarations = readFileSync("dist/index.d.ts", "utf8");

  it("dist/index.d.ts exports ChatAttribution as a type", () => {
    const typeExports = [...indexDeclarations.matchAll(/export type \{([^}]*)\}/g)]
      .flatMap((match) => match[1].split(","))
      .map((name) => name.trim())
      .filter(Boolean);

    expect(typeExports).toContain("ChatAttribution");
  });

  it("ChatAttribution declares exactly name and avatar", () => {
    expect(declaredMembers(listDeclarations, "ChatAttribution")).toEqual(["name", "avatar"]);
  });

  it("ChatMessageListProps gains attribution and nothing else", () => {
    expect(declaredMembers(listDeclarations, "ChatMessageListProps")).toEqual([
      "entries",
      "userInitials",
      "labels",
      "attribution",
      "assistantAvatar",
      "busy",
      "greeting",
      "prompts",
      "renderEntryFooter",
      "showFeedback",
      "arrowKeyFeedback",
      "markdown",
      "reducedMotion",
      "describeTool",
      "showToolName",
      "showToolInput",
      "toolIcon",
      "showThinking",
      "onCopy",
      "onFeedback",
    ]);
  });

  // renderEntry is bounded: 133's renderEntryFooter is a footer slot, not the
  // per-entry render prop this rejects in favour of the lookup table.
  it("dist/index.d.ts declares no describeAssistant, renderAttribution or renderEntry", () => {
    expect(indexDeclarations).not.toMatch(/describeAssistant|renderAttribution|renderEntry\b/);
    expect(listDeclarations).not.toMatch(/describeAssistant|renderAttribution|renderEntry\b/);
  });
});

describe("the built chat message list", () => {
  it('dist/components/ChatMessageList.js opens with "use client"; as its first statement', () => {
    expect(existsSync(BUILT_FILE)).toBe(true);
    const firstStatement = stripLeadingTrivia(readFileSync(BUILT_FILE, "utf8"));
    expect(firstStatement.startsWith('"use client";')).toBe(true);
  });

  it("npm pack --dry-run ships the component with its d.ts file", () => {
    const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const [pack] = JSON.parse(output) as [{ files: { path: string }[] }];
    const paths = pack.files.map((file) => file.path);
    expect(paths).toContain(BUILT_FILE);
    expect(paths).toContain(BUILT_FILE.replace(/\.js$/, ".d.ts"));
  });

  it("tsc accepts chat-message-list-type-assertions.tsx against dist via the '.' exports entry, pinning both @ts-expect-error fixtures", () => {
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
        "--jsx",
        "react-jsx",
        "tests/types/chat-message-list-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});
