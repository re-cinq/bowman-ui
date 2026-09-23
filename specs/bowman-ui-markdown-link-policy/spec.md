# bowman-ui markdown link policy

| Field  | Value                                       |
| ------ | ------------------------------------------- |
| Issue  | issue 76 (`bowman-ui-markdown-link-policy`) |
| Status | In Progress                                 |

Assistant content is model-authored with third-party TMS data in context, so
which URLs become clickable is the library's decision, not the model's.
`src/markdown/urlPolicy.ts` ships `MarkdownPolicy`, `defaultMarkdownPolicy`
and `createUrlTransform(policy)`; 019's frozen `markdownComponents` constant
becomes the `createMarkdownComponents(options)` factory (the `a` renderer now
needs a policy and a label); `ChatMessage` gains a `markdown?: MarkdownPolicy`
prop and a `linkOpensInNewTab` label. `react-markdown`'s own
`defaultUrlTransform` is replaced, not wrapped - the string appears nowhere in
`src/` ([validated by no file under src/ mentions rehype or defaultUrlTransform](../../tests/markdown/urlPolicy.test.tsx#L287)).

## The policy

`defaultMarkdownPolicy` is a frozen `Readonly<Required<MarkdownPolicy>>` equal
to `{ allowedSchemes: ["https", "mailto", "tel"], allowRelativeUrls: false,
linkTarget: "_blank", allowImages: false }`. `http` is
dropped (a cleartext link to a customer's own booking is an accident),
`irc`/`ircs`/`xmpp` are dropped (nothing in this product emits them), `tel` is
added (a depot phone number is a plausible support answer)
([validated by defaultMarkdownPolicy is the https/mailto/tel, no-relative, new-tab, no-image policy](../../tests/markdown/urlPolicy.test.tsx#L33)). The three allowed
schemes render anchors with their exact `href`. `http`, `irc`,
`xmpp`, `javascript:`, `data:`, `vbscript:` and every relative form render no
anchor at all - the link text renders in a `<span>`, and
`a[href=""]` never appears, since an empty-href anchor reloads the page when
clicked ([validated by](../../tests/markdown/urlPolicy.test.tsx#L61),
[L51](../../tests/markdown/urlPolicy.test.tsx#L51)). Case
and entity encoding do not get past the allowlist, asserted on the DOM
([validated by](../../tests/markdown/urlPolicy.test.tsx#L75)).

The build holds the default at exactly that set as source text:
`scripts/check-markdown-safety.mjs` fails when
`defaultMarkdownPolicy.allowedSchemes` admits `http` or hides `javascript`
behind an escape sequence
([validated by exits 1 when the default allowlist admits http](../../tests/security/check-markdown-safety.test.ts#L131),
[validated by exits 1 when the default allowlist hides javascript behind a unicode escape](../../tests/security/check-markdown-safety.test.ts#L254)).
A spread in the declaration is refused as well: the gate fails when the
`defaultMarkdownPolicy` declaration, read from its exported line to the `});`
line that closes it after block comments and template literals are blanked,
carries a `...` token anywhere, since a later spread
would replace the allowlist at runtime while the array still reads clean
([validated by exits 1 when the default policy spreads another object after the allowlist](../../tests/security/check-markdown-safety.test.ts#L319)).
The blanking is what keeps the block honest: a template literal above the
declaration that spells a clean one is not read in its place, so the real
declaration's spread still fails the gate
([validated by exits 1 when a template literal spoofing a clean declaration precedes the default policy with a spread](../../tests/security/check-markdown-safety.test.ts#L384)).

The allowlist is data, not a hardcoded branch:
`allowedSchemes: ["https", "http"]` renders the `http` anchor. `[]`
rejects everything.
`allowRelativeUrls: true` renders `<a href="/booking/42">`; the default does
not ([validated by `allowRelativeUrls: true renders <a href="/booking/42">`](../../tests/markdown/urlPolicy.test.tsx#L99),
[validated by the default policy renders /booking/42 as text](../../tests/markdown/urlPolicy.test.tsx#L105),
[L82](../../tests/markdown/urlPolicy.test.tsx#L82),
[L90](../../tests/markdown/urlPolicy.test.tsx#L90)).

## Anchor hardening

Every rendered anchor carries `rel="noopener noreferrer"` and
`target="_blank"`
([validated by `every rendered anchor carries rel="noopener noreferrer" and target="_blank"`](../../tests/markdown/urlPolicy.test.tsx#L121)). With
`linkTarget: "_self"` the `target` attribute is absent and the `rel` pair
stays, so the chat URL `/chat/<conversation-id>` - a personal-data identifier
per `003-support-conversation-data-flow-record` - never leaves in a `Referer`
header ([validated by `linkTarget: "_self" drops the target attribute and still carries rel="noopener noreferrer"`](../../tests/markdown/urlPolicy.test.tsx#L136)). A
`_blank` anchor contains a visually-hidden notice from the
`linkOpensInNewTab` label, default `"(opens in a new tab)"`, overridable, and
absent under `_self`
([validated by](../../tests/markdown/urlPolicy.test.tsx#L147),
[validated by a labels override replaces the notice text](../../tests/markdown/urlPolicy.test.tsx#L158),
[validated by `linkTarget: "_self" renders no notice element`](../../tests/markdown/urlPolicy.test.tsx#L166)). The notice class is
`bowman-sr-only`, shipped in `src/styles.css` rather than Tailwind's
`sr-only`, so a consumer without the `@source` line gets an invisible notice,
not visible clutter in every link
([validated by styles.css ships the bowman-sr-only and bowman-md-img rules](../../tests/markdown/urlPolicy.test.tsx#L320)).

remark-gfm autolink literals get identical treatment: a bare `https://` URL
and a bare email render policy-checked anchors
([validated by a bare https URL autolinks with the rel pair and the notice](../../tests/markdown/urlPolicy.test.tsx#L193),
[validated by a bare email autolinks to a mailto anchor](../../tests/markdown/urlPolicy.test.tsx#L203)).

**Correction to the issue text**: the criterion's bare `www.marginalia-books.invalid`
case cannot render an anchor under the default policy - remark-gfm autolinks
`www.` literals to an `http://` href, which the default allowlist rejects, so
it renders as text ([validated
by](../../tests/markdown/urlPolicy.test.tsx#L212)). It renders the anchor with
the `rel` pair and the notice under the `["https", "http"]` opt-in
([validated by](../../tests/markdown/urlPolicy.test.tsx#L219)). Silently
upgrading `http://www.` to `https://` was rejected: it would break the
exact-`href` guarantee and send the reader somewhere the model did not write.

## The image gate

An `https` image URL passing the scheme allowlist still means the browser
requests it at render time - a tracking pixel with no click and no consent.
The map's `img` renderer renders the `alt` text and no `HTMLImageElement` by
default.
`allowImages: true` renders one `<img>` with that `src`, still behind the
scheme allowlist - a `javascript:` source renders none either way
([validated by allowImages: true renders one img with that src](../../tests/markdown/urlPolicy.test.tsx#L240),
[validated by allowImages: true still renders no img for a javascript: src](../../tests/markdown/urlPolicy.test.tsx#L252),
[validated by an https image renders no img element and renders the alt text](../../tests/markdown/urlPolicy.test.tsx#L233)).

**GDPR.** With the default policy a fixture containing an image, an autolinked
URL and a markdown link renders zero `<img>`, zero `src` attributes and zero
`link[rel="preload"]` elements - React 19 hoists a preload per image source,
which is the request a `fetch` spy would never see
([validated by the default policy renders zero img, zero preload links and zero src attributes for a fixture with an image, an autolink and a markdown link](../../tests/markdown/urlPolicy.test.tsx#L263)). Suite-wide,
`tests/setup.ts` records any `fetch` or `XMLHttpRequest` call and fails the
test that triggered it, alongside 023's console trap
([validated by](../../tests/setup.ts#L96)). Neither markdown source file
references `console.`, storage APIs, `fetch` or `sendBeacon`
([validated by `GDPR: neither markdown file calls console.*, localStorage, sessionStorage, fetch or sendBeacon`](../../tests/markdown/urlPolicy.test.tsx#L293)). Raw HTML
still renders as escaped text - no `rehype` anywhere
([validated by no file under src/ mentions rehype or defaultUrlTransform](../../tests/markdown/urlPolicy.test.tsx#L287)).

## The factory

`createMarkdownComponents(options)` is the package root's only markdown-map
export; 019's constant is gone. It returns the eighteen classed elements plus
the `img` gate ([validated
by](../../tests/markdown-components.test.tsx#L55)). Every element still
carries its `bowman-md-<tag>` class through a full fixture render - the `a`
case on an `https` URL per the issue's amendment
([validated by](../../tests/markdown-components.test.tsx#L74)). The
result stays assignable to `react-markdown`'s `Components`
([validated by tsc accepts markdown-type-assertions.ts, proving the map is assignable to react-markdown's Components](../../tests/markdown-components.test.tsx#L93)).

`ChatMessage` merges its `markdown` prop over `defaultMarkdownPolicy` (via
`resolveLabels`, so an explicit `undefined` field cannot clobber a default)
and passes the factory's map plus `createUrlTransform`'s result to
`ReactMarkdown` ([validated by an https link renders an anchor with target, the rel pair and the hidden notice](../../tests/ChatMessage.test.tsx#L774),
[validated by the markdown prop merges over defaultMarkdownPolicy, so an http opt-in renders the anchor](../../tests/ChatMessage.test.tsx#L803),
[L815](../../tests/ChatMessage.test.tsx#L815)). A rejected link renders as a
span ([validated by `a javascript: link renders no anchor and no empty href, the text in a <span>`](../../tests/ChatMessage.test.tsx#L790)). An image
renders as alt text
([validated by an image in assistant content renders alt text and no img under the default policy](../../tests/ChatMessage.test.tsx#L840)). The
`linkOpensInNewTab` override reaches the notice
([validated by a linkOpensInNewTab label override reaches the notice](../../tests/ChatMessage.test.tsx#L828)).

## Recorded decisions, interpretations and deviations

- **`MarkdownPolicy` fields are optional.** The issue's interface literal
  writes them required, but its own `Readonly<Required<MarkdownPolicy>>`
  criterion, the "merged over `defaultMarkdownPolicy`" wording and the
  one-line `http` opt-in all require field-level merging - so the fields
  carry `?` and the prop stays the issue's literal `markdown?: MarkdownPolicy`
  ([validated by the markdown prop merges over defaultMarkdownPolicy, so an http opt-in renders the anchor](../../tests/ChatMessage.test.tsx#L803)).
- **The transform never decodes.** `java&#x09;script:` reaches the transform
  percent-encoded as `java%09script:`; comparing the raw scheme keeps the
  bypass closed, and a later `decodeURIComponent` "cleanup" would reopen it
  ([validated by](../../tests/markdown/urlPolicy.test.tsx#L75)).
- **Protocol-relative URLs never count as relative.** `//host`, `\\host` and
  `/\host` resolve to a model-chosen origin, so they are rejected even under
  `allowRelativeUrls: true` - a hole in the issue's relative/absolute split,
  closed here ([validated
  by](../../tests/markdown/urlPolicy.test.tsx#L112)).
- **An allowed scheme without an authority is still a relative URL.** A
  WHATWG special scheme (`http`, `https`, `ws`, `wss`, `ftp`, `file`) that
  carries no `//` authority resolves against the reader's own document:
  `https:/api/logout` navigates to the current origin's `/api/logout`, the
  exact destination `allowRelativeUrls: false` exists to refuse, and
  `https:#anchor` and `https:?x=1` are the same trick. The scheme allowlist
  alone let all of them through, so an allowed special scheme must also carry
  a `[/\\]{2}` authority; the check is scoped to the special schemes because
  `mailto:` and `tel:` are non-special, never inherit a base, and have no
  legitimate authority form ([validated
  by](../../tests/markdown/urlPolicy.test.tsx#L329),
  [validated by the rejection survives allowRelativeUrls: true and an http opt-in](../../tests/markdown/urlPolicy.test.tsx#L346),
  [validated by mailto and tel keep their authority-less form](../../tests/markdown/urlPolicy.test.tsx#L355)).
- **`createUrlTransform` is exported from the package root** alongside the
  issue's three named exports: a consumer using the factory standalone without
  the transform would get the image gate but no href filtering. Declared here
  as an amendment, like the two `ChatMessage` amendments the issue sanctions.
  `MarkdownComponentsLabels`, `defaultMarkdownComponentsLabels` and
  `MarkdownComponentsOptions` stay module-level (not in the barrel):
  `defaultMarkdownPolicy` already required loosening `public-api.test.ts`'s
  labelled-defaults pairing to a `default*Labels` match, and two more
  unrequested public names would buy nothing a consumer needs.
- **The factory sits in the `labelsProp` partition bucket** with its own
  sentinel harness and key-coverage test (docs/design-notes.md § Labels records the
  shape; Toast's closed-list precedent)
  ([validated by createMarkdownComponents' sentinel labels cover every defaultMarkdownComponentsLabels key](../../tests/labelled-exports.test.tsx#L615),
  [harness](../../tests/labelled-exports.test.tsx#L492)).

  `ChatMessage`'s sentinel harness renders a numeric-text link so the notice
  label reaches the checked DOM.

- **Amendments to merged criteria, per the issue:** `ChatMessageProps` gains
  `markdown?: MarkdownPolicy` (ten fields at the time; 121's `assistantName`
  later made eleven), `ChatMessageLabels` and `defaultChatMessageLabels` gain
  `linkOpensInNewTab` (ten keys then, eleven since 121's
  `assistantMessageFrom`).
  - The `@ts-expect-error` completeness fixture omits `linkOpensInNewTab`
    (and, since 121, `assistantMessageFrom`)
    ([validated by](../../tests/types/chat-message-type-assertions.tsx#L60),
    compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L25)).
  - 019's map-keys test counts nineteen entries, a necessary consequence of
    the `img` gate
    ([validated by covers exactly the eighteen tags 019 named plus 076's img gate](../../tests/markdown-components.test.tsx#L55)).

  Supersession notes sit in 019's and 023's specs.

- **`markdownComponents`' removal is a breaking API change**, sanctioned by
  the issue; no version has been published, so no consumer exists to break.
  `tests/fixtures/public-api.json` was regenerated deliberately
  (47 values, 30 types).
- **Streaming stability.** `AssistantMessage` memoizes the factory's map and
  the transform on the resolved policy fields (not the `markdown` object
  identity), so an inline `markdown={{...}}` literal does not remount the
  rendered markdown subtree on every streaming token. The `allowedSchemes`
  memo key is `JSON.stringify`, not a joined string, so the memoized policy
  is byte-identical to the prop and can never be more permissive than
  `createUrlTransform` over the same input.
- **Footnote references keep their attributes.** gfm footnote refs carry
  `#user-content-fn-*` fragments, which the default policy rejects like any
  relative URL - they render as spans, and the span keeps `id`, `aria-*` and
  the backref's accessible name so same-page assistive semantics survive
  ([validated by a gfm footnote reference keeps its id and aria attributes on the policy's span](../../tests/markdown/urlPolicy.test.tsx#L301)).
- The default-policy objects are frozen, arrays included
  ([validated by defaultMarkdownPolicy, its allowedSchemes array and defaultMarkdownComponentsLabels are frozen](../../tests/markdown/urlPolicy.test.tsx#L314)).
