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

A release is two acts by a maintainer: publish a GitHub Release, then approve the version npm
has staged. Nothing is bumped, tagged or published by hand, and no pull request is needed for a
version to exist.

1. Releases → **Draft a new release** → _Choose a tag_ → type `vX.Y.Z` → _Create new tag on
   publish_. Patch for fixes, minor for features; 1.0 is a decision, not a side effect.
2. Target `main`, title `vX.Y.Z`, **Generate release notes** (the merged pull requests since the
   previous tag become the notes - keep pull-request titles honest for that reason).
3. Leave _pre-release_ unticked; the workflow refuses pre-releases. **Publish release**.
4. When the `Publish` workflow run is green, approve the staged version: npmjs.com → the
   package page → **Versions** tab → the staged version → **Approve** (2FA is asked for). Or
   from a logged-in terminal with npm 11.15 or newer (`npx -y npm@11 ...` if yours is older):
   `npm stage list @re-cinq/bowman-ui`, then `npm stage approve <id>`; the id is also in the
   workflow run's job summary. Until then the version is on the registry with its provenance
   but not installable, and `npm stage download <id>` hands you the exact tarball to inspect
   first.

The `published` event runs `.github/workflows/publish.yml`: the `verify` job re-runs every gate
at the tag; the `publish` job stamps the tag's version into `package.json`
(`scripts/set-version-from-tag.sh` - on `main` the field is the placeholder
`0.0.0` and is never edited), builds, and runs
`npm stage publish --access public --provenance` over OIDC trusted publishing - staged, because
the trusted publisher deliberately allows no direct `npm publish`: nothing CI does on its own can
make a version installable. npm is the source of truth for versions, and
`npm view @re-cinq/bowman-ui versions` lists them. A tag that repeats a published version fails
at the registry; a failed run on an existing tag is re-run from the Actions tab (`publish.yml` →
_Run workflow_ → the tag). The assistive-technology pass in
[docs/accessibility/README.md](./docs/accessibility/README.md) is a procedure, not a release
gate: run it when you can, commit the record through a pull request, and CI validates its shape.

## Security

Do not open a public issue for a vulnerability. [SECURITY.md](./SECURITY.md) has the private
intake and what is in scope.

## License

By contributing you agree that your contribution is licensed under the
[Apache-2.0](./LICENSE) license that covers the project.
