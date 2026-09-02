# bowman-ui System Specification

## Overview

**bowman-ui** is a presentational React component library providing UI building blocks for AI chat interfaces. It is extracted from an internal application and published as `@re-cinq/bowman-ui` on npm ([validated by](../tests/system-contract.test.ts#L14)). The library delivers props-driven, composable React components with no built-in authentication, data-fetching, routing, or internationalization (i18n) dependencies ([validated by](../tests/ChatMessage.test.tsx#L677), [system-contract](../tests/system-contract.test.ts#L39)). Consumers are responsible for supplying data and labels; the components render them according to received props ([validated by](../tests/labelled-exports.test.tsx#L559)).

**Naming convention**: HAL is the conversational engine; Bowman is the presentational face (the UI).

The public surface ships 57 named value exports from `src/index.ts`: 12 components, 5 hooks, a 23-icon set with two icon helpers, a markdown factory with its URL-policy pair, 11 label-defaults objects, and the `resolveLabels` merge helper, plus 45 type exports including the chat entry types ([validated by](../tests/public-api.test.ts#L40)).

## Key Capabilities

1. **Message Rendering** — `ChatMessage` renders one chat entry as an avatared message with copy and feedback affordances ([validated by](../tests/ChatMessage.test.tsx#L49))
2. **Message List** — `ChatMessageList` renders a scroll-managed transcript, forwards each entry to `ChatMessage`, and always renders the AI-disclosure band ([validated by](../tests/ChatMessageList.test.tsx#L150))
3. **Composer** — `ChatComposer` is a text-input and submission surface that owns its own draft ([validated by](../tests/ChatComposer.test.tsx#L31))
4. **Conversation List** — `ConversationList` renders conversation rows with selection, an active row, and a consumer routing seam ([validated by](../tests/ConversationList.test.tsx#L33))
5. **App Shell** — `AppShell` is the top-level layout frame; `AppSidebar` supplies the `aside`/`nav` landmarks and navigation map ([validated by](../tests/AppShell.test.tsx#L22), [AppSidebar](../tests/AppSidebar.test.tsx#L15))
6. **Thinking Family** — `ThinkingIndicator`, `InlineThinkingIndicator`, `ThinkingTrace`, and the shared `ThinkingDots` render in-flight reasoning states ([validated by](../tests/ThinkingIndicator.test.tsx#L12), [inline](../tests/InlineThinkingIndicator.test.tsx#L6), [trace](../tests/ThinkingTrace.test.tsx#L29), [dots](../tests/ThinkingIndicator.test.tsx#L37))
7. **Tool Activity** — `ToolActivity` renders a tool call safely by default, with the tool name and arguments out of the DOM ([validated by](../tests/ToolActivity.test.tsx#L18))
8. **Transient & Error Surfaces** — `Toast` renders a live-region notice and `ErrorBoundary` catches render errors into an overridable fallback ([validated by](../tests/Toast.test.tsx#L26), [error](../tests/ErrorBoundary.test.tsx#L44))
9. **Icon Set** — 23 SVG icons plus `IconWrapper` and `getAccessibleIconProps`, with a tested WCAG accessibility contract ([validated by](../tests/icons.test.tsx#L58), [accessible-props](../tests/icons.test.tsx#L168))
10. **Markdown Rendering** — `createMarkdownComponents` renders assistant markdown through react-markdown + remark-gfm under a strict URL policy ([validated by](../tests/markdown-components.test.tsx#L59))
11. **Labels Convention** — Every user-visible string is an overridable English default merged through `resolveLabels`; no locale catalogue ships ([validated by](../tests/labelled-exports.test.tsx#L142))
12. **RSC Client-Boundary Guarantee** — `"use client"` is applied per file so a Next.js App Router server component can import from the package ([validated by](../tests/client-directives.test.ts#L80))
13. **Type-Safe API** — Full TypeScript strict-mode support; no implicit `any` in public interfaces ([validated by](../tests/public-api.test.ts#L47), [system-contract](../tests/system-contract.test.ts#L52), [list-type-assertions](../tests/types/chat-message-list-type-assertions.tsx#L52))
14. **ESM-Only, Tree-Shakeable Distribution** — Single ESM output with named exports for dead-code elimination ([validated by](../tests/system-contract.test.ts#L30), [tree-shake](../tests/public-api.test.ts#L40))

## Core Data Model

The library defines one entry shape. `ChatEntry` is a discriminated union over four role-tagged variants — `UserChatEntry`, `AssistantChatEntry`, `ThinkingChatEntry`, `ToolChatEntry` — exported alongside `ChatStreamState` and `ChatErrorInfo` as exactly eight chat type names ([validated by](../tests/types/chat.test.ts#L118)). A fifth role or a streamless assistant entry fails to typecheck ([validated by](../tests/types/chat.test.ts#L71)). No generic `metadata` bag is allowed: the entry types declare no `index`, `devMetadata`, `correlationId`, `timestamp`, or similar property ([validated by](../tests/types/chat.test.ts#L95)). There is no `User`/`Participant` type and no `Composer State` type.

Other public data shapes are consumer-supplied and rendered as-is: `ConversationListItem` for list rows ([validated by](../tests/ConversationList.test.tsx#L33)) and `ChatAttribution` for the per-persona display name and avatar resolved by `ChatMessageList` ([validated by](../tests/ChatMessageList.test.tsx#L473)). `ChatComposer` owns its draft internally — the textarea is uncontrolled with no `value`/`onValueChange` prop ([validated by](../tests/ChatComposer.test.tsx#L337)) — and exposes imperative control through a `ChatComposerHandle` ref (`setValue`, `focus`) ([validated by](../tests/ChatComposer.test.tsx#L175)).

### Responsibility Boundary

| Aspect              | Owner                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data fetching       | Consumer ([validated by](../tests/ChatMessage.test.tsx#L677))                                                                                                          |
| Authentication      | Consumer                                                                                                                                                               |
| State management    | Consumer ([validated by](../tests/ChatMessage.test.tsx#L696))                                                                                                          |
| Routing             | Consumer                                                                                                                                                               |
| i18n/localization   | Consumer ([validated by](../tests/labelled-exports.test.tsx#L559))                                                                                                     |
| AI disclosure       | Consumer supplies the string; library forces the required `aiDisclosure` prop ([validated by](../tests/ChatMessageList.test.tsx#L150))                                 |
| Telemetry           | None — the package emits none ([validated by](../tests/ChatComposer.test.tsx#L353))                                                                                    |
| Component rendering | bowman-ui                                                                                                                                                              |
| Event callbacks     | bowman-ui (via props)                                                                                                                                                  |
| Styling             | bowman-ui ships `./styles.css`; consumer's Tailwind v4 build scans `dist` ([validated by](../tests/styles.test.ts#L84), [source](../tests/tailwind-build.test.ts#L75)) |

## User Roles

1. **Consumer Application Developer** — Integrates bowman-ui into a chat or conversational AI application. Responsible for data flow, authentication, routing, and label provisioning.
2. **bowman-ui Maintainer** — Develops, tests, and publishes components. Ensures TypeScript strict mode, accessibility, and test coverage compliance.
3. **End User** — Interacts with rendered chat UI (messaging, scrolling, composer input); no direct interaction with bowman-ui APIs.

## Business Rules

### Component Design Principles

1. **Presentational Only** — No side effects, API calls, or complex state logic. All behavior is props-driven. ([validated by](../tests/ChatMessage.test.tsx#L696), [L403](../tests/ConversationList.test.tsx#L407))
2. **Composability** — Components combine into larger layouts (e.g., `ChatMessage` + `ChatMessageList` + `ChatComposer` form a chat surface; `AppShell` + `AppSidebar` frame it).
3. **Controlled by Default** — Components prefer controlled props; the five shipped hooks are `useDebounce`, `useFocusTrap`, `useFocusGroups`, `useReducedMotion`, and `useSidebarState`. ([validated by](../tests/hooks-dist.test.ts#L52))
4. **Stylesheet Ships With the Package** — Components carry Tailwind utility class names; `./styles.css` supplies the four keyframes and markdown/sr-only rules Tailwind cannot generate, and the consumer's Tailwind v4 build scans `dist`. ([validated by](../tests/styles.test.ts#L84), [source](../tests/tailwind-build.test.ts#L75))
5. **Minimal Runtime Dependencies** — Only `react-markdown` (`^10.1.0`) and `remark-gfm` (`^4.0.1`) are runtime dependencies; React and React-DOM are peers. ([validated by](../tests/system-contract.test.ts#L22), [L39](../tests/system-contract.test.ts#L39))

### API Stability

1. **Semantic Versioning** — MAJOR.MINOR.PATCH follows semver conventions. ([validated by](../tests/system-contract.test.ts#L18))
2. **Breaking Changes Require Major Version Bump** — Incompatible prop changes, removed components, or signature alterations require a major increment.
3. **Deprecation Path** — Features scheduled for removal are marked with deprecation notices in a minor release; removal occurs in the next major.
4. **Type Safety as Contract** — Public prop interfaces are exported and treated as API; TypeScript changes to props are breaking changes. ([validated by](../tests/public-api.test.ts#L47), [type-assertions](../tests/types/chat-message-type-assertions.tsx#L51))

### Code Quality Mandates

1. **TypeScript Strict Mode** — `tsconfig.json` enforces `strict: true`; all files compile without implicit `any`. ([validated by](../tests/system-contract.test.ts#L52))
2. **No Console Logs in Production** — Development aids removed before distribution. ([validated by](../tests/system-contract.test.ts#L72))
3. **Accessibility Baseline** — ARIA attributes, semantic HTML, keyboard support, and 4.5:1 color contrast minimum for text. ([validated by](../tests/icons.test.tsx#L168), [L72](../tests/useFocusTrap.test.tsx#L72))
4. **Test Coverage ≥80%** — Props, prop combinations, and user interactions covered by React Testing Library tests. ([validated by](../tests/system-contract.test.ts#L59))
5. **ESLint & Prettier Enforcement** — Consistent formatting and linting; CI blocks merge on violations.

### Distribution & Consumption

1. **ESM-Only Distribution** — A single ESM build is published; the `.` export resolves to `dist/index.js` with no `require` condition, so consumers need native ESM or an ESM-aware bundler. ([validated by](../tests/system-contract.test.ts#L30))
2. **Stylesheet Subpath Export** — `./styles.css` is a published export and `sideEffects` lists `*.css` so bundlers keep it. ([validated by](../tests/styles.test.ts#L84), [side-effects](../tests/styles.test.ts#L91))
3. **Type Definitions Included** — `.d.ts` files are bundled for full TypeScript IDE support. ([validated by](../tests/hooks-dist.test.ts#L52))
4. **Tree-Shakeable** — Named exports prioritized; unused components can be eliminated by bundlers. ([validated by](../tests/public-api.test.ts#L40))
5. **No Internal Implementation Details Exposed** — Private modules and helpers are not exported; only public contracts are. ([validated by](../tests/types/chat.test.ts#L226), [L40](../tests/public-api.test.ts#L40))

### Dependency Management

1. **React ^19** — Peer ranges are `^19.0.0`; `AppShell` relies on React 19's boolean `inert` prop. ([validated by](../tests/system-contract.test.ts#L26))
2. **No Breaking Dependency Shifts** — Major dependency updates (e.g., a React major) are coordinated and communicated.
3. **Lock File Committed** — `package-lock.json` is versioned in Git for reproducible installs. ([validated by](../tests/system-contract.test.ts#L43))
4. **Security Updates Prioritized** — npm audit findings addressed promptly; dependabot alerts monitored.

### Git & Release Workflow

1. **Conventional Commits** — Commits follow `<type>(<scope>): <subject>` (feat, fix, refactor, test, docs, chore, ci, style).
2. **Branch Naming** — `<type>/<scope>-<description>` (e.g., `feat/chat-message`, `fix/composer-submit-bug`).
3. **PR Gating** — All CI checks, linting, type-check, and tests must pass before merge.
4. **Minimum 1 Approval** — Code review required before merge.
5. **Git Tags on Release** — Version tag (e.g., `v1.0.0`) matches `package.json` version.

## Rendering & Runtime Boundaries

1. **`"use client"` Is Per-File** — The directive is added only to files triggering a client-only rule (a hook-shaped import, `createContext`, a `Component` subclass, a browser global, or an `on[A-Z]` JSX handler); 18 source files carry it and `src/index.ts` carries none. ([validated by](../tests/client-directives.test.ts#L80))
2. **Icons Are Server-Renderable** — The 23 icons are pure SVG and carry no directive, so they push no JS into consumer bundles. ([validated by](../tests/icons.test.tsx#L119))
3. **Next.js App Router Guarantee** — Because the boundary is per-file, a server component can import the package. ([validated by](../tests/client-directives.test.ts#L80))
4. **Function-Valued Props Cross From `"use client"`** — The package accepts function props (`onSubmit`, `renderSidebar`, `renderLink`, and the rest); React's serialization boundary rejects passing them from a server component, so an App Router consumer supplies them from a `"use client"` file. The RSC fixture build is the executable proof (see CONTRACT.md § RSC fixture).

## Compliance

1. **GDPR — No Telemetry** — Components call no `console.*`, `localStorage`, `sessionStorage`, `fetch`, or `sendBeacon`, and persist no user content. ([validated by](../tests/ChatMessage.test.tsx#L696), [composer](../tests/ChatComposer.test.tsx#L353), [list](../tests/ConversationList.test.tsx#L407))
2. **EU AI Act — AI Disclosure** — `ChatMessageList`'s `aiDisclosure` label is required with no default and renders in every state, so no consumer can render the chat surface without it. ([validated by](../tests/ChatMessageList.test.tsx#L150), [type](../tests/types/chat-message-list-type-assertions.tsx#L52))
3. **Markdown URL Policy** — `defaultMarkdownPolicy` allows only `https`/`mailto`/`tel`; `createUrlTransform` drops every other scheme, and dangerous schemes on a link render a hrefless span. ([validated by](../tests/markdown/urlPolicy.test.tsx#L33), [xss](../tests/security/markdown-xss.test.tsx#L84))
4. **Markdown HTML Is Inert** — No `rehype-raw` is wired in, so model-authored HTML in markdown renders as literal text rather than live nodes. ([validated by](../tests/security/markdown-xss.test.tsx#L55))

### Model-Authored Content Defaults

Content the model authored renders behind conservative defaults, since it may restate customer identifiers:

1. **Tool Arguments Hidden** — `ToolActivity` defaults `showToolName` and `showToolInput` to `false`, keeping the tool name and arguments out of the DOM; when shown, arguments render as inert text, never HTML. ([validated by](../tests/ToolActivity.test.tsx#L41), [input](../tests/ToolActivity.test.tsx#L56), [inert](../tests/ToolActivity.test.tsx#L63))
2. **Reasoning Is Inert Text** — `ThinkingTrace` renders its content as plain, collapsed text; markdown and HTML payloads render as inert literal text. ([validated by](../tests/ThinkingTrace.test.tsx#L58))

## Success Metrics

1. **npm Download Rate** — Track `@re-cinq/bowman-ui` weekly/monthly downloads as an adoption indicator.
2. **Type Coverage** — 100% of public API props typed; zero implicit `any` in strict mode. ([validated by](../tests/public-api.test.ts#L47), [system-contract](../tests/system-contract.test.ts#L52))
3. **Test Coverage** — Minimum 80% line/branch coverage; trends monitored per release. ([validated by](../tests/system-contract.test.ts#L59))
4. **Accessibility Conformance** — Components pass automated a11y tests; manual QA for keyboard navigation and screen reader compatibility.
5. **Issue Resolution SLA** — Critical bugs addressed within 2 weeks; minor issues within 30 days.
6. **Release Cadence** — Stable release every 4–8 weeks; hotfix releases as needed.
7. **Bundle Size** — Monitor minified+gzipped size of distribution per release.
8. **Documentation Completeness** — README, JSDoc, and API docs updated with each feature release.
