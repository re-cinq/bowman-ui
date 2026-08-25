# Pull Request

## Why

<!-- Explain the motivation behind this change. What problem does it solve? Why is it important? -->

## What Changed

<!-- Describe the specific changes made. Be concise but complete. -->

-
-
-

## Alternatives Considered

<!-- What other approaches were evaluated? Why was this approach chosen? -->

## ADRs & Architecture

<!-- Reference any Architecture Decision Records (in `/adrs`). Explain design decisions, patterns used, and how this fits into the codebase. -->

## Testing

<!-- Describe how the changes were tested. Include manual testing steps or test output. -->

**Manual Testing:**
<!-- Steps to verify this works locally -->

**Automated Tests:**
<!-- Test coverage, affected test files, or new test additions -->

---

## Checklist

### Code Quality

- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript strict mode passes (`npm run type-check`)
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console warnings or errors in output
- [ ] No hardcoded secrets, API keys, or credentials

### Documentation & Types

- [ ] Component props are typed with JSDoc comments
- [ ] Public API exports are documented
- [ ] Breaking changes noted (if applicable)

### Accessibility & React Best Practices

- [ ] Functional components with proper hooks usage
- [ ] Dependency arrays checked (`useEffect`, `useMemo`, `useCallback`)
- [ ] ARIA attributes present for interactive components (if applicable)
- [ ] Semantic HTML used appropriately

### Before Merge

- [ ] Commits follow Conventional Commits format
- [ ] Branch is up to date with `main`
- [ ] Requested reviewers have approved
