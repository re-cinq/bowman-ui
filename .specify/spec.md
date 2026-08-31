# bowman-ui System Specification

## Overview

**bowman-ui** is a presentational React component library providing UI building blocks for AI chat interfaces. It is extracted from an internal application and published as `@re-cinq/bowman-ui` on npm ([validated by](../tests/system-contract.test.ts#L14)). The library delivers props-driven, composable React components with no built-in authentication, data-fetching, routing, or internationalization (i18n) dependencies ([validated by](../tests/ChatMessage.test.tsx#L609), [system-contract](../tests/system-contract.test.ts#L39)). Consumers are responsible for supplying data and labels; the components render them according to received props ([validated by](../tests/labelled-exports.test.tsx#L499)).

**Naming convention**: HAL is the conversational engine; Bowman is the presentational face (the UI).

**Current status**: Repository bootstrap phase. Package skeleton, build contracts, and component implementations are being delivered incrementally through the E3 epic issues.

## Key Capabilities

1. **Message Rendering** — Display individual chat messages in configurable bubble/card layouts ([validated by](../tests/ChatMessage.test.tsx#L49))
2. **Composer** — Text input and submission interface for user messages with optional formatting toolbar ([validated by](../tests/ChatComposer.test.tsx#L31))
3. **Conversation List** — Render conversation threads or chat history with selection/navigation ([validated by](../tests/ConversationList.test.tsx#L33))
4. **App Shell** — Top-level application layout container (header, sidebar, main content area) ([validated by](../tests/AppShell.test.tsx#L22))
5. **Props-Driven Architecture** — All behavior configured via React props; no internal state management or API calls ([validated by](../tests/ChatMessage.test.tsx#L628), [L353](../tests/ChatComposer.test.tsx#L353))
6. **Type-Safe API** — Full TypeScript support with strict mode compliance; no implicit `any` types in public interfaces ([validated by](../tests/public-api.test.ts#L46), [system-contract](../tests/system-contract.test.ts#L52), [list-type-assertions](../tests/types/chat-message-list-type-assertions.tsx#L36))
7. **Accessibility** — ARIA attributes, semantic HTML, keyboard navigation, and color contrast compliance ([validated by](../tests/icons.test.tsx#L152), [L47](../tests/AppShell.test.tsx#L47), [L72](../tests/useFocusTrap.test.tsx#L72))
8. **ESM-Only Distribution** — Single ESM output (`"type": "module"`) targeting modern bundlers and runtimes; no CommonJS build ([validated by](../tests/system-contract.test.ts#L30))
9. **Tree-Shakeable Exports** — Named exports enable dead-code elimination in consuming applications ([validated by](../tests/public-api.test.ts#L40))

## Core Data Model

Components operate on simple, consumer-supplied data structures passed via props ([validated by](../tests/types/chat.test.ts#L182)). No internal data model is imposed; the library is strictly presentational ([validated by](../tests/types/chat.test.ts#L95)).

### Typical Data Shapes (Consumer-Defined)

- **Message**: `{ id, role, content, timestamp?, metadata? }`
- **Conversation**: `{ id, title, messages[], lastUpdated?, participants? }`
- **User/Participant**: `{ id, name, avatar?, role? }`
- **Composer State**: `{ text, attachments?, isSubmitting? }`

### Responsibility Boundary

| Aspect              | Owner                                         |
| ------------------- | --------------------------------------------- |
| Data fetching       | Consumer                                      |
| Authentication      | Consumer                                      |
| State management    | Consumer                                      |
| Routing             | Consumer                                      |
| i18n/localization   | Consumer                                      |
| Component rendering | bowman-ui                                     |
| Event callbacks     | bowman-ui (via props)                         |
| Styling/theming     | Typically consumer (or CSS-in-JS integration) |

## User Roles

1. **Consumer Application Developer** — Integrates bowman-ui into a chat or conversational AI application. Responsible for data flow, authentication, routing, and label provisioning.
2. **bowman-ui Maintainer** — Develops, tests, and publishes components. Ensures TypeScript strict mode, accessibility, and test coverage compliance.
3. **End User** — Interacts with rendered chat UI (messaging, scrolling, composer input); no direct interaction with bowman-ui APIs.

## Business Rules

### Component Design Principles

1. **Presentational Only** — No side effects, API calls, or complex state logic in components. All behavior is props-driven. ([validated by](../tests/ChatMessage.test.tsx#L628), [L403](../tests/ConversationList.test.tsx#L403))
2. **Composability** — Components combine to form larger layouts (e.g., MessageBubble + ConversationList + Composer form a complete chat interface).
3. **Stateless by Default** — Components prefer controlled props over internal state; optional hooks (e.g., `useComposerState`) available for convenience. ([validated by](../tests/AppShell.test.tsx#L146))
4. **No Opinion on Styling** — Components output semantic HTML and ARIA; styling is consumer responsibility (CSS, Tailwind, CSS-in-JS, etc.). ([validated by](../tests/tailwind-build.test.ts#L75))
5. **No Hard Dependencies on External Libraries** — React and React-DOM are peer dependencies; other packages should be minimal. ([validated by](../tests/system-contract.test.ts#L22), [L39](../tests/system-contract.test.ts#L39))

### API Stability

1. **Semantic Versioning** — MAJOR.MINOR.PATCH follows semver conventions. ([validated by](../tests/system-contract.test.ts#L18))
2. **Breaking Changes Require Major Version Bump** — Incompatible prop changes, removed components, or signature alterations require version major increment.
3. **Deprecation Path** — Features scheduled for removal are marked with deprecation warnings in a minor release; removal occurs in the next major.
4. **Type Safety as Contract** — Public component prop interfaces are exported and treated as API; TypeScript changes to props are breaking changes. ([validated by](../tests/public-api.test.ts#L46), [type-assertions](../tests/types/chat-message-type-assertions.tsx#L45))

### Code Quality Mandates

1. **TypeScript Strict Mode** — `tsconfig.json` enforces `strict: true`; all files must compile without implicit `any`. ([validated by](../tests/system-contract.test.ts#L52))
2. **No Console Logs in Production** — Development aids removed before distribution. ([validated by](../tests/system-contract.test.ts#L72))
3. **Accessibility Baseline** — ARIA attributes, semantic HTML, keyboard support, and 4.5:1 color contrast minimum for text. ([validated by](../tests/icons.test.tsx#L152), [L72](../tests/useFocusTrap.test.tsx#L72))
4. **Test Coverage ≥80%** — Props, prop combinations, and user interactions covered by React Testing Library tests. ([validated by](../tests/system-contract.test.ts#L59))
5. **ESLint & Prettier Enforcement** — Consistent code formatting and linting; CI blocks merge on violations.

### Distribution & Consumption

1. **ESM-Only Distribution** — A single ESM build is published; the `.` export resolves to `dist/index.js` with no `require` condition, so consumers need native ESM or an ESM-aware bundler. ([validated by](../tests/system-contract.test.ts#L30))
2. **Type Definitions Included** — `.d.ts` files bundled with package for full TypeScript IDE support. ([validated by](../tests/hooks-dist.test.ts#L52))
3. **Tree-Shakeable** — Named exports prioritized; unused components can be eliminated by bundlers. ([validated by](../tests/public-api.test.ts#L40))
4. **No Internal Implementation Details Exposed** — Private modules, helper functions, and implementation utilities not exported; only public component contracts exposed. ([validated by](../tests/types/chat.test.ts#L226), [L40](../tests/public-api.test.ts#L40))

### Dependency Management

1. **React ^19** — Hooks-based architecture requires React 19 via the `^19.0.0` peer ranges; AppShell relies on React 19's boolean `inert` prop. ([validated by](../tests/system-contract.test.ts#L26))
2. **No Breaking Dependency Shifts** — Major dependency updates (e.g., React major version) coordinated and clearly communicated.
3. **Lock File Committed** — `package-lock.json` or `yarn.lock` versioned in Git for reproducible installs. ([validated by](../tests/system-contract.test.ts#L43))
4. **Security Updates Prioritized** — Npm audit findings addressed promptly; dependabot alerts monitored.

### Git & Release Workflow

1. **Conventional Commits** — All commits follow `<type>(<scope>): <subject>` format (feat, fix, refactor, test, docs, chore, ci, style).
2. **Branch Naming** — `<type>/<scope>-<description>` (e.g., `feat/message-bubble`, `fix/composer-submit-bug`).
3. **PR Gating** — All CI checks, linting, type-check, and tests must pass before merge.
4. **Minimum 1 Approval** — Code review required before merge.
5. **Git Tags on Release** — Version tag (e.g., `v1.0.0`) created on release commit; matches `package.json` version.

## Success Metrics

1. **npm Download Rate** — Track `@re-cinq/bowman-ui` weekly/monthly downloads as indicator of adoption.
2. **Type Coverage** — 100% of public API props typed; zero implicit `any` in strict mode. ([validated by](../tests/public-api.test.ts#L46), [system-contract](../tests/system-contract.test.ts#L52))
3. **Test Coverage** — Minimum 80% line/branch coverage reported by coverage tool; trends monitored per release. ([validated by](../tests/system-contract.test.ts#L59))
4. **Accessibility Conformance** — Components pass automated a11y tests (axe, Lighthouse); manual QA for keyboard navigation and screen reader compatibility.
5. **Issue Resolution SLA** — Critical bugs (type errors, accessibility failures, breaking changes) addressed within 2 weeks; minor issues within 30 days.
6. **Release Cadence** — Stable release every 4–8 weeks; hotfix releases as needed for critical bugs.
7. **Bundle Size** — Monitor minified+gzipped size of distribution; growth tracked and justified per release.
8. **Documentation Completeness** — README, JSDoc, and API documentation updated with each feature release; zero "undocumented prop" complaints.
9. **Developer Experience** — DX surveys or feedback; ease of integration, clarity of examples, and IDE/TypeScript support.
10. **GitHub Issues/PRs Responsiveness** — Average time to first response on issues <48 hours; PRs reviewed within 1 week.
