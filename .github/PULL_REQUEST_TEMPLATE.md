# Pull Request Template

## Why
<!-- Explain the motivation and context for this change. What problem does it solve? -->

## What Changed
<!-- Describe the changes made in this PR. Include key implementation details. -->

## Alternatives Considered
<!-- What other approaches were evaluated? Why was this solution chosen? -->

## ADRs & Architecture
<!-- Reference any Architecture Decision Records (ADRs) in the `adrs/` directory. Explain any architectural decisions or patterns introduced by this change. -->

## Testing
<!-- Describe how this change was tested. Include manual testing steps, test cases added, or links to test output. -->

---

## Checklist

### Code Quality
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript strict mode passes (`npm run type-check`)
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)

### Security & Best Practices
- [ ] No secrets, API keys, or credentials included
- [ ] No console warnings or errors
- [ ] No `any` types in public APIs
- [ ] React best practices followed (functional components, proper dependency arrays)

### Documentation & Types
- [ ] JSDoc comments added for new exports
- [ ] Props interfaces are fully typed and documented
- [ ] README.md updated (if applicable)
- [ ] Accessibility (a11y) considerations reviewed

### Before Merging
- [ ] Branch naming follows convention (`<type>/<scope>-<description>`)
- [ ] Commits follow Conventional Commits format
- [ ] All CI checks pass
- [ ] Minimum 1 approval received