import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // CONTRACT.md § Labels: hardcoded user-visible/assistive strings and i18n
  // runtimes are banned from src/. Core ESLint only - no new plugin. The
  // tests/fixtures/eslint-labels/ glob exists so the red fixtures (globally
  // ignored below, linted with --no-ignore by tests/eslint-labels.test.ts)
  // are checked against these exact rules, not a copy of them.
  {
    files: ["src/**/*.{ts,tsx}", "tests/fixtures/eslint-labels/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXText[value=/[A-Za-z]{3}/]",
          message:
            "Hardcoded JSX text. User-visible strings come from a labels prop resolved over English defaults - see CONTRACT.md § Labels.",
        },
        {
          selector:
            ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))",
          message:
            "Hardcoded JSX text. User-visible strings come from a labels prop resolved over English defaults - see CONTRACT.md § Labels.",
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
            "Hardcoded JSX text. User-visible strings come from a labels prop resolved over English defaults - see CONTRACT.md § Labels.",
        },
        {
          selector:
            "JSXAttribute[name.name=/^(aria-label|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > Literal[value=/[A-Za-z]{3}/]",
          message:
            "Hardcoded assistive string. aria-*/title/placeholder/alt text comes from a labels prop resolved over English defaults - see CONTRACT.md § Labels.",
        },
        {
          selector:
            "JSXAttribute[name.name=/^(aria-label|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > JSXExpressionContainer > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))",
          message:
            "Hardcoded assistive string. aria-*/title/placeholder/alt text comes from a labels prop resolved over English defaults - see CONTRACT.md § Labels.",
        },
        {
          selector:
            'JSXAttribute[name.name=/^(aria-label|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt)$/] > JSXExpressionContainer > :matches(LogicalExpression, ConditionalExpression, BinaryExpression[operator="+"]) > :matches(Literal[value=/[A-Za-z]{3}/], TemplateLiteral:has(TemplateElement[value.raw=/[A-Za-z]{3}/]))',
          message:
            "Hardcoded assistive string. aria-*/title/placeholder/alt text comes from a labels prop resolved over English defaults - see CONTRACT.md § Labels.",
        },
        {
          selector:
            "TSPropertySignature > Identifier.key[name=/^(strings|texts|t|i18n|translations|messages)$/]",
          message:
            "The one string-override prop is `labels?: Partial<XLabels>` - not strings, texts, t, i18n, translations or messages. See CONTRACT.md § Labels.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next-intl",
              message:
                "bowman-ui ships no i18n runtime; strings come in through the labels prop. See CONTRACT.md § Labels.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "tests/fixtures/eslint-labels/**",
      "tests/fixtures/forbidden-imports/**",
      "examples/chat-demo/dist/**",
      "examples/chat-demo/test-results/**",
      "examples/chat-demo/playwright-report/**",
      "examples/rsc-fixture/.next/**",
      "examples/rsc-fixture/next-env.d.ts",
    ],
  },
];
