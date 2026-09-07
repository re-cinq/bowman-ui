import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import stylistic from "@stylistic/eslint-plugin";
import markdown from "@eslint/markdown";
import bowman from "./tools/eslint-plugin-bowman/index.mjs";
import lore from "./tools/eslint-plugin-lore/index.mjs";

// docs/design-notes.md § Labels: the shared no-restricted-syntax selector set. Hoisted
// into a const so the src/** overlays below (raw-<svg> ban, inline
// focusable-selector ban) can spread it back in. In flat config a later config
// object whose `rules` sets `no-restricted-syntax` REPLACES the earlier value
// for that rule id - arrays never merge - so every overlay that also matches
// the Labels files must re-list these selectors or it would silently disable
// them.
const labelsRestrictedSyntax = [
  {
    selector: "JSXText[value=/[A-Za-z]{3}/]",
    message:
      "Hardcoded JSX text. User-visible strings come from a labels prop resolved over English defaults - see docs/design-notes.md § Labels.",
  },
  {
    selector:
      ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))",
    message:
      "Hardcoded JSX text. User-visible strings come from a labels prop resolved over English defaults - see docs/design-notes.md § Labels.",
  },
  {
    // The conditional-render forms: {ok && "text"}, {ok ? "a" : "b"},
    // {"a" + "b"}. A direct-child chain on purpose, twice over: a
    // descendant combinator would cross into className templates and
    // object literals inside {items.map(...)} callbacks, and the
    // literal must sit directly under the rendering operator so a
    // comparison operand ({variant === "desktop" && x}) never fires.
    selector:
      ':matches(JSXElement, JSXFragment) > JSXExpressionContainer > :matches(LogicalExpression, ConditionalExpression, BinaryExpression[operator="+"]) > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))',
    message:
      "Hardcoded JSX text. User-visible strings come from a labels prop resolved over English defaults - see docs/design-notes.md § Labels.",
  },
  {
    selector:
      "JSXAttribute[name.name=/^(aria-label|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > Literal[value=/[A-Za-z]{3}/]",
    message:
      "Hardcoded assistive string. aria-*/title/placeholder/alt text comes from a labels prop resolved over English defaults - see docs/design-notes.md § Labels.",
  },
  {
    selector:
      "JSXAttribute[name.name=/^(aria-label|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > JSXExpressionContainer > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))",
    message:
      "Hardcoded assistive string. aria-*/title/placeholder/alt text comes from a labels prop resolved over English defaults - see docs/design-notes.md § Labels.",
  },
  {
    selector:
      'JSXAttribute[name.name=/^(aria-label|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > JSXExpressionContainer > :matches(LogicalExpression, ConditionalExpression, BinaryExpression[operator="+"]) > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))',
    message:
      "Hardcoded assistive string. aria-*/title/placeholder/alt text comes from a labels prop resolved over English defaults - see docs/design-notes.md § Labels.",
  },
  {
    selector:
      "TSPropertySignature > Identifier.key[name=/^(strings|texts|t|i18n|translations|messages)$/]",
    message:
      "The one string-override prop is `labels?: Partial<XLabels>` - not strings, texts, t, i18n, translations or messages. See docs/design-notes.md § Labels.",
  },
];

// Issue #60: hand-written <svg> belongs in src/icons, never inline in a
// component - the icon factory in src/icons is the one source.
const svgBan = {
  selector: 'JSXOpeningElement > JSXIdentifier[name="svg"]',
  message:
    "Raw <svg> element. Compose an icon from src/icons instead of hand-writing SVG in a component - see issue #60.",
};

// Issue #60: the keyboard focusable-selector string lives once in
// src/hooks/focusableSelector.ts (FOCUSABLE_SELECTOR). Any inline copy carries
// the `:not([tabindex="-1"])` marker and is banned everywhere else.
const focusableLiteralBan = {
  selector: 'Literal[value=/:not\\(\\[tabindex="-1"\\]\\)/]',
  message:
    "Inline focusable-selector literal. Import FOCUSABLE_SELECTOR from src/hooks/focusableSelector.ts instead of copying the selector - see issue #60.",
};

// docs/design-notes.md § Lint guardrails: the public surface is named exports
// only (`export const`), so a rename is a compile error in every consumer
// instead of a silent aliasing. Like the selectors above, this must ride in
// EVERY no-restricted-syntax overlay below - a later overlay replaces the
// whole array, so an overlay that dropped it would silently disable the ban
// for its files.
const defaultExportBan = {
  selector: "ExportDefaultDeclaration",
  message:
    "Default export. The public surface is named exports only (`export const`) - see docs/design-notes.md § Lint guardrails.",
};

// Every script file the linter reaches. The JavaScript presets, parser options
// and react-hooks rules are scoped to this glob rather than left global: a
// global config object also applies to the markdown-language block below,
// where core JavaScript rules crash on a markdown source.
const scriptFiles = ["**/*.{ts,tsx,mts,cts,mjs,cjs,js}"];

export default [
  ...tseslint.config({
    files: scriptFiles,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/refs": "error",
      "react-hooks/set-state-in-effect": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  }),
  // Recorded react-hooks exemptions - each a documented, test-asserted render
  // pattern, not drift (see docs/design-notes.md § Lint guardrails decision 8).
  // - ChatMessage: the monotonic entry-id thinking-indicator latch, a ref read
  //   and written during render, keyed by entry.id and idempotent.
  // - useSidebarState: the storedOpenRef latest-value read that seeds the
  //   controlled state without a stale closure.
  {
    files: ["src/components/ChatMessage.tsx", "src/hooks/useSidebarState.ts"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  // - Toast: the live region is seeded empty then filled in a mount effect, so
  //   a screen reader reliably announces the text; the extra commit is the
  //   mechanism, not an accident.
  {
    files: ["src/components/Toast.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // House readability baseline for every file the linter reaches (src, tests,
  // scripts, examples): control flow always takes braces, and a blank line
  // separates returns, the import block, declaration groups, and control-flow
  // statements from what precedes them. Both rules are autofixable, and
  // Prettier neither inserts nor removes single blank lines between
  // statements, so --fix followed by prettier --write reaches a fixed point.
  {
    files: scriptFiles,
    plugins: { "@stylistic": stylistic },
    rules: {
      curly: ["error", "all"],
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "for", "while", "switch", "try", "do"],
        },
      ],
    },
  },
  // docs/design-notes.md § Labels: hardcoded user-visible/assistive strings and i18n
  // runtimes are banned from src/. Core ESLint only - no new plugin. The
  // tests/fixtures/eslint-labels/ glob exists so the red fixtures (globally
  // ignored below, linted with --no-ignore by tests/eslint-labels.test.ts)
  // are checked against these exact rules, not a copy of them.
  {
    files: ["src/**/*.{ts,tsx}", "tests/fixtures/eslint-labels/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...labelsRestrictedSyntax, defaultExportBan],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next-intl",
              message:
                "bowman-ui ships no i18n runtime; strings come in through the labels prop. See docs/design-notes.md § Labels.",
            },
          ],
        },
      ],
    },
  },
  // Issue #60 guardrail: inline focusable-selector literals are banned across
  // src/** except the one home in src/hooks/focusableSelector.ts. This overlay
  // also matches every Labels src/** file, so it re-lists the Labels selectors;
  // the eslint-duplication fixture glob is linted with --no-ignore by the test.
  {
    files: [
      "src/**/*.{ts,tsx}",
      "tests/fixtures/eslint-duplication/focusable-literal/**/*.{ts,tsx}",
    ],
    ignores: ["src/hooks/focusableSelector.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...labelsRestrictedSyntax,
        focusableLiteralBan,
        defaultExportBan,
      ],
    },
  },
  // Issue #60 guardrail: raw <svg> is banned in src/components/** (never in
  // src/icons/**, where the icon factory legitimately renders one). This is the
  // last no-restricted-syntax overlay for component files, so it must carry the
  // full set: Labels + focusable ban + the svg ban.
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "tests/fixtures/eslint-duplication/raw-svg/**/*.{ts,tsx}",
      "tests/fixtures/eslint-house-rules/default-export/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...labelsRestrictedSyntax,
        focusableLiteralBan,
        svgBan,
        defaultExportBan,
      ],
    },
  },
  // docs/design-notes.md § Lint guardrails: the house rules, scoped to src/**.
  // The eslint-house-rules fixture glob exists so the red fixtures (globally
  // ignored below, linted with --no-ignore by tests/eslint-house-rules.test.ts)
  // are checked against these exact rules, not a copy of them.
  {
    files: ["src/**/*.{ts,tsx}", "tests/fixtures/eslint-house-rules/**/*.{ts,tsx}"],
    plugins: { bowman },
    rules: {
      "bowman/max-boolean-operators": ["error", { max: 2 }],
      "bowman/no-catch-as-control-flow": "error",
      "bowman/no-inline-styles": "error",
      "bowman/no-network-egress": "error",
      "bowman/no-prop-mutation": "error",
    },
  },
  // Mirrored lore craftsmanship rules: tools/eslint-plugin-lore/rules/** are
  // verbatim mirrors of the generic subset of re-cinq/lore's plugin, policed
  // against lore's main by scripts/check-lore-plugin-sync.mjs (which also
  // fails on an upstream rule this repo has neither mirrored nor excluded).
  // Scoped to src/** like the bowman house rules; max-comment-lines carries
  // lore's own limit. See docs/design-notes.md § Lint guardrails decision 9.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { lore },
    rules: {
      "lore/max-comment-lines": ["error", { max: 1 }],
      "lore/no-forwarding-class": "error",
      "lore/no-nested-if": "error",
      "lore/no-nested-loop": "error",
      "lore/no-reexport-only-module": "error",
      "lore/no-vague-names": "error",
      "lore/prefer-early-return": "error",
      "lore/prefer-enforce-true": "error",
    },
  },
  // Recorded no-inline-styles exemptions - deliberate decisions, not
  // tolerated drift, each asserted by its component's tests. The exemptions
  // live here, by path, where they are visible and reviewable:
  // - ConversationList: the per-character typewriter animation is data (one
  //   opacity per character) and is styled inline; the hidden plain title uses
  //   the stylesheet's bowman-sr-only class like every other hidden region.
  // - ThinkingDots: the per-dot animation stagger is data (one delay per
  //   dot), asserted as an inline style by tests/helpers/expect-thinking-dots.ts.
  {
    files: ["src/components/ConversationList.tsx", "src/components/ThinkingDots.tsx"],
    rules: {
      "bowman/no-inline-styles": "off",
    },
  },
  // Issue #60 guardrail: duplication limits, scoped to src/** only. tests/ is
  // NOT ignored by `npm run lint`, and the eslint fixtures hold intentional
  // duplicate strings, so the plugin must never see tests/ source. The
  // eslint-duplication fixture glob is linted with --no-ignore by the test.
  // sonarjs/no-duplicate-string counts occurrences per file: the `"use client"`
  // directive appears once per file, so it never reaches the threshold - see
  // report for the analysis. The visually-hidden clip that once sat beside it
  // is a single stylesheet rule since issue #5.
  {
    files: ["src/**/*.{ts,tsx}", "tests/fixtures/eslint-duplication/**/*.{ts,tsx}"],
    plugins: { sonarjs },
    rules: {
      "sonarjs/no-duplicate-string": ["error", { threshold: 3, ignoreStrings: "use client" }],
      "sonarjs/no-identical-functions": "error",
    },
  },
  // Every markdown link to a repo file must land (lore/no-dead-md-links,
  // mirrored - decision 9): a rename sweep rewrites a dead link faithfully
  // and the reference reads as current. The only markdown rule; the
  // assistive-technology-pass spec carries a scoped disable for its seven
  // deliberate links to the not-yet-written at-pass-<date>.md record.
  {
    files: ["**/*.md"],
    language: "markdown/gfm",
    plugins: { markdown, lore },
    rules: { "lore/no-dead-md-links": "error" },
  },
  {
    ignores: [
      ".claude/**",
      "dist/**",
      "coverage/**",
      "node_modules/**",
      // Verbatim lore mirrors (rule files only - the local index.mjs subset
      // selector is linted): lore does not house-style-lint its own plugin,
      // so its bytes cannot be expected to pass this config.
      "tools/eslint-plugin-lore/rules/**",
      // Verbatim lore mirrors of the spec-segmentation domain library
      // (decision 10), on the same terms as the rule files above.
      "tools/lore-spec-domain/**",
      "tests/fixtures/eslint-labels/**",
      "tests/fixtures/eslint-duplication/**",
      "tests/fixtures/eslint-house-rules/**",
      "tests/fixtures/forbidden-imports/**",
      "examples/chat-demo/dist/**",
      "examples/chat-demo/test-results/**",
      "examples/chat-demo/playwright-report/**",
      "examples/rsc-fixture/.next/**",
      "examples/rsc-fixture/next-env.d.ts",
    ],
  },
];
