---
adr_number: 1
title: Language and Framework Selection
status: accepted
date: 2026-08-24
domains:
  - technology
  - frontend
  - build-system
---

# ADR-001: Language and Framework Selection

## Context

`bowman-ui` is a new component library project extracted from an internal application, intended to provide reusable presentational React components for AI chat interfaces. The project needed to select a primary language and framework to establish the technical foundation for development, build, and distribution.

## Decision

We have chosen **TypeScript** as the primary language and **React** as the UI framework, with a Node.js/npm-based build and distribution setup.

## Rationale

### React Framework
- **Proven fit**: The project explicitly targets "props-driven chat UI building blocks," which is React's core strength. React's component model aligns perfectly with a presentational component library.
- **Ecosystem maturity**: React has extensive tooling, testing frameworks (React Testing Library, Jest), and component documentation ecosystems (Storybook).
- **Extraction origin**: Components are extracted from an existing internal application, likely already React-based, minimizing rewrite risk and leveraging existing patterns.
- **Library distribution**: React components are trivial to package and publish to npm for public consumption.
- **Consumer flexibility**: React's prevalence means this library will be useful to the broadest audience.

### TypeScript
- **Type safety**: A component library's primary contract is its API surface. TypeScript provides compile-time verification that consumers use components correctly.
- **Documentation value**: Type definitions serve as inline documentation for component props, reducing friction for library users.
- **Refactoring confidence**: Strong typing enables safe refactoring of internal implementation without breaking consumers unintentionally.
- **Developer experience**: IDE autocomplete and error checking significantly improve the experience for library consumers.

### Node.js / npm
- **Standard distribution**: npm is the de facto registry for JavaScript libraries, essential for publishing a public component library.
- **Tooling ecosystem**: Industry-standard tools (Webpack, Vite, TypeScript compiler, Jest, ESLint, Prettier) are all npm-based.
- **CI/CD integration**: Automated testing, linting, and release workflows integrate seamlessly with npm and GitHub Actions.

## Consequences

### Positive
- Clear, predictable developer experience for consumers using npm-based stacks.
- Strong type safety reduces surface-area bugs in a public library.
- Large ecosystem of testing and documentation tooling available.
- Easy to add Storybook or similar for interactive component documentation.

### Constraints
- Target audience is primarily React/Node.js developers. Non-React frameworks must consume components as compiled JavaScript/types.
- Build toolchain complexity managed through standard abstractions (tsconfig, webpack/vite config).
- Maintenance burden falls on Node.js ecosystem best practices.

## Alternatives Considered

### Vue or Svelte
- Smaller ecosystems; less likely to match internal application context.
- Would fragment the component library across frameworks unnecessarily.

### Python/FastAPI or Java/Spring
- Misaligned with "presentational components" scope; backend frameworks add unnecessary runtime overhead.
- Distribution and consumption model would be cumbersome for UI components.

### Plain JavaScript (no TypeScript)
- Loss of type safety for library API surface; higher friction for consumers.
- Reduced IDE support and documentation value.

## Related Decisions
- ADR-002: Build tooling and bundler selection (to follow).
- ADR-003: Testing and documentation strategy (to follow).