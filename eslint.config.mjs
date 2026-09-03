import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import stylistic from "@stylistic/eslint-plugin";
import bowman from "./tools/eslint-plugin-bowman/index.mjs";

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

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // House readability baseline for every file the linter reaches (src, tests,
  // scripts, examples): control flow always takes braces, and a blank line
  // separates returns, the import block, declaration groups, and control-flow
  // statements from what precedes them. Both rules are autofixable, and
  // Prettier neither inserts nor removes single blank lines between
  // statements, so --fix followed by prettier --write reaches a fixed point.
  {
    files: ["**/*.{ts,tsx,mts,cts,mjs,cjs,js}"],
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
  // Recorded no-inline-styles exemptions - deliberate decisions, not
  // tolerated drift, each asserted by its component's tests. The exemptions
  // live here, by path, where they are visible and reviewable:
  // - ConversationList: the plain full title is hidden for assistive tech and
  //   the per-character animation is styled inline precisely so the package
  //   needs no stylesheet or Tailwind config from the consumer.
  // - Toast: the hidden live region uses the same no-consumer-stylesheet
  //   visually-hidden pattern (its cross-file duplication is issue #5).
  // - ThinkingDots: the per-dot animation stagger is data (one delay per
  //   dot), asserted as an inline style by tests/helpers/expect-thinking-dots.ts.
  {
    files: [
      "src/components/ConversationList.tsx",
      "src/components/ThinkingDots.tsx",
      "src/components/Toast.tsx",
    ],
    rules: {
      "bowman/no-inline-styles": "off",
    },
  },
  // Issue #60 guardrail: duplication limits, scoped to src/** only. tests/ is
  // NOT ignored by `npm run lint`, and the eslint fixtures hold intentional
  // duplicate strings, so the plugin must never see tests/ source. The
  // eslint-duplication fixture glob is linted with --no-ignore by the test.
  // sonarjs/no-duplicate-string counts occurrences per file: the `"use client"`
  // directive and the `rect(0, 0, 0, 0)` visually-hidden clip each appear once
  // per file, so neither reaches the threshold - see report for the analysis.
  {
    files: ["src/**/*.{ts,tsx}", "tests/fixtures/eslint-duplication/**/*.{ts,tsx}"],
    plugins: { sonarjs },
    rules: {
      "sonarjs/no-duplicate-string": ["error", { threshold: 3, ignoreStrings: "use client" }],
      "sonarjs/no-identical-functions": "error",
    },
  },
  {
    ignores: [
      ".claude/**",
      "dist/**",
      "coverage/**",
      "node_modules/**",
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
