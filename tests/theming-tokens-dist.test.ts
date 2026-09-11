import { readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { bowmanTokenNamesIn, readFromRepoRoot as read } from "./helpers/theme-token-source.js";

// docs/design-notes.md § Theming: every --bowman-* token is read only through a
// var() fallback, so the built package resolves to today's palette byte for
// byte when a consumer sets nothing. The class strings live once in
// dist/theme/tokens.js; the stylesheet reads the two keyframe tokens directly.
const TOKENS_FILE = "dist/theme/tokens.js";
const STYLESHEET = "dist/styles.css";
const COMPONENTS_DIR = "dist/components";

const builtComponents = (): string[] =>
  readdirSync(resolve(process.cwd(), COMPONENTS_DIR))
    .filter((name) => name.endsWith(".js"))
    .sort()
    .map((name) => `${COMPONENTS_DIR}/${name}`);

const EXPECTED_FALLBACKS: Record<string, string> = {
  "--bowman-accent": "var(--color-blue-500)",
  "--bowman-accent-dark": "var(--color-blue-600)",
  "--bowman-accent-hover": "var(--color-blue-600)",
  "--bowman-accent-hover-dark": "var(--color-blue-500)",
  "--bowman-accent-soft": "var(--color-blue-50)",
  "--bowman-accent-soft-dark": "var(--color-blue-950)",
  "--bowman-accent-border": "var(--color-blue-200)",
  "--bowman-accent-border-dark": "var(--color-blue-800)",
  "--bowman-accent-glow": "rgba(59,130,246,0.1)",
  "--bowman-accent-glow-dark": "rgba(96,165,250,0.1)",
  "--bowman-focus-ring": "var(--color-blue-500)",
  "--bowman-focus-ring-dark": "var(--color-blue-400)",
  "--bowman-active": "var(--color-slate-100)",
  "--bowman-active-dark": "var(--color-slate-800)",
  "--bowman-pulse-outline": "rgba(59,130,246,0.5)",
  "--bowman-surface": "var(--color-white)",
  "--bowman-surface-dark": "var(--color-slate-900)",
  "--bowman-surface-hover": "var(--color-slate-50)",
  "--bowman-surface-hover-dark": "var(--color-slate-800)",
  "--bowman-control-hover": "var(--color-slate-100)",
  "--bowman-control-hover-dark": "var(--color-slate-800)",
  "--bowman-border": "var(--color-slate-200)",
  "--bowman-border-dark": "var(--color-slate-800)",
  "--bowman-ring-offset": "var(--color-white)",
  "--bowman-ring-offset-dark": "var(--color-slate-900)",
  "--bowman-text-body": "var(--color-slate-700)",
  "--bowman-text-body-dark": "var(--color-slate-200)",
  "--bowman-text-secondary": "var(--color-slate-600)",
  "--bowman-text-secondary-dark": "var(--color-slate-400)",
  "--bowman-text-muted": "var(--color-slate-500)",
  "--bowman-text-muted-dark": "var(--color-slate-400)",
  "--bowman-text-subtle": "var(--color-slate-400)",
  "--bowman-text-subtle-dark": "var(--color-slate-500)",
};

const NEUTRAL_ROLE_READERS: Record<string, string[]> = {
  SURFACE: ["AppShell", "AppSidebar", "ChatComposer", "PromptChips", "SearchField", "buttonStyles"],
  SURFACE_HOVER: ["AppSidebar", "ConversationList", "PromptChips", "buttonStyles"],
  CONTROL_HOVER: ["AppShell", "ChatMessage"],
  BORDER: [
    "AppShell",
    "AppSidebar",
    "ChatComposer",
    "ChatMessageList",
    "PromptChips",
    "SearchField",
    "buttonStyles",
  ],
  BORDER_MD: ["AppSidebar"],
  RING_OFFSET: ["AppShell", "AppSidebar", "ConversationList", "PromptChips", "buttonStyles"],
  TEXT_BODY: [
    "AppShell",
    "AppSidebar",
    "ConversationList",
    "PromptChips",
    "ToolActivity",
    "buttonStyles",
  ],
  TEXT_SECONDARY: ["AppShell", "AppSidebar", "ErrorBoundary", "buttonStyles"],
  TEXT_MUTED: [
    "ChatMessage",
    "ChatMessageList",
    "ConversationList",
    "InlineThinkingIndicator",
    "ThinkingIndicator",
    "ThinkingTrace",
    "ToolActivity",
  ],
  TEXT_SUBTLE: ["ChatMessage", "ConversationList", "SearchField"],
  PLACEHOLDER_SUBTLE: ["ChatComposer", "SearchField"],
};

const COMMENT_LINE = /^\/\* (--bowman-[a-z-]+): (.+?) - .+ \*\/$/;

// The declaration block is the run of one-line token comments at the top of the stylesheet.
const declaredTokens = (): Map<string, string> => {
  const declared = new Map<string, string>();

  for (const line of read(STYLESHEET).split("\n")) {
    const match = line.match(COMMENT_LINE);

    if (!match) {
      break;
    }
    declared.set(match[1], match[2].replace(/\s+/g, ""));
  }

  return declared;
};

const stripDeclarationBlock = (css: string): string =>
  css
    .split("\n")
    .filter((line) => !COMMENT_LINE.test(line))
    .join("\n");

const USAGE = /\(\s*(--bowman-[a-z-]+)\s*,\s*([^()]*(?:\([^()]*\))?[^()]*?)\s*\)/g;

type Usage = { file: string; token: string; fallback: string };

const usagesIn = (file: string, source: string): Usage[] =>
  [...source.matchAll(USAGE)].map((match) => ({
    file,
    token: match[1],
    fallback: match[2].replace(/\s+/g, ""),
  }));

const scannedSources = (): Array<[string, string]> => [
  [TOKENS_FILE, read(TOKENS_FILE)],
  [STYLESHEET, stripDeclarationBlock(read(STYLESHEET))],
];

const allUsages = (): Usage[] =>
  scannedSources().flatMap(([file, source]) => usagesIn(file, source));

const TABLE_ROW = /^\| `(--bowman-[a-z-]+)` +\| `([^`]+)` +\|/;

// The § Theming section runs from its heading to the next second-level heading.
const themingSection = (): string => {
  const notes = read("docs/design-notes.md");
  const start = notes.indexOf("\n## Theming\n");

  expect(start).toBeGreaterThan(-1);

  const rest = notes.slice(start + 1);
  const end = rest.indexOf("\n## ");

  return end === -1 ? rest : rest.slice(0, end);
};

const documentedTokens = (): Record<string, string> =>
  Object.fromEntries(
    themingSection()
      .split("\n")
      .map((line) => line.match(TABLE_ROW))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => [match[1], match[2].replace(/\s+/g, "")])
  );

describe("the built theming tokens", () => {
  it("dist/styles.css opens with one comment line per token, thirty-three in all, each stating its default", () => {
    const declared = declaredTokens();

    expect([...declared.keys()]).toEqual(Object.keys(EXPECTED_FALLBACKS));
    expect(Object.fromEntries(declared)).toEqual(EXPECTED_FALLBACKS);
  });

  it("the tokens read in dist/theme/tokens.js and dist/styles.css are exactly the thirty-three declared ones", () => {
    const used = new Set(allUsages().map((usage) => usage.token));

    expect([...used].sort()).toEqual([...declaredTokens().keys()].sort());
  });

  it("every --bowman-* occurrence outside the declaration block is a var() read with a non-empty fallback", () => {
    for (const [file, source] of scannedSources()) {
      const occurrences = bowmanTokenNamesIn(source);
      const usages = usagesIn(file, source);

      expect(usages.length, file).toBe(occurrences.length);
      expect(usages.length, file).toBeGreaterThan(0);

      for (const usage of usages) {
        expect(usage.fallback, `${file} ${usage.token}`).not.toBe("");
      }
    }
  });

  it("each token falls back to the same palette value at every site, matching the declared default", () => {
    const fallbacks = new Map<string, Set<string>>();

    for (const usage of allUsages()) {
      const seen = fallbacks.get(usage.token) ?? new Set<string>();

      seen.add(usage.fallback);
      fallbacks.set(usage.token, seen);
    }

    const flattened = Object.fromEntries(
      [...fallbacks].map(([token, seen]) => [token, [...seen].join(" | ")])
    );

    expect(flattened).toEqual(EXPECTED_FALLBACKS);
  });

  it("the keyframe's 50% stop reads --bowman-accent-glow and --bowman-pulse-outline while its zero stop stays literal", () => {
    const css = read(STYLESHEET);

    expect(css).toMatch(/box-shadow: 0 0 0 0 rgba\(59, 130, 246, 0\);/);
    expect(css).toMatch(
      /box-shadow: 0 0 0 4px var\(--bowman-accent-glow, rgba\(59, 130, 246, 0\.1\)\);/
    );
    expect(css).toMatch(
      /outline: 2px solid var\(--bowman-pulse-outline, rgba\(59, 130, 246, 0\.5\)\);/
    );
  });

  it("each neutral role constant is imported by exactly the built components recorded for it", () => {
    const readers: Record<string, string[]> = Object.fromEntries(
      Object.keys(NEUTRAL_ROLE_READERS).map((constant) => [constant, []])
    );

    for (const file of builtComponents()) {
      const specifiers =
        read(file).match(/import \{([^}]*)\} from "\.\.\/theme\/tokens\.js";/)?.[1] ?? "";

      for (const constant of specifiers.split(",").map((name) => name.trim())) {
        if (constant in readers) {
          readers[constant].push(basename(file, ".js"));
        }
      }
    }

    expect(readers).toEqual(NEUTRAL_ROLE_READERS);
  });

  it("no bare blue- palette utility survives in any built component, the tokens module or the stylesheet", () => {
    const components = builtComponents();

    expect(components.length).toBeGreaterThan(0);

    for (const file of [...components, TOKENS_FILE, STYLESHEET]) {
      const outsideFallbacks = read(file).replace(/var\(--color-blue-\d+\)/g, "");

      expect(outsideFallbacks, file).not.toMatch(/blue-/);
    }
  });

  it('dist/theme/tokens.js carries no "use client" directive and dist/index.js re-exports nothing from it', () => {
    expect(read(TOKENS_FILE)).not.toMatch(/use client/);
    expect(read("dist/index.js")).not.toMatch(/theme\/tokens/);
  });

  it("the token table in docs/design-notes.md § Theming lists the same thirty-three names and fallbacks, in the declared order", () => {
    expect(Object.entries(documentedTokens())).toEqual(Object.entries(EXPECTED_FALLBACKS));
  });

  it("no built component carries a --bowman- literal; the class strings live only in dist/theme/tokens.js", () => {
    const components = builtComponents();

    expect(components.length).toBeGreaterThan(0);
    expect(read(TOKENS_FILE)).toMatch(/--bowman-/);

    for (const file of components) {
      expect(read(file), file).not.toMatch(/--bowman-/);
    }
  });

  it("no dist file assigns a --bowman-* value: every occurrence outside the stylesheet's comment block is a read", () => {
    const assignment = /--bowman-[\w-]+\s*:/;
    const scripts = readdirSync(resolve(process.cwd(), "dist"), { recursive: true })
      .map(String)
      .filter((name) => name.endsWith(".js"))
      .map((name) => `dist/${name}`);

    expect(scripts).toContain(TOKENS_FILE);

    for (const file of builtComponents()) {
      expect(read(file), file).not.toMatch(assignment);
    }
    expect(stripDeclarationBlock(read(STYLESHEET))).not.toMatch(assignment);
  });
});
