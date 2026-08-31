# Markdown rendering: threat model and standing invariants

`bowman-ui`'s entire attack surface is model-authored markdown rendered into a
customer's browser by `ChatMessage`. Assistant `content` is untrusted: a
compromised or jailbroken model can emit any string it likes. This document
records the guarantees that keep that string from becoming script, and the gate
that keeps a future refactor from silently re-opening a closed hole.

## The load-bearing invariant

**`bowman-ui` never adds `rehype-raw` or otherwise renders raw HTML from entry
content.** The moment it does, every guarantee below is void: a
`<img onerror>`, `<script>`, or `<svg onload>` in the assistant content would
become a live DOM node instead of inert text.

`ChatMessage` calls `ReactMarkdown` with `remark-gfm` and no rehype plugins, so
raw HTML in the content is passed through as literal text, never parsed into
elements.

## The controls

- **No raw HTML** (`ChatMessage.tsx`): no `rehype-raw`, no
  `dangerouslySetInnerHTML`, no `skipHtml={false}`. Model-authored HTML is text.
- **Scheme allowlist** (`src/markdown/urlPolicy.ts`, `createUrlTransform`):
  only `https`, `mailto`, and `tel` produce a live link. The transform compares
  the scheme **without percent-decoding first**, so `java%09script:` cannot
  smuggle a tab past the allowlist a browser strips before navigating. Mixed and
  protocol-relative slash forms (`//host`, `\\host`, `/\host`, `\/host`) are
  dropped, and origin-relative special schemes (`https:/api/logout`) require an
  authority.
- **Image opt-in** (`src/markdown/components.tsx`, `createMarkdownComponents`):
  images render only when `allowImages` is set. The default is `false`; alt text
  renders instead. Opt-in never bypasses the scheme allowlist - `urlTransform`
  still drops a `data:` or `javascript:` image `src`, so only `https` survives.
- **Anchor hardening**: every rendered anchor carries
  `rel="noopener noreferrer"`; an anchor whose transformed href is empty renders
  as a `<span>`, never a live link.

## The corpus

`tests/security/markdown-xss.test.tsx` drives one fixture per known bypass class
through the rendered pipeline (the real `ChatMessage`, or the identical
`ReactMarkdown` + `createMarkdownComponents` + `createUrlTransform` triple it
wires up) and asserts no live node is created and the payload survives as
literal text:

| Class                           | Fixtures                                                                                     | Safe outcome                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Raw HTML passthrough            | `<script>`, `<img onerror>`, `<a href=javascript:>`, `<svg onload>`                          | no `script`/`svg`/`img`/`[onerror]`/`[onload]`; literal text present                                  |
| Dangerous schemes               | `javascript:`, `JavaScript:`, `java%09script:`, `vbscript:`, `data:text/html,...`, `file://` | anchor renders hrefless as a `<span>`                                                                 |
| Protocol-relative / mixed slash | `//evil.com`, `\\evil.com`, `/\evil.com`, `\/evil.com`                                       | href dropped                                                                                          |
| gfm autolinks                   | `www.evil.com`, `http://evil.com` (dropped); `attacker@evil.com` (mailto survives)           | only `mailto` autolinks                                                                               |
| Image vectors                   | `![x](https://...)`, `![x](data:image/svg+xml,...)` with and without `allowImages`           | alt text and no `img` by default; `allowImages: true` still drops the `data:` src, keeps only `https` |
| Label injection                 | a `labels` field set to `<img src=x onerror=...>`                                            | renders as literal text, never an element                                                             |

## The gate

`scripts/check-markdown-safety.mjs` (npm: `check:markdown-safety`) is
source-invariant: it greps the source, never renders markdown, and fails the
build when any standing invariant regresses:

1. `rehype-raw` appears in `package.json`.
2. A file under `src/` mentions `rehype`, imports `remark-html`, sets
   `dangerouslySetInnerHTML`, or re-enables raw HTML with `skipHtml={false}`.
3. `defaultMarkdownPolicy.allowImages` is not literally `false`.
4. `defaultMarkdownPolicy.allowedSchemes` admits `javascript`, `data`,
   `vbscript`, or `file`.

It runs on `pull_request` in `ci.yml` and before `npm publish` in `publish.yml`,
and is self-tested by `tests/security/check-markdown-safety.test.ts`, which
proves it trips on each crafted bad input and stays green on the clean tree.
