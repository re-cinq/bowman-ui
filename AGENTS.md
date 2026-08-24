# AGENTS.md

## Context Loading Order

Agents should read repository files in this order:

1. **README.md** — Package purpose, scope, and naming conventions
2. **package.json** — Dependencies, scripts, and version information
3. **tsconfig.json** — TypeScript configuration and compilation targets
4. **.eslintrc** / **eslint.config.js** — Linting rules and code standards
5. **src/** directory structure — Component organization and export patterns
6. **CONTRIBUTING.md** (if present) — Contribution-specific guidelines

## Workflow Commands

### Build

```bash
npm run build
```
Compiles TypeScript components to distributable formats (ESM/CJS). Output typically goes to `dist/`.

### Test

```bash
npm test
```
Runs test suite (Jest or Vitest, default assumption). Watch mode:
```bash
npm test -- --watch
```

### Lint

```bash
npm run lint
```
Runs ESLint on TypeScript and JSX files. Auto-fix:
```bash
npm run lint -- --fix
```

### Type Check

```bash
npm run type-check
```
Runs TypeScript compiler in check-only mode (no emit).

### Deploy

```bash
npm publish
```
Publishes to npm registry. Requires authentication and version bump in `package.json`.

Pre-publish checklist:
- All tests passing
- No linting errors
- TypeScript strict mode compliance
- Git tag matches version (e.g., `v1.0.0`)

## Commit Conventions

Use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` — New component, prop, or feature
- `fix` — Bug fix in component behavior
- `refactor` — Code reorganization without behavioral change
- `test` — Test additions or modifications
- `docs` — README, JSDoc, or guide updates
- `chore` — Dependency updates, build config, tooling
- `ci` — CI/CD configuration changes
- `style` — Formatting only (Prettier, whitespace)

### Scope
Component name or area (e.g., `composer`, `message-list`, `app-shell`).

### Subject
- Imperative mood ("add MessageBubble component", not "added")
- Lowercase start, no period
- Max 50 characters

### Example
```
feat(composer): add rich text formatting toolbar

- Implement bold, italic, code formatting buttons
- Add keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K)
- Support undo/redo via useComposerState hook

Closes #42
```

## PR Requirements

### Before Opening

1. **Branch naming**: `<type>/<scope>-<description>`
   - Examples: `feat/message-bubble`, `fix/composer-submit-bug`
2. **Local verification**:
   ```bash
   npm run lint -- --fix
   npm run type-check
   npm test
   npm run build
   ```
3. **Commits**: Follow Conventional Commits; squash or rebase as needed.

### PR Description Template

```markdown
## Description
Brief explanation of changes.

## Type of Change
- [ ] New component
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing
How to verify this works (manual steps or test output).

## Checklist
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] TypeScript strict mode (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Prop interfaces documented with JSDoc
- [ ] No console warnings or errors
- [ ] Accessibility considerations reviewed
```

### Review Expectations

- Minimum 1 approval required
- All CI checks must pass
- TypeScript errors block merge
- Linting errors block merge
- Test coverage expectations (if configured): maintain or improve

## Compliance Constraints

### Code Quality

1. **TypeScript Strict Mode**: All files must compile with `strict: true`
   - No implicit `any`
   - No unchecked index accesses
   - Proper null/undefined handling

2. **React Best Practices**:
   - Functional components only (hooks-based)
   - Proper dependency arrays in `useEffect`, `useMemo`, `useCallback`
   - No inline object/array literals in render (extract to constants)
   - Memoization of expensive renders via `React.memo` where applicable

3. **Accessibility (a11y)**:
   - ARIA attributes for interactive components (`role`, `aria-label`, `aria-disabled`)
   - Semantic HTML (buttons vs divs, etc.)
   - Keyboard navigation support (Tab, Enter, Escape, Arrow keys)
   - Color contrast ratio ≥ 4.5:1 for text

4. **Props Interface Design**:
   - All props must be typed and exported
   - Required vs optional clearly marked
   - JSDoc comments for each prop explaining purpose and type
   - No `any` types in public APIs

### Documentation

1. **Component JSDoc**:
   ```typescript
   /**
    * MessageBubble renders a single chat message.
    * @param props - Component props
    * @returns React component
    */
   export const MessageBubble: React.FC<MessageBubbleProps> = (props) => { ... }
   ```

2. **README.md** must document:
   - Package purpose and scope
   - Installation instructions
   - Basic usage examples for each exported component
   - Props reference (or link to generated docs)

3. **No internal implementation details exposed** in public API; use `.d.ts` or `export` statement control.

### Dependencies

- **No peer dependency version conflicts** with common React versions (16.8+, 17.x, 18.x)
- **Minimal external dependencies**: Prefer composition over heavy libraries
- **React and React-DOM as peer dependencies** only (not direct dependencies)
- Lock file (**package-lock.json** or **yarn.lock**) must be committed

### Testing

- Unit tests for all exported components
- Props/prop combinations coverage minimum 80%
- Tests use React Testing Library (not Enzyme)
- No snapshot tests without justification

### Build & Distribution

- **ESM and CJS output** (dual module support)
- **Type definitions** included (`*.d.ts`)
- **No console logs** in production builds
- **Tree-shakeable exports**: Use named exports, not default exports where possible

### Security

- No hardcoded secrets, API keys, or credentials
- Sanitize any user-supplied HTML/markdown (if supported by components)
- Keep dependencies updated; address security advisories promptly

### Breaking Changes

- Major version bump required
- Announce in CHANGELOG.md with migration guide
- Deprecation warnings added in minor versions before removal