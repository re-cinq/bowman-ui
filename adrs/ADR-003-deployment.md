---
adr_number: 3
title: Distribution and Documentation Publishing
status: accepted
date: 2026-08-24
domains:
  - deployment
  - distribution
  - ci-cd
decision_makers:
  - Loredana Moanga
consulted:
  - Frontend Engineering
---

# ADR-003: Distribution and Documentation Publishing

This ADR records how `bowman-ui` reaches its consumers: the npm registry is the only distribution channel for the package, published from GitHub Actions when a GitHub Release is created, over npm trusted publishing (OIDC) with a provenance attestation and no registry token stored anywhere. The component documentation and the chat fixture are a static site built from the packed tarball and served by GitHub Pages from the same repository. There is no container image, no orchestration and no server, because the library has no runtime backend and its demo has no data. The costs accepted are a release process that depends on a human step (the assistive-technology pass) and a first publish that must bootstrap the trusted publisher with a short-lived token.

## Context

`bowman-ui` is a presentational React component library (`@re-cinq/bowman-ui`) with no server component. It needs a way for consumers to install it, a way for readers to see it running without checking the repository out, and a publish path whose credentials cannot be stolen from the repository. The organisation runs Kubernetes for its services; a library does not need it.

## Decision

### Package distribution: npm, from a GitHub Release

- `files` ships `dist/` (ESM only, with type definitions) and `THIRD-PARTY-NOTICES.md`.
- `.github/workflows/publish.yml` runs when a GitHub Release is published. A credential-free `verify` job re-runs every gate (lint, typecheck, markdown safety, the coverage suite, the consumer and RSC tarball proofs) at the release's tag; only then does the `publish` job, holding `id-token: write` and nothing else, stamp the tag's version into `package.json` (`main` carries the placeholder `0.0.0`; the tag is the version), build, and `npm publish --access public --provenance`.
- Authentication is npm trusted publishing: a trusted publisher registered on npmjs.com for this repository and this workflow file. No `NPM_TOKEN` exists in the repository after the first publish, so push access to `main` is not, transitively, publish access - `guard-main-pushes.yml` treats a direct push to `main` as a security event for the same reason.
- Pre-releases and malformed tags are refused; drafts never fire the workflow.

### Documentation: GitHub Pages, from the packed tarball

- `.github/workflows/pages.yml` builds `examples/chat-demo` the way the consumer check builds it - pack the library, install the tarball by file path, `vite build` under the project base path - and deploys the result with `actions/deploy-pages`. The site is <https://re-cinq.github.io/bowman-ui/>.
- It redeploys on a push to `main` that touches an input of the site (`src/**`, the demo, the manifests, the workflow) and builds without deploying on pull requests touching the same inputs, so a broken site is a red check before it is a broken deployment.
- The demo is static: canned replies, no model call, no backend.

### Not adopted

- No container image and no Kubernetes manifests: there is nothing to run.
- No CDN or serverless distribution: consumers bundle the package into their own applications.

## Rationale

- npm is where React consumers already look; provenance lets them verify that a version was built by this repository's workflow from a public commit.
- Trusted publishing removes the one credential worth stealing. A token in CI secrets would have made every collaborator with write access a publisher.
- GitHub Pages costs nothing to operate, deploys from the same workflow permissions model, and building it from the packed tarball keeps the published documentation an honest consumer of the published package.
- Re-running every gate at the tag, rather than trusting the run that gated the merge, is cheap insurance: a tag can point at anything.

## Consequences

- A release is a human act: someone publishes the Release. The assistive-technology pass is a documented procedure whose record CI validates, not a release gate (decided 2026-09-09; it had made every release hostage to a listening session).
- The very first publish of the package cannot use trusted publishing (npm registers a trusted publisher on a package page that does not exist before version one). It is done once through the same workflow with a short-lived granular token and `--provenance`, after which the token is revoked and the trusted publisher registered.
- Provenance requires a public repository; the package is not published from a private one.

## Alternatives considered

1. **Registry token in CI secrets.** Rejected: every write-access account becomes a publisher, and a leaked token publishes silently.
2. **Publish on tag push.** Rejected in favour of the Release event: a Release carries notes, drafts are harmless, and a stray tag from a local checkout cannot publish.
3. **Container image for the demo.** Rejected: a static site needs no runtime, and a second artifact drifts from the package.

## Related ADRs

- ADR-001: Language and Framework Selection

## References

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Pages with GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
