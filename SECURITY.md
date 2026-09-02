# Security policy

`@re-cinq/bowman-ui` is a presentational React component library. Its attack
surface is the customer's browser, not a server: the components render
model-authored markdown into a customer-facing chat, hold no credential, and
fetch nothing. This policy describes how to report a vulnerability, what to
expect after you do, and which defects are and are not `bowman-ui`'s.

## Reporting a vulnerability

Do not open a public GitHub issue for a vulnerability. A public report tells an
attacker before it tells a maintainer.

Report privately to **security@re-cinq.com** (the org-wide intake settled in
`KU-24`; the same address handles `@re-cinq/hal-engine`, so a reporter never has
to guess which package owns the bug). If you have a minimal reproduction, a
model-authored markdown string that renders an unexpected anchor, image, or
script is worth more than a prose description.

## What to expect

We acknowledge a report within **48 hours**. If you have evidence of active
exploitation, put `ACTIVE EXPLOITATION` in the subject line; those we aim to
acknowledge within **24 hours** and triage ahead of the queue.

We coordinate disclosure: we ask that you give us a reasonable window to ship a
fix before publishing details, and we will credit you in the release notes
unless you ask us not to.

A fix ships as a new npm version of `@re-cinq/bowman-ui` and reaches an OLT
customer only when `support-agent` bumps the dependency and redeploys (see
`107-support-agent-security-advisory-route`); this package publishes no runtime
of its own.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.x     | Yes       |

The package is pre-1.0 and has no maintenance branch: the latest `0.x` published
to npm is the supported line, and a fix lands there rather than as a backport.

## In scope

The markdown rendering path is the primary attack surface. `ChatMessage` renders
model-authored content through `react-markdown` 10 with `remark-gfm` 4, so the
reports this package will actually receive are XSS, sanitizer bypass, and
markdown-pipeline dependency advisories. A report is measured against the
existing controls, which are the security baseline a bypass has to beat:

- **The scheme allowlist** in `src/markdown/urlPolicy.ts`. `defaultMarkdownPolicy`
  is a frozen policy allowing only the `https`, `mailto`, and `tel` schemes, with
  no relative URLs (protocol-relative `//host` and authority-less
  `https:/api/logout` included) and no images. `createUrlTransform` replaces
  react-markdown's default URL filter. The value arrives from micromark
  already percent-encoded — an entity-encoded tab such as `java&#x09;script:`
  becomes `java%09script:` before this function sees it — and the comparison
  never decodes it, so the encoded-tab trick never matches the allowlist. A
  rejected URL renders its link text in a `<span>`, never an anchor.
- **The `rel`/`target` policy.** Every rendered anchor carries
  `rel="noopener noreferrer"`, and `_blank` links open in a new tab with a
  visually-hidden "opens in a new tab" notice (`src/markdown/components.tsx`).
- **The one injection point for consumer strings** is a component's `labels`
  prop. Labels are the only consumer-controlled string surface that reaches the
  DOM; a `labels` value that escapes text rendering is in scope.

In practice, a valid report demonstrates a model-authored markdown string (or a
`labels` value) that produces an anchor, image, script, or navigation the policy
above is meant to refuse.

## Out of scope

- **Authorization and data-boundary defects belong to the consuming application.**
  A `bowman-ui` component renders exactly the `ChatEntry[]` it is handed and
  reports exactly what the user did; it holds no credential, makes no access
  decision, and fetches nothing. Data reaching the wrong customer is an
  authorization defect in the consuming application that assembled the
  data — not a `bowman-ui` vulnerability.
- **Hardening the markdown renderer itself** beyond the documented policy. The
  policy above is the control; proposals to change it are feature requests, not
  vulnerabilities, unless they demonstrate a bypass of the current behavior.
- **Findings in a consuming application's own code, infrastructure, or
  deployment**, which this library does not control.
