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
3. `defaultMarkdownPolicy.allowImages` is not declared exactly once as
   literally `true` or `false`, reading `false`. The declaration is read with
   line comments blanked, so a decoy comment spelling `allowImages: false`
   neither hides a real `true` nor counts as a second declaration; a second
   `allowImages` property, bare or quoted, fails. The key matches bare or
   quoted, never as the suffix of a longer name such as `disallowImages`.
4. `defaultMarkdownPolicy.allowedSchemes` is declared more than once, is not an
   inline array of quoted string literals (so the gate reads the runtime value;
   the key may be bare or quoted), or its literals are not exactly `https`,
   `mailto` and `tel` as source text, in any order. An admitted `http`, a
   dropped `tel`, or an escaped literal such as `"java\u0073cript"` that spells
   a dangerous scheme only at runtime all fail, without any escape handling.
5. The `defaultMarkdownPolicy` declaration, read from its exported line to
   the `});` line that closes it, carries a `...` spread token anywhere. A
   spread placed after the checked keys replaces their values at runtime while
   the literals the gate reads stay clean, so the whole declaration is
   refused; a comment above the declaration lies outside the block, and a
   `({})` inside a value does not end it early. Block comments and template
   literals are blanked before the block is read, in one left-to-right pass
   that also lexes line comments and quoted strings so a stray backtick or
   `/*` inside one opens nothing: a `});` line inside a comment or template
   cannot end the block early, and a template or comment above the real
   declaration that spells a clean one cannot be read in its place.
6. The same declaration, again read with line comments blanked so a trailing
   comment cannot mask the delimiter, carries a computed key: a `[` that
   follows `{` or `,` across whitespace sits at property position, and as the
   last property a `[key]: value` would override a checked key at runtime
   while the literals the gate reads stay clean. A `[` that follows `:` or
   `(`, as in a wrapped `allowedSchemes` array, is a value, not a key, and
   passes.

It runs on `pull_request` in `ci.yml` and before `npm publish` in `publish.yml`,
and is self-tested by `tests/security/check-markdown-safety.test.ts`, which
proves it trips on each crafted bad input and stays green on the clean tree.

## Known limits

The gate is source-invariant against react-markdown v10's plugin surface: it
keys on `rehypePlugins` as the only practical way to re-admit raw HTML in the
pipeline `bowman-ui` actually ships. A wholesale replacement of `ReactMarkdown`
with a hand-built hast pipeline (`mdast-util-to-hast` + `hast-util-raw` +
`hast-util-to-jsx-runtime`) would not trip these greps. That kind of change is
a large, conspicuous diff, not a silent one-line regression, and the corpus in
`tests/security/markdown-xss.test.tsx` still exercises it at the `ChatMessage`
level - it would have to pass the same fixtures to land.

The lexer behind gate items 3 to 6 recognises block comments, template
literals, line comments and quoted strings (backslash continuations included),
nothing else. An unterminated backtick or `/*` matches nothing and blanks
nothing. Blanking removes only the lexeme's own text, so a comment or template
whose closer ends the line above the declaration leaves it on its own line; a
closer on the declaration's own line (`*/ export const defaultMarkdownPolicy`)
joins it to that text, the `^export const` anchor misses and the gate exits 2,
before and after the lexer pass. What remains is the regex literal, which is
not lexed: a quote, backtick, `//` or `/*` inside one opens a phantom string
(bounded by its line), line comment, template or comment that runs to the next
closer. A template whose `${}` nests another template mis-pairs the same way,
surfacing the nested body as code. A phantom comment or template that swallows
the declaration exits 2; a phantom that shadows a real comment or template
holding a `});` line, or a nested template body holding one, lets a spread
after it go unread. A regex literal or a nested template inside the
declaration - which `Readonly<Required<MarkdownPolicy>>` admits as no value,
only inside one - are the constructs review must still refuse. Blanking also
makes a block comment inside the declaration invisible to the spread,
declared-once and computed-key checks. A line comment there still counts for
the spread and `allowedSchemes` checks, so a `// ...` or `// allowedSchemes:`
inside the literal is a bogus red, not a bypass; the `allowImages` and
computed-key checks blank line comments first, because a trailing comment
between the `,` and a `[` would otherwise hide the computed key. A quoted
string counts for all four, so a `"allowImages: true"` or `", ["` value inside
the literal is a bogus red as well.
