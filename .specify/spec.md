# bowman-ui System Specification

## Overview

**bowman-ui** is a presentational React component library providing UI building blocks for AI chat interfaces. It is published as `@re-cinq/bowman-ui` on npm ([validated by names the package "@re-cinq/bowman-ui"](../tests/system-contract.test.ts#L14)). The library delivers props-driven, composable React components with no built-in authentication, data-fetching, routing, or internationalization (i18n) dependencies ([validated by neither file imports @clerk, swr, next-intl, next/, @/ or lucide-react and every relative import ends in .js](../tests/ChatMessage.test.tsx#L737), [system-contract](../tests/system-contract.test.ts#L39)). Consumers are responsible for supplying data and labels; the components render them according to received props ([validated by no run of three Latin letters survives outside the sentinels for any labelsProp member](../tests/labelled-exports.test.tsx#L637)).

**Naming convention**: HAL is the conversational engine; Bowman is the presentational face (the UI).

The public surface ships 63 named value exports from `src/index.ts`: 16 components, 5 hooks, a 23-icon set with two icon helpers, a markdown factory with its URL-policy pair, 13 label-defaults objects, and the `resolveLabels` merge helper, plus 54 type exports including the chat entry types ([validated by](../tests/public-api.test.ts#L40), [types](../tests/public-api.test.ts#L46)).

## Key Capabilities

1. **Message Rendering** — `ChatMessage` renders one chat entry as an avatared message with copy and feedback affordances ([validated by a user entry renders its content, the userInitials, and an article labelled exactly "Your message"](../tests/ChatMessage.test.tsx#L82))
2. **Message List** — `ChatMessageList` renders a scroll-managed transcript, forwards each entry to `ChatMessage`, and always renders the AI-disclosure band ([validated by renders the resolved aiDisclosure outside the role=log region in both states](../tests/ChatMessageList.test.tsx#L174))
3. **Composer** — `ChatComposer` is a text-input and submission surface that owns its own draft ([validated by typing "Hvor er min booking?" and clicking send calls onSubmit once with exactly that string, then the draft is "", the height is back to auto and send is disabled again](../tests/ChatComposer.test.tsx#L46))
4. **Conversation List** — `ConversationList` renders conversation rows with selection, an active row, and a consumer routing seam ([validated by `two items render two <li>s inside one <ul> named "Conversations" by default, in items order`](../tests/ConversationList.test.tsx#L59))
5. **App Shell** — `AppShell` is the top-level layout frame; `AppSidebar` supplies the `aside`/`nav` landmarks and navigation map ([validated by `renders children inside <main id="main-content"> by default`](../tests/AppShell.test.tsx#L28), [AppSidebar](../tests/AppSidebar.test.tsx#L22))
6. **Thinking Family** — `ThinkingIndicator`, `InlineThinkingIndicator`, `ThinkingTrace`, and the shared `ThinkingDots` render in-flight reasoning states ([validated by renders "Thinking" and a role="status" element with aria-label "Loading response" by default](../tests/ThinkingIndicator.test.tsx#L14), [inline](../tests/InlineThinkingIndicator.test.tsx#L6), [trace](../tests/ThinkingTrace.test.tsx#L33), [dots](../tests/ThinkingIndicator.test.tsx#L39))
7. **Tool Activity** — `ToolActivity` renders a tool call safely by default, with the tool name and arguments out of the DOM ([validated by shows the activityDone sentence and none of the tool name or arguments](../tests/ToolActivity.test.tsx#L20))
8. **Transient & Error Surfaces** — `Toast` renders a live-region notice and `ErrorBoundary` catches render errors into an overridable fallback ([validated by renders "Booking 4711 guardado" inside an element with role="status" and aria-live="polite"](../tests/Toast.test.tsx#L24), [error](../tests/ErrorBoundary.test.tsx#L65))
9. **Icon Set** — 23 SVG icons plus `IconWrapper` and `getAccessibleIconProps`, with a tested WCAG accessibility contract ([validated by exports exactly the 23 icon components plus IconWrapper and getAccessibleIconProps](../tests/icons.test.tsx#L56), [accessible-props](../tests/icons.test.tsx#L178))
10. **Markdown Rendering** — `createMarkdownComponents` renders assistant markdown through react-markdown + remark-gfm under a strict URL policy ([validated by](../tests/markdown-components.test.tsx#L59))
11. **Labels Convention** — User-visible strings are overridable English defaults merged through `resolveLabels`, except the two required labels with no default - `ChatMessageList`'s `aiDisclosure` and `IconButton`'s `accessibleName`, for which `IconButton` ships no defaults object - and three strings taken through a dedicated prop rather than a labels object (the icons' `ariaLabel`, `useFocusGroups`' `announce`, `Toast`'s `message`); no locale catalogue ships ([validated by labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports](../tests/labelled-exports.test.tsx#L158), [ai-disclosure](../tests/ChatMessageList.test.tsx#L174), [accessible-name](../tests/labelled-exports.test.tsx#L621))
12. **RSC Client-Boundary Guarantee** — `"use client"` is applied per file so a Next.js App Router server component can import from the package ([validated by exits zero against src/ and dist/](../tests/client-directives.test.ts#L90))
13. **Type-Safe API** — Full TypeScript strict-mode support; no implicit `any` in public interfaces ([validated by](../tests/public-api.test.ts#L47), [system-contract](../tests/system-contract.test.ts#L53), [list-type-assertions](../tests/types/chat-message-list-type-assertions.tsx#L53))
14. **ESM-Only, Tree-Shakeable Distribution** — Single ESM output with named exports for dead-code elimination ([validated by distributes ESM only: "type" is "module" and the "." export carries no require condition](../tests/system-contract.test.ts#L30), [tree-shake](../tests/public-api.test.ts#L43))

## Core Data Model

The library defines one entry shape. `ChatEntry` is a discriminated union over four role-tagged variants — `UserChatEntry`, `AssistantChatEntry`, `ThinkingChatEntry`, `ToolChatEntry` — exported alongside `ChatStreamState` and `ChatErrorInfo` as exactly eight chat type names ([validated by exports exactly the eight chat type names](../tests/types/chat.test.ts#L105)). A fifth role or a streamless assistant entry fails to typecheck ([validated by tsc accepts chat-type-assertions.ts, proving a fifth role and a streamless assistant entry fail to typecheck](../tests/types/chat.test.ts#L75)). No generic `metadata` bag is allowed: the entry types declare no `index`, `devMetadata`, `correlationId`, `timestamp`, or similar property ([validated by declares no property named index, devMetadata, correlationId, traceId, timings, reflection, scores, tenantId, organizationId or timestamp](../tests/types/chat.test.ts#L81)). There is no `User`/`Participant` type and no `Composer State` type.

Other public data shapes are consumer-supplied and rendered as-is: `ConversationListItem` for list rows and `ChatAttribution` for the per-persona display name and avatar resolved by `ChatMessageList`. `ChatComposer` owns its draft internally — the textarea is uncontrolled with no `value`/`onValueChange` prop — and exposes imperative control through a `ChatComposerHandle` ref (`setValue`, `focus`) ([validated by](../tests/ChatComposer.test.tsx#L257), [validated by `two items render two <li>s inside one <ul> named "Conversations" by default, in items order`](../tests/ConversationList.test.tsx#L59), [validated by two assistant entries with two personas render two names and two faces in one conversation](../tests/ChatMessageList.test.tsx#L510), [validated by the textarea is uncontrolled: onChange= is its own binding and no value= or onValueChange prop exists](../tests/ChatComposer.test.tsx#L459)).

### Responsibility Boundary

| Aspect              | Owner                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data fetching       | Consumer ([validated by neither file imports @clerk, swr, next-intl, next/, @/ or lucide-react and every relative import ends in .js](../tests/ChatMessage.test.tsx#L737))                                                                                                                                                                                                                                                 |
| Authentication      | Consumer                                                                                                                                                                                                                                                                                                                                                                                                                   |
| State management    | Consumer ([validated by `GDPR: neither file calls console.*, localStorage, sessionStorage, fetch or sendBeacon`](../tests/ChatMessage.test.tsx#L749))                                                                                                                                                                                                                                                                      |
| Routing             | Consumer                                                                                                                                                                                                                                                                                                                                                                                                                   |
| i18n/localization   | Consumer ([validated by no run of three Latin letters survives outside the sentinels for any labelsProp member](../tests/labelled-exports.test.tsx#L637))                                                                                                                                                                                                                                                                  |
| AI disclosure       | Consumer supplies the string; library forces the required `aiDisclosure` prop ([validated by renders the resolved aiDisclosure outside the role=log region in both states](../tests/ChatMessageList.test.tsx#L174))                                                                                                                                                                                                        |
| Telemetry           | None — the package emits none ([validated by `GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics, and holds no draft persistence`](../tests/ChatComposer.test.tsx#L476))                                                                                                                                                                                                      |
| Component rendering | bowman-ui                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Event callbacks     | bowman-ui (via props)                                                                                                                                                                                                                                                                                                                                                                                                      |
| Styling             | bowman-ui ships `./styles.css` and reads its theme colours through forty-four `--bowman-*` semantic tokens with palette fallbacks; consumer's Tailwind v4 build scans `dist` and may override the tokens ([validated by exports gains "./styles.css" alongside the unchanged "." entry](../tests/styles.test.ts#L106), [source](../tests/tailwind-build.test.ts#L79), [tokens](../tests/theming-tokens-dist.test.ts#L217)) |

## User Roles

1. **Consumer Application Developer** — Integrates bowman-ui into a chat or conversational AI application. Responsible for data flow, authentication, routing, and label provisioning.
2. **bowman-ui Maintainer** — Develops, tests, and publishes components. Ensures TypeScript strict mode, accessibility, and test coverage compliance.
3. **End User** — Interacts with rendered chat UI (messaging, scrolling, composer input); no direct interaction with bowman-ui APIs.

## Business Rules

### Component Design Principles

1. **Presentational Only** — No side effects, API calls, or complex state logic. All behavior is props-driven. ([validated by `GDPR: neither file calls console.*, localStorage, sessionStorage, fetch or sendBeacon`](../tests/ChatMessage.test.tsx#L749), [validated by `GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics`](../tests/ConversationList.test.tsx#L501))
2. **Composability** — Components combine into larger layouts (e.g., `ChatMessage` + `ChatMessageList` + `ChatComposer` form a chat surface; `AppShell` + `AppSidebar` frame it).
3. **Controlled by Default** — Components prefer controlled props; the five shipped hooks are `useDebounce`, `useFocusTrap`, `useFocusGroups`, `useReducedMotion`, and `useSidebarState`. ([validated by npm pack --dry-run ships the five hooks and ErrorBoundary with their d.ts files](../tests/hooks-dist.test.ts#L19))
4. **Stylesheet Ships With the Package** — Components carry Tailwind utility class names; `./styles.css` supplies the four keyframes and markdown/sr-only rules Tailwind cannot generate, and the consumer's Tailwind v4 build scans `dist`. ([validated by exports gains "./styles.css" alongside the unchanged "." entry](../tests/styles.test.ts#L106), [source](../tests/tailwind-build.test.ts#L79))
5. **Minimal Runtime Dependencies** — Only `react-markdown` (`^10.1.0`) and `remark-gfm` (`^4.0.1`) are runtime dependencies; React and React-DOM are peers. ([validated by declares react and react-dom as the only peer dependencies](../tests/system-contract.test.ts#L22), [validated by keeps the runtime dependencies to react-markdown and remark-gfm](../tests/system-contract.test.ts#L39))

### API Stability

1. **Semantic Versioning** — MAJOR.MINOR.PATCH follows semver conventions. ([validated by carries a MAJOR.MINOR.PATCH semver version](../tests/system-contract.test.ts#L18))
2. **Breaking Changes Require Major Version Bump** — Incompatible prop changes, removed components, or signature alterations require a major increment.
3. **Deprecation Path** — Features scheduled for removal are marked with deprecation notices in a minor release; removal occurs in the next major.
4. **Type Safety as Contract** — Public prop interfaces are exported and treated as API; TypeScript changes to props are breaking changes. ([validated by](../tests/public-api.test.ts#L47), [type-assertions](../tests/types/chat-message-type-assertions.tsx#L51))

### Code Quality Mandates

1. **TypeScript Strict Mode** — `tsconfig.json` enforces `strict: true`; all files compile without implicit `any`. ([validated by tsconfig.json enforces strict mode](../tests/system-contract.test.ts#L53))
2. **No Console Logs in Production** — Development aids removed before distribution. ([validated by no built file under dist/ calls console](../tests/system-contract.test.ts#L76))
3. **Accessibility Baseline** — ARIA attributes, semantic HTML, keyboard support, and 4.5:1 color contrast minimum for text. ([validated by](../tests/icons.test.tsx#L178), [validated by focuses the first focusable element when opened](../tests/useFocusTrap.test.tsx#L65))
4. **Test Coverage Floor** — `vitest.config.ts` commits 100 lines/functions/statements/branches over `src/**`, and the contract test guards that no threshold ever drops below 80; props, prop combinations, and user interactions are covered by React Testing Library tests. ([validated by the committed coverage floor is at least 80 on every threshold](../tests/system-contract.test.ts#L61))
5. **ESLint & Prettier Enforcement** — Consistent formatting and linting; CI blocks merge on violations.

### Distribution & Consumption

1. **ESM-Only Distribution** — A single ESM build is published; the `.` export resolves to `dist/index.js` with no `require` condition, so consumers need native ESM or an ESM-aware bundler. ([validated by distributes ESM only: "type" is "module" and the "." export carries no require condition](../tests/system-contract.test.ts#L30))
2. **Stylesheet Subpath Export** — `./styles.css` is a published export and `sideEffects` lists `*.css` so bundlers keep it. ([validated by exports gains "./styles.css" alongside the unchanged "." entry](../tests/styles.test.ts#L106), [side-effects](../tests/styles.test.ts#L113))
3. **Type Definitions Included** — `.d.ts` files are bundled for full TypeScript IDE support. ([validated by npm pack --dry-run ships the five hooks and ErrorBoundary with their d.ts files](../tests/hooks-dist.test.ts#L19))
4. **Tree-Shakeable** — Named exports prioritized; unused components can be eliminated by bundlers. ([validated by](../tests/public-api.test.ts#L43))
5. **No Internal Implementation Details Exposed** — Private modules and helpers are not exported; only public contracts are. ([validated by keeps the mapping function out of the published surface - dist/index.d.ts has no such symbol](../tests/types/chat.test.ts#L218), [L43](../tests/public-api.test.ts#L43))

### Dependency Management

1. **React ^19** — Peer ranges are `^19.0.0`; `AppShell` relies on React 19's boolean `inert` prop. ([validated by](../tests/system-contract.test.ts#L26))
2. **No Breaking Dependency Shifts** — Major dependency updates (e.g., a React major) are coordinated and communicated.
3. **Lock File Committed** — `package-lock.json` is versioned in Git for reproducible installs. ([validated by commits package-lock.json for reproducible installs](../tests/system-contract.test.ts#L43))
4. **Security Updates Prioritized** — npm audit findings addressed promptly; dependabot alerts monitored.

### Git & Release Workflow

1. **Conventional Commits** — Commits follow `<type>(<scope>): <subject>` (feat, fix, refactor, test, docs, chore, ci, style).
2. **Branch Naming** — `<type>/<scope>-<description>` (e.g., `feat/chat-message`, `fix/composer-submit-bug`).
3. **PR Gating** — All CI checks, linting, type-check, and tests must pass before merge.
4. **Minimum 1 Approval** — Code review required before merge.
5. **Git Tags on Release** — The `vX.Y.Z` tag of the GitHub Release alone names the version; `package.json` carries the placeholder `0.0.0` on `main`, and `publish.yml` stamps the tag's version into it at publish time.

## Rendering & Runtime Boundaries

1. **`"use client"` Is Per-File** — The directive is added only to files triggering a client-only rule (a hook-shaped import, `createContext`, a `Component` subclass, a browser global, or an `on[A-Z]` JSX handler); 22 source files carry it and `src/index.ts` carries none. ([validated by exits zero against src/ and dist/](../tests/client-directives.test.ts#L90))
2. **Icons Are Server-Renderable** — The 23 icons are pure SVG and carry no directive, so they push no JS into consumer bundles. ([validated by no file under src/icons carries "use client"](../tests/icons.test.tsx#L124))
3. **Next.js App Router Guarantee** — Because the boundary is per-file, a server component can import the package. ([validated by exits zero against src/ and dist/](../tests/client-directives.test.ts#L90))
4. **Function-Valued Props Cross From `"use client"`** — The package accepts function props (`onSubmit`, `renderSidebar`, `renderLink`, and the rest); React's serialization boundary rejects passing them from a server component, so an App Router consumer supplies them from a `"use client"` file. The RSC fixture build is the executable proof (see docs/design-notes.md § RSC fixture).

## Compliance

1. **GDPR — No Telemetry** — Components call no `console.*`, `localStorage`, `sessionStorage`, `fetch`, or `sendBeacon`, and persist no user content; the package's one storage access is the opt-in `useSidebarState` hook, which persists only the sidebar-open flag in `localStorage` under a consumer-supplied `storagePrefix`. ([validated by `GDPR: neither file calls console.*, localStorage, sessionStorage, fetch or sendBeacon`](../tests/ChatMessage.test.tsx#L749), [composer](../tests/ChatComposer.test.tsx#L476), [list](../tests/ConversationList.test.tsx#L501), [sidebar-state](../tests/useSidebarState.test.tsx#L37))
2. **EU AI Act — AI Disclosure** — `ChatMessageList`'s `aiDisclosure` label is required with no default and renders in every state, so no consumer can render the chat surface without it. ([validated by renders the resolved aiDisclosure outside the role=log region in both states](../tests/ChatMessageList.test.tsx#L174), [type](../tests/types/chat-message-list-type-assertions.tsx#L53))
3. **Markdown URL Policy** — `defaultMarkdownPolicy` allows only `https`/`mailto`/`tel`; `createUrlTransform` drops every other scheme, and dangerous schemes on a link render a hrefless span. ([validated by defaultMarkdownPolicy is the https/mailto/tel, no-relative, new-tab, no-image policy](../tests/markdown/urlPolicy.test.tsx#L33), [xss](../tests/security/markdown-xss.test.tsx#L92))
4. **Markdown HTML Is Inert** — No `rehype-raw` is wired in, so model-authored HTML in markdown renders as literal text rather than live nodes. ([validated by](../tests/security/markdown-xss.test.tsx#L63))

### Model-Authored Content Defaults

Content the model authored renders behind conservative defaults, since it may restate customer identifiers:

1. **Tool Arguments Hidden** — `ToolActivity` defaults `showToolName` and `showToolInput` to `false`, keeping the tool name and arguments out of the DOM; when shown, arguments render as inert text, never HTML. ([validated by defaults false, keeping the tool name out of the document](../tests/ToolActivity.test.tsx#L49), [input](../tests/ToolActivity.test.tsx#L65), [inert](../tests/ToolActivity.test.tsx#L72))
2. **Reasoning Is Inert Text** — `ThinkingTrace` renders its content as plain, collapsed text; markdown and HTML payloads render as inert literal text. ([validated by renders markdown and HTML payloads as inert literal text](../tests/ThinkingTrace.test.tsx#L76))

## Success Metrics

1. **npm Download Rate** — Track `@re-cinq/bowman-ui` weekly/monthly downloads as an adoption indicator.
2. **Type Coverage** — 100% of public API props typed; zero implicit `any` in strict mode. ([validated by](../tests/public-api.test.ts#L47), [system-contract](../tests/system-contract.test.ts#L53))
3. **Test Coverage** — Floor of 100 lines/functions/statements/branches committed in `vitest.config.ts`, guarded at no less than 80 by the contract test; trends monitored per release. ([validated by the committed coverage floor is at least 80 on every threshold](../tests/system-contract.test.ts#L61))
4. **Accessibility Conformance** — Components pass automated a11y tests; manual QA for keyboard navigation and screen reader compatibility.
5. **Issue Resolution SLA** — Critical bugs addressed within 2 weeks; minor issues within 30 days.
6. **Release Cadence** — Stable release every 4–8 weeks; hotfix releases as needed.
7. **Bundle Size** — Monitor minified+gzipped size of distribution per release.
8. **Documentation Completeness** — README, JSDoc, and API docs updated with each feature release.
