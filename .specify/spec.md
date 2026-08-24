# bowman-ui System Specification

## Overview

bowman-ui is a presentational React component library for building AI chat interfaces. It provides props-driven UI building blocks extracted from an internal application, with no dependencies on authentication, data-fetching, routing, or internationalization. The library positions itself as "the face" to complement HAL (the engine), serving as a reusable foundational layer for chat-based AI applications.

**Status**: Repository bootstrap phase. Core components are being delivered through the E3 epic issues.

## Key Capabilities

### Component Categories
- **Message Rendering**: Display individual chat messages with formatting support
- **Composer**: Input interface for users to compose and send messages
- **Conversation Management**: List and navigation of conversations/threads
- **App Shell**: Container/layout component for chat application structure

### Design Philosophy
- Props-driven architecture: Components accept all data and labels as props
- No internal state management or side effects beyond UI interaction
- Consumers (applications) are responsible for:
  - Data fetching and management
  - Authentication and authorization
  - Routing between conversations
  - Text localization/internationalization
  - Styling and theming (via props)

### Distribution Format
- Dual module support (ESM and CJS)
- TypeScript type definitions included
- Tree-shakeable exports using named exports
- Minimal external dependencies

## Core Data Model

### Component Props Architecture

Components follow a consistent props-driven pattern where consumers supply:

1. **Message Data**
   - Content/text
   - Author/sender information
   - Timestamps
   - Message type/status (sent, received, loading, error)

2. **Composer Data**
   - Placeholder text/labels
   - Submit handler callback
   - Initial value (optional)
   - Formatting options (if supported)

3. **Conversation List Data**
   - List of conversation objects with metadata
   - Selection/active state management
   - Click handlers for navigation

4. **UI Configuration**
   - All user-visible strings passed as props (supports i18n)
   - Theme/styling via className or CSS variable props
   - Accessibility labels (aria-label, aria-describedby, etc.)

### No Internal Data Persistence
- Components do not maintain conversation history
- Components do not cache or store messages
- All state relevant to rendering is provided via props

## User Roles

### Primary User: Application Developer
- Integrates bowman-ui components into their chat application
- Provides all data, labels, and handlers to components
- Manages routing, authentication, and data fetching separately
- Controls styling/theming via component props

### Secondary User: End User (Chat Application User)
- Interacts with rendered chat interface
- Sends/receives messages
- Manages conversations through provided UI
- No awareness of bowman-ui as a library

## Business Rules

### Functional Requirements
1. Components must render correctly given any valid props
2. All exported components must be TypeScript strict mode compliant
3. Components must support keyboard navigation (Tab, Enter, Escape, Arrow keys)
4. Interactive elements must be semantically correct HTML (buttons vs divs, etc.)
5. Accessible by WCAG AA standards (color contrast ≥4.5:1, ARIA attributes)

### Non-Functional Requirements
1. **Zero External Coupling**
   - No authentication mechanism
   - No HTTP/API layer
   - No routing integration
   - No i18n framework dependency
   - React 16.8+ and React-DOM as peer dependencies only

2. **Code Quality Standards**
   - TypeScript strict: true mode mandatory
   - All public APIs fully typed (no `any`)
   - JSDoc comments on all exported components and props
   - Functional components with hooks only
   - Proper dependency arrays in useEffect/useMemo/useCallback

3. **Accessibility Compliance**
   - All interactive components have ARIA attributes
   - Keyboard navigation fully supported
   - Semantic HTML throughout
   - Color contrast ratios enforced

4. **Dependency Management**
   - Minimal external dependencies
   - No version conflicts with React 16.8+, 17.x, 18.x
   - Lock file (package-lock.json or yarn.lock) committed

5. **Distribution**
   - ESM and CJS dual output
   - Type definitions (*.d.ts) included
   - No console logs in production builds
   - Named exports for tree-shaking

### Breaking Change Policy
- Major version bump required for breaking changes
- Migration guide provided in CHANGELOG.md
- Deprecation warnings added in minor versions before removal

## Success Metrics

### Development Metrics
- **Build Success**: `npm run build` produces error-free ESM/CJS output
- **Code Quality**: 
  - `npm run lint` passes with zero errors
  - `npm run type-check` produces no TypeScript errors
  - `npm test` passes with ≥80% coverage on exported components
- **Compliance**: All PRs pass CI checks before merge

### Functional Metrics
- **Component Completeness**: All components in E3 epic delivered with full props API
- **Documentation**: Each component has JSDoc and usage examples in README
- **Type Safety**: 100% of public APIs fully typed in strict mode

### Adoption Metrics
- **npm Registry**: Successfully published and installable
- **Peer Dependency Compatibility**: Works with React 16.8+, 17.x, 18.x
- **Consumer Integration**: Applications can use components with minimal additional dependencies

### Quality Metrics
- **Accessibility**: All components pass WCAG AA automated checks
- **Test Coverage**: Minimum 80% coverage on props and prop combinations
- **Security**: No hardcoded secrets; dependencies regularly updated

## Constraints & Assumptions

### Out of Scope
- Styling/CSS framework (components accept className/style props)
- State management (Redux, Zustand, etc.)
- Data fetching libraries
- Authentication/authorization logic
- Routing implementation
- Message formatting engines (Markdown, rich text)

### In Scope
- Semantic HTML and accessibility attributes
- Keyboard event handling and focus management
- Component composition patterns for extensibility
- TypeScript strict mode compliance
- Unit test coverage

### Architecture Assumptions
1. Consumers will wrap bowman-ui components in their own state management
2. All data flows unidirectionally (props down, callbacks up)
3. Styling is handled by consumers via CSS classes or inline styles
4. i18n strings are prepared by consumers before passing to components