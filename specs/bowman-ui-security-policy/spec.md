# bowman-ui security policy

Issue: issue 125 (`125-bowman-ui-security-disclosure`), part of issue 57. This spec
records the decisions behind `SECURITY.md`, the README `## Security` section, `package.json`'s
`bugs` field, and `.github/ISSUE_TEMPLATE/config.yml`'s security `contact_links` entry - a policy
document, not a shipped API. A statement about a human commitment (a response-time target) or
about another repository's code (a consuming application's own authorization logic) carries no
validated-by link: nothing in this repository's test suite can assert either one, so each such
section says so once and moves on.

## Reporting route

Vulnerability reports go to **security@re-cinq.com**, not a public GitHub issue - the org-wide
intake settled in `KU-24`, shared with `@re-cinq/hal-engine` so a reporter never has to pick the
right repository. `.github/ISSUE_TEMPLATE/config.yml` steers a public "I found a bug" click at the
same address instead of a template that would invite a public disclosure. This is a routing
decision, not a runtime behavior; it carries no validated-by link.

## Acknowledgement targets (provisional)

A report is acknowledged within **48 hours**; a report flagged `ACTIVE EXPLOITATION` in the
subject line is acknowledged within **24 hours** and triaged ahead of the queue. Both numbers are
provisional: `@re-cinq/hal-engine` owns the org-wide disclosure policy this package's numbers are
meant to converge with, and that policy does not exist yet. This is a commitment about human
response time, so it carries no validated-by link.

## Supported versions

The `0.x` line published to npm is the only supported line - the package is pre-1.0, has no
maintenance branch, and a fix lands on the latest published `0.x` rather than as a backport.
Nothing in `src/` reads a semver range to decide what gets patched, so this too carries no
validated-by link.

## In scope: the markdown rendering path, measured against its controls

`ChatMessage` renders model-authored content through `react-markdown` 10 and `remark-gfm` 4, so a
report is measured against the controls already in `src/markdown/urlPolicy.ts` and
`src/markdown/components.tsx`, not against a fresh audit:

- **The scheme allowlist rejects everything outside `https`, `mailto`, `tel`, and every relative
  form, without decoding first.** `http`, `irc`, `xmpp`, `javascript:`, `data:`, `vbscript:`,
  `/api/logout`, `../admin` and `#anchor` all render their link text in a `<span>`, never an
  anchor, and no `a[href=""]` appears
  ([validated by](../../tests/markdown/urlPolicy.test.tsx#L53)). Case variation and entity
  encoding do not get past the allowlist either - `java&#x09;script:` arrives already
  percent-encoded as `java%09script:`, and the comparison never decodes it
  ([validated by](../../tests/markdown/urlPolicy.test.tsx#L71)).
- **Every rendered anchor carries `rel="noopener noreferrer"`, hardening that survives a
  `linkTarget` change** ([validated by](../../tests/markdown/urlPolicy.test.tsx#L121)).
- **Raw HTML in model-authored content renders as escaped text, never as an element.** An
  `onerror`-carrying `<img>` string stays a string; no `<img>` element is created
  ([validated by](../../tests/ChatMessage.test.tsx#L110)).
- **The component map leaks no internal prop onto the DOM.** `react-markdown`'s own `node` prop
  never reaches a rendered element, closing off attribute injection through a prop the policy does
  not otherwise control ([validated by](../../tests/markdown-components.test.tsx#L87)).

## The labels prop is the one consumer-controlled injection surface

Every other string the library renders is either its own default or model-authored content run
through the controls above. A component's `labels` prop is the exception: it is a
consumer-supplied string that the library renders directly, so a `labels` value that escaped text
rendering would be a real vulnerability. The `linkOpensInNewTab` override is the worked example -
an overridden label reaches the rendered notice element verbatim, as text
([validated by](../../tests/ChatMessage.test.tsx#L771)).

## Out of scope

- **Authorization and data-boundary defects belong to the consuming application.** A `bowman-ui`
  component renders exactly the `ChatEntry[]` it is handed; it holds no credential, makes no
  access decision, and fetches nothing. Data reaching the wrong customer is an authorization
  defect in the consuming application, not this library - there is no `src/` code path that
  could prove or disprove someone else's authorization logic, so this carries no validated-by
  link.
- **Hardening the renderer beyond the documented controls** is a feature request, not a
  vulnerability, unless it demonstrates an actual bypass of the controls above.
- **Findings in a consuming application's own code, infrastructure, or deployment**, which this
  library does not control.

## Recorded decisions, interpretations and deviations

- **Two acknowledgement numbers, not one.** The 48-hour default and the 24-hour
  `ACTIVE EXPLOITATION` escalation are both provisional pending `hal-engine`'s org-wide policy;
  this spec records the numbers `SECURITY.md` currently states, not a claim that either is final.
- **The in-scope list cites the existing controls rather than re-describing them.** Restating
  `urlPolicy.ts`'s behavior here would drift the moment
  `specs/bowman-ui-markdown-link-policy/spec.md` changes; this spec links the same tests instead
  of asserting the same claims a second time.
