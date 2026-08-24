# bowman-ui System Specification

## Overview

**bowman-ui** is a React component library providing presentational building blocks for AI chat interfaces. It is a props-driven, dependency-minimal UI toolkit extracted from an internal application, designed to be consumed by applications that handle authentication, data-fetching, routing, and internationalization independently.

The package delivers reusable, accessible chat UI components without enforcing architectural patterns or external service integrations. Consumers supply data and labels; components render them.

**Maturity**: Repository bootstrap phase. Package skeleton, build contract, and core components are being landed through structured epic issues (E3 project).

**Naming Context**: HAL is the inference engine; Bowman is the user-facing interface.

---

## Key Capabilities

### Component Categories

1. **Message Rendering**
   - Single message bubble component with support for different message types
   - Handles sender attribution, timestamps, and styling variants

2. **Composer / Input**
   - Text input component for composing messages
   - Submit action handling via props callbacks
   - State management hooks for composition flow

3. **Conversation List**
   - List view of conversations or message threads
   - Selection and navigation support
   - Minimal styling; consumer-provided themes apply

4. **App Shell**
   - Layout container for chat UI assembly
   - Slots for header, sidebar, main content, footer
   - No routing or state management imposed

5. **Utility Hooks**
   - Composition state management (e.g., `useComposerState`)
   - Message list scrolling and lifecycle hooks

### Design Constraints

- **No Authentication**: Components assume user context is provided by consumer
- **No Data Fetching**: All data passed as props; no API calls within components
- **No Routing**: Navigation callbacks are prop-driven; router integration is consumer's responsibility
- **No i18n**: Labels and strings supplied by consumer
- **Accessibility-First**: All interactive components support keyboard navigation, ARIA attributes, and semantic HTML
- **TypeScript Strict Mode**: All components strictly typed; no implicit `any`
- **Minimal Dependencies**: React and React-DOM as peer dependencies only; no heavy utility libraries bundled

---

## Core Data Model

### Component Props Philosophy

Components accept data as plain JavaScript objects with typed interfaces:

```typescript
interface MessageBubbleProps {
  // Message content and metadata
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp?: Date;
  variant?: 'sent' | 'received';
  
  // Callbacks for interactions
  onEdit?: (id: string, newText: string) => void;
  onDelete?: (id: string) => void;
  
  // Styling customization (className or style props)
  className?: string;
}

interface ComposerProps {
  // Controlled input value
  value: string;
  onChange: (text: string) => void;
  
  // Actions
  onSubmit: (text: string) => void;
  
  // State
  isLoading?: boolean;
  isDisabled?: boolean;
  
  // Customization
  placeholder?: string;
}

interface ConversationListProps {
  // Data
  conversations: Array<{
    id: string;
    title: string;
    lastMessage?: string;
    timestamp?: Date;
  }>;
  
  // Selection state
  selectedId?: string;
  onSelect: (id: string) => void;
}
```

### Data Flow Pattern

- **Parent owns state**: Consumer application manages conversation data, user state, message history
- **Components are presentational**: Props in, callbacks out
- **No internal fetching**: Components do not make API calls or manage async loading (consumer handles via props `isLoading`, etc.)

---

## User Roles

### Primary Consumer Roles

1. **Frontend Application Developer**
   - Builds chat UIs using bowman-ui components
   - Manages authentication, routing, API integration independently
   - Supplies data and labels via props
   - Applies theme/styling via CSS modules, Tailwind, CSS-in-JS, etc.

2. **Design System Maintainer**
   - Customizes component styling without modifying exported interfaces
   - May wrap bowman-ui components with design tokens
   - Enforces accessibility standards

3. **End User (Implicit)**
   - Interacts with assembled chat UI in consumer application
   - Benefits from accessibility features and responsive design

---

## Business Rules

### Component Behavior

1. **Message Rendering**
   - Messages display in sender-attributed bubbles
   - Timestamps and metadata are optional but recommended for clarity
   - Edit/delete actions are callback-driven; no internal state mutation

2. **Composer Submission**
   - Submit action fires only on valid input (non-empty text)
   - Loading state prevents multiple submissions
   - Consumers clear input via `onChange` callback after submission
   - Character limits and validation are consumer's responsibility

3. **Conversation List**
   - Single-selection model (one conversation active at a time)
   - Selection state is read-only from component perspective (props-driven)
   - List reorders/filters are consumer's responsibility

4. **Keyboard Navigation**
   - All buttons support Enter and Space activation
   - Composer supports Shift+Enter for newlines (configurable)
   - Message bubbles support Tab navigation for edit/delete actions
   - Escape key closes interactive overlays

5. **Accessibility (a11y)**
   - Interactive elements have ARIA labels and roles
   - Color contrast meets WCAG AA standards (4.5:1 for text)
   - Semantic HTML used (buttons, nav, main, etc.)
   - Focus management visible and logical

### Error Handling

- Components do not throw; they accept error state via props
- Error messages supplied by consumer (no built-in error UI)
- Components gracefully degrade with missing optional props

### Performance

- Components use `React.memo` for expensive renders
- Dependency arrays properly constructed to prevent unnecessary re-renders
- No inline object/array literals in render; constants extracted
- Message lists support virtualization at consumer level (if needed)

---

## Success Metrics

### Technical Metrics

1. **Build & Distribution**
   - Successful ESM and CJS dual-module output
   - Type definitions included and accurate
   - Tree-shakeable exports (named exports prioritized)
   - Bundle size < 50KB (gzipped) target for core components

2. **Code Quality**
   - 100% TypeScript strict mode compliance
   - Zero linting errors (ESLint configured)
   - 80%+ test coverage for exported components
   - All tests passing with React Testing Library

3. **Accessibility**
   - WCAG 2.1 Level AA conformance for all components
   - Keyboard navigation fully supported
   - Screen reader tested and announced correctly
   - No axe violations in automated audits

4. **Performance**
   - Component renders < 16ms on modern hardware (60fps target)
   - No memory leaks in hook cleanup
   - Memoization applied where rendering cost is high

### Business Metrics

1. **Adoption**
   - Successful integration into internal application (HAL+Bowman pairing)
   - Community contributions and issue resolution time < 7 days

2. **Documentation**
   - README covers all exported components with usage examples
   - JSDoc complete for all props and exported functions
   - CONTRIBUTING.md provides clear contribution workflow

3. **Stability**
   - Zero breaking changes without major version bump
   - Semantic versioning followed consistently
   - Deprecation warnings added before removal

4. **Maintainability**
   - CI/CD pipeline green for all PR commits
   - Pre-publish checklist enforced (tests, lint, types, build)
   - Lock file committed and synchronized across contributors

---

## Compliance Constraints

### Enforced Standards

- **TypeScript**: `strict: true`, no implicit `any`, proper null/undefined handling
- **React**: Functional components only, proper hook dependency arrays, no inline literals
- **Linting**: ESLint configuration applied, all errors block PR merge
- **Testing**: React Testing Library only, 80%+ coverage target
- **Build**: ESM + CJS output, `.d.ts` type definitions included
- **Dependencies**: React/ReactDOM peer dependencies only, no direct dependency conflicts

---

## Architecture Notes

### Repository Structure (Expected)

```
bowman-ui/
├── src/
│   ├── components/
│   │   ├── MessageBubble.tsx
│   │   ├── Composer.tsx
│   │   ├── ConversationList.tsx
│   │   └── AppShell.tsx
│   ├── hooks/
│   │   └── useComposerState.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts (main export)
├── tests/
│   └── *.test.tsx
├── .eslintrc.js
├── tsconfig.json
├── package.json
└── README.md
```

### Export Pattern

Named exports only for components and hooks; no default exports (tree-shaking friendly).

```typescript
export { MessageBubble } from './components/MessageBubble';
export { Composer } from './components/Composer';
export { useComposerState } from './hooks/useComposerState';

export type { MessageBubbleProps } from './components/MessageBubble';
export type { ComposerProps } from './components/Composer';
```