# Contributing

`@re-cinq/bowman-ui` is a small, deliberately closed component library, and most of the rules
below exist to keep it that way. Read [README.md](./README.md) and
[docs/design-notes.md](./docs/design-notes.md) first: every enforced invariant traces to a
numbered decision there, and a pull request that fights one of them will be asked to argue with
the decision, not with the check.

## Setup

Node 22 (`.nvmrc`), npm.

```sh
npm ci
npm run lint
npm run typecheck
npm test
```

`npm test` builds first; the built-output tests read `dist/`.

## Branches, commits, pull requests

- Branch from `main` as `<type>/<scope>-<description>`, for example `fix/composer-submit-bug`.
- Commit messages follow Conventional Commits: `<type>(<scope>): <subject>`, imperative,
  lowercase, at most 50 characters. Types are `feat`, `fix`, `refactor`, `test`, `docs`, `chore`,
  `ci`, `style`. The scope is the component or area.
- Every change lands through a pull request; `main` takes no direct pushes. Fill in the pull
  request template.

## What a pull request must pass

CI runs these on every pull request, and they are the same commands you run locally:

- `npm run lint` at zero warnings, `npm run prettier:check`, `npm run typecheck`.
- `npm test`, under a coverage floor of 100% lines, functions and statements and 90% branches
  over `src/**`. The floor is never lowered casually.
- The repository's own checks: `npm run check:markdown-safety`, `npm run check:duplication`,
  `npm run check:spec-links`, `npm run check:spec-status`, and the client-directive and
  forbidden-import scripts under `scripts/`.
- The packed-tarball proofs: `npm run consumer` (the Vite example under a real browser) and
  `npm run rsc` (the App Router fixture).

Two habits the checks will otherwise teach you the slow way:

- After editing any file a spec cites - a test, a script, a doc, a workflow, a config - run
  `node scripts/repoint-spec-anchors.mjs` so the `[validated by](...#Lnn)` anchors in
  `specs/*/spec.md` follow the lines they point at. CI runs it with `--check`.
- The public API is a committed snapshot (`tests/fixtures/public-api.json`). A test failing
  against it is telling you a surface changed; regenerating the snapshot is a release decision,
  not a fix.

## Releases

Never `npm publish` by hand. Bump `version` in `package.json` through a pull request, then
publish a GitHub Release whose tag is `v<version>`; `.github/workflows/publish.yml` re-runs
every gate at that tag and publishes to npm over OIDC trusted publishing with provenance.
The assistive-technology pass in
[docs/accessibility/README.md](./docs/accessibility/README.md) is a procedure, not a release
gate: run it when you can, commit the record through a pull request, and CI validates its shape.

## Security

Do not open a public issue for a vulnerability. [SECURITY.md](./SECURITY.md) has the private
intake and what is in scope.

## License

By contributing you agree that your contribution is licensed under the
[Apache-2.0](./LICENSE) license that covers the project.
