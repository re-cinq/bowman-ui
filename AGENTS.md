# AGENTS.md

## Context Loading Order

Agents should read repository files in the order CLAUDE.md sets (where this file and
CLAUDE.md disagree, CLAUDE.md wins):

1. **README.md** — Package purpose, scope, and naming conventions
2. **docs/design-notes.md** — The decision record every enforced invariant traces to
3. **package.json** — Dependencies, scripts, and version information
4. **specs/<slug>/spec.md** — The feature spec for the area being changed
5. **tsconfig.json** — TypeScript configuration and compilation targets
6. **eslint.config.mjs** — Linting rules and code standards
7. **src/** directory structure — Component organization and export patterns
8. **CONTRIBUTING.md** — Contribution-specific guidelines

## Workflow Commands

### Build

```bash
npm run build
```

Removes `dist/`, compiles the ESM-only package there with the `typescript7` compiler, and copies the stylesheet in. There is no CJS output.

### Test

```bash
npm test
```

Builds first, then runs the Vitest suite under the coverage gate (`npm test` is `npm run build && vitest run --coverage`); the `*-dist` tests read `dist/`. Watch mode, against the last build:

```bash
npx vitest
```

### Lint

```bash
npm run lint
```

Runs ESLint over the TypeScript and JSX sources and over every `*.md` (a repo-relative
markdown link must land on a file; specs and ADRs must open with a lead paragraph). Auto-fix:

```bash
npm run lint -- --fix
```

### Type Check

```bash
npm run typecheck
```

Runs the `typescript7` compiler in check-only mode (no emit), over `tsconfig.json` (src/) and
then `tsconfig.tests.json` (tests/).

### Release

Never `npm publish` or `npm version` by hand. A maintainer drafts a GitHub Release with a `vX.Y.Z` tag and publishes it, then approves the version npm staged (npmjs.com → package page → Versions tab → Approve, with 2FA); that is the whole release. `.github/workflows/publish.yml` fires on the `published` event, re-runs every gate at the tag, stamps the tag's version into `package.json` (`scripts/set-version-from-tag.sh` - on `main` the field is the placeholder `0.0.0`), builds, and runs `npm stage publish` over OIDC trusted publishing with provenance - staged, so nothing CI does alone makes a version installable. No token lives in the repository. The tag decides the number: bump the patch for fixes, the minor for features, and treat 1.0 as a decision.

## Spec Header Table

Every `specs/*/spec.md` must open with its title, then a two-column header
table, then a lead paragraph before the first `##` section. This is the
requirement, not a description of the tree: `npm run lint` fails a spec whose
`Status` row no parser can read, and one that opens straight into a section
with no lead paragraph. That lead paragraph must carry at least 40
characters of prose, or the check reports "no lead paragraph" all the same. The
table replaces the old free-text `Issue:` line, which folds into its `Issue`
row:

```markdown
# <spec title>

| Field  | Value                 |
| ------ | --------------------- |
| Issue  | re-cinq/bowman-ui#<n> |
| Status | Draft                 |

<lead paragraph>
```

`Status` is one of `Draft`, `In Progress` or `Shipped`, and it is not a mood: it
is the spec's own link coverage. No testable statement linked is `Draft`, some
are `In Progress`, all are `Shipped`. ADRs declare theirs as YAML frontmatter
`status:` instead and keep `status: accepted`.

## Spec Checks

Five local commands run over the spec and ADR corpora, four gates and one report:

- `npm run check:spec-links` - every `[validated by]` link must sit in its
  statement's trailing parenthetical. Exit 1 on any finding.
- `npm run reanchor:check` - no `#Lnn` link into a file the branch changed
  may be stale, no `[validated by <test title>]` link anywhere may sit outside
  its test or name a title no test in the cited file carries (`--all`), and
  none may land on a deleted, blank or missing line.
  `npm run reanchor` heals the stale ones. Exit 1 on any finding.
- `npm run lint` - every doc must open with a lead paragraph
  (`re-lint/require-intro-paragraph`) and a spec's status must parse and match
  its coverage (`re-lint/require-status-matches-coverage`).
- `npm run check:spec-status` - every ADR must declare a frontmatter status the
  parsers can read; ADRs are exempt from the coverage tier. Exit 1 on any
  finding.
- `npm run check:spec-status -- --coverage` - lists every testable statement
  carrying no link. A report: it always exits 0.

## Spec Test Links

Statements in `specs/*/spec.md` cite their validating tests with a trailing
`([validated by](../../tests/X.test.tsx#Lnn))` parenthetical at the end of the
statement (a list item is one statement; a paragraph counts per sentence).
Anchors must land on the cited test's `it(`/`describe(` line or another
content-carrying line. A link labelled `[validated by <test title>]` names the
`it()`/`test()` it validates and is re-anchored to that declaration; every other
link is mapped through the cited file's diff hunks since the merge base with
`origin/main`. After editing any cited repository file - a test, a script, a
doc, a workflow, a config - run `npm run reanchor` and commit the result. CI
runs `npm run reanchor:check`: it fails when a link into a file the branch
changed would move, when a titled link into any test file no longer sits in
its test, when the branch deleted or rewrote a cited line (fix the
link by hand), and on anchors landing on blank or closing-punctuation lines. A
link whose href the branch edited by hand is kept as authored - reviewers
verify those targets.
A link only counts where it is trailing, so `npm run check:spec-links` is the
local check for placement: it segments each spec with Lore's own segmentation,
published in `@re-cinq/eslint-plugin-re-lint`, and reports every test link
sitting anywhere else.

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
   npm run typecheck
   npm test
   npm run build
   ```
3. **Commits**: Follow Conventional Commits; squash or rebase as needed.

### PR Description Template

The body follows `.github/PULL_REQUEST_TEMPLATE.md`. Three of its headings are required:
`.github/workflows/pr-description-check.yml` fails a pull request whose body lacks a line
starting `## Why`, `## What Changed` or `## Testing`.

```markdown
## Why

Fixes #<n>. The symptom and the root cause.

## What Changed

- One bullet per change.

## Alternatives Considered

Other approaches evaluated and why this one was chosen (omit if none).

## ADRs & Architecture

Decision records in `adrs/` or `docs/design-notes.md` the change touches (omit if none).

## Testing

The gate commands run and their results (`npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`), plus manual steps where a check cannot see the change.

## Checklist

- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] TypeScript strict mode (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Prop interfaces documented with JSDoc
- [ ] No `console.*` and no network call in `src/` (the test setup traps both)
- [ ] Accessibility considerations reviewed
```

### Review Expectations

- Every change lands through a pull request; `main` takes no direct pushes
- The `build-test`, `consumer` and `rsc` checks must pass
- TypeScript errors block merge
- Linting errors block merge
- Coverage floor: 100% lines, functions, statements and branches over `src/**`

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

2. **README.md** documents:
   - Package purpose and scope
   - Installation instructions
   - Usage examples for the app surfaces (`AppShell`, `AppSidebar`, `ChatComposer`,
     `ChatMessage`, `ChatMessageList`, `ConversationList`) and the hooks; the remaining
     components have no README example, and `examples/chat-demo` is the worked example for them
   - Props through the exported TypeScript interfaces and their JSDoc; there is no generated
     props reference

3. **No internal implementation details exposed** in public API; use `.d.ts` or `export` statement control.

### Dependencies

- **Peer range is `react`/`react-dom` `^19.0.0` only** — the range the components are tested against, not a claim about older majors
- **Minimal external dependencies**: Prefer composition over heavy libraries
- **React and React-DOM as peer dependencies** only (not direct dependencies)
- Lock file (**package-lock.json** or **yarn.lock**) must be committed

### Testing

- Unit tests for all exported components
- Coverage floor: 100% lines, functions, statements and branches over `src/**`
- Tests use React Testing Library (not Enzyme)
- No snapshot tests without justification

### Build & Distribution

- **ESM only** (`"type": "module"`); there is no CJS build
- **Type definitions** included (`*.d.ts`)
- **No console logs** in production builds
- **Tree-shakeable exports**: Use named exports, not default exports where possible

### Security

- No hardcoded secrets, API keys, or credentials
- Sanitize any user-supplied HTML/markdown (if supported by components)
- Keep dependencies updated; address security advisories promptly

### Breaking Changes

- Major version bump required
- Announce in the GitHub Release notes with a migration guide
- Deprecate in the type layer (`@deprecated` JSDoc) in a minor before removal; runtime deprecation warnings are impossible, the console is trapped
