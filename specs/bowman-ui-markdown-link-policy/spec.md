# bowman-ui markdown link policy

Issue: issue 76 (`bowman-ui-markdown-link-policy`)

Assistant content is model-authored with third-party TMS data in context, so
which URLs become clickable is the library's decision, not the model's.
`src/markdown/urlPolicy.ts` ships `MarkdownPolicy`, `defaultMarkdownPolicy`
and `createUrlTransform(policy)`; 019's frozen `markdownComponents` constant
becomes the `createMarkdownComponents(options)` factory (the `a` renderer now
needs a policy and a label); `ChatMessage` gains a `markdown?: MarkdownPolicy`
prop and a `linkOpensInNewTab` label. `react-markdown`'s own
`defaultUrlTransform` is replaced, not wrapped - the string appears nowhere in
`src/` ([validated by](../../tests/markdown/urlPolicy.test.tsx#L279)).

## The policy

`defaultMarkdownPolicy` is a frozen `Readonly<Required<MarkdownPolicy>>` equal
to `{ allowedSchemes: ["https", "mailto", "tel"], allowRelativeUrls: false,
linkTarget: "_blank", allowImages: false }`
([validated by](../../tests/markdown/urlPolicy.test.tsx#L33)). `http` is
dropped (a cleartext link to a customer's own booking is an accident),
`irc`/`ircs`/`xmpp` are dropped (nothing in this product emits them), `tel` is
added (a depot phone number is a plausible support answer). The three allowed
schemes render anchors with their exact `href`
([validated by](../../tests/markdown/urlPolicy.test.tsx#L43)). `http`, `irc`,
`xmpp`, `javascript:`, `data:`, `vbscript:` and every relative form render no
anchor at all - the link text renders in a `<span>`, and
`a[href=""]` never appears, since an empty-href anchor reloads the page when
clicked ([validated by](../../tests/markdown/urlPolicy.test.tsx#L53)). Case
and entity encoding do not get past the allowlist, asserted on the DOM
([validated by](../../tests/markdown/urlPolicy.test.tsx#L71)).

The allowlist is data, not a hardcoded branch:
`allowedSchemes: ["https", "http"]` renders the `http` anchor
([validated by](../../tests/markdown/urlPolicy.test.tsx#L82)). `[]`
rejects everything
([validated by](../../tests/markdown/urlPolicy.test.tsx#L90)).
`allowRelativeUrls: true` renders `<a href="/booking/42">`; the default does
not ([validated by](../../tests/markdown/urlPolicy.test.tsx#L99),
[L104](../../tests/markdown/urlPolicy.test.tsx#L105)).

## Anchor hardening

Every rendered anchor carries `rel="noopener noreferrer"` and
`target="_blank"`
([validated by](../../tests/markdown/urlPolicy.test.tsx#L121)). With
`linkTarget: "_self"` the `target` attribute is absent and the `rel` pair
stays, so the chat URL `/chat/<conversation-id>` - a personal-data identifier
per `003-support-conversation-data-flow-record` - never leaves in a `Referer`
header ([validated by](../../tests/markdown/urlPolicy.test.tsx#L134)). A
`_blank` anchor contains a visually-hidden notice from the
`linkOpensInNewTab` label, default `"(opens in a new tab)"`, overridable, and
absent under `_self`
([validated by](../../tests/markdown/urlPolicy.test.tsx#L144),
[L153](../../tests/markdown/urlPolicy.test.tsx#L154),
[L161](../../tests/markdown/urlPolicy.test.tsx#L162)). The notice class is
`bowman-sr-only`, shipped in `src/styles.css` rather than Tailwind's
`sr-only`, so a consumer without the `@source` line gets an invisible notice,
not visible clutter in every link
([validated by](../../tests/markdown/urlPolicy.test.tsx#L310)).

remark-gfm autolink literals get identical treatment: a bare `https://` URL
and a bare email render policy-checked anchors
([validated by](../../tests/markdown/urlPolicy.test.tsx#L189),
[L197](../../tests/markdown/urlPolicy.test.tsx#L198)).

**Correction to the issue text**: the criterion's bare `www.havkat-rejser.invalid`
case cannot render an anchor under the default policy - remark-gfm autolinks
`www.` literals to an `http://` href, which the default allowlist rejects, so
it renders as text ([validated
by](../../tests/markdown/urlPolicy.test.tsx#L207)). It renders the anchor with
the `rel` pair and the notice under the `["https", "http"]` opt-in
([validated by](../../tests/markdown/urlPolicy.test.tsx#L214)). Silently
upgrading `http://www.` to `https://` was rejected: it would break the
exact-`href` guarantee and send the reader somewhere the model did not write.

## The image gate

An `https` image URL passing the scheme allowlist still means the browser
requests it at render time - a tracking pixel with no click and no consent.
The map's `img` renderer renders the `alt` text and no `HTMLImageElement` by
default ([validated by](../../tests/markdown/urlPolicy.test.tsx#L227)).
`allowImages: true` renders one `<img>` with that `src`, still behind the
scheme allowlist - a `javascript:` source renders none either way
([validated by](../../tests/markdown/urlPolicy.test.tsx#L234),
[L241](../../tests/markdown/urlPolicy.test.tsx#L245)).

**GDPR.** With the default policy a fixture containing an image, an autolinked
URL and a markdown link renders zero `<img>`, zero `src` attributes and zero
`link[rel="preload"]` elements - React 19 hoists a preload per image source,
which is the request a `fetch` spy would never see
([validated by](../../tests/markdown/urlPolicy.test.tsx#L256)). Suite-wide,
`tests/setup.ts` records any `fetch` or `XMLHttpRequest` call and fails the
test that triggered it, alongside 023's console trap
([validated by](../../tests/setup.ts#L18)). Neither markdown source file
references `console.`, storage APIs, `fetch` or `sendBeacon`
([validated by](../../tests/markdown/urlPolicy.test.tsx#L285)). Raw HTML
still renders as escaped text - no `rehype` anywhere
([validated by](../../tests/markdown/urlPolicy.test.tsx#L279)).

## The factory

`createMarkdownComponents(options)` is the package root's only markdown-map
export; 019's constant is gone. It returns the eighteen classed elements plus
the `img` gate ([validated
by](../../tests/markdown-components.test.tsx#L55)). Every element still
carries its `bowman-md-<tag>` class through a full fixture render - the `a`
case on an `https` URL per the issue's amendment
([validated by](../../tests/markdown-components.test.tsx#L74)). The
result stays assignable to `react-markdown`'s `Components`
([validated by](../../tests/markdown-components.test.tsx#L92)).

`ChatMessage` merges its `markdown` prop over `defaultMarkdownPolicy` (via
`resolveLabels`, so an explicit `undefined` field cannot clobber a default)
and passes the factory's map plus `createUrlTransform`'s result to
`ReactMarkdown` ([validated by](../../tests/ChatMessage.test.tsx#L721),
[L649](../../tests/ChatMessage.test.tsx#L749),
[L661](../../tests/ChatMessage.test.tsx#L761)). A rejected link renders as a
span ([validated by](../../tests/ChatMessage.test.tsx#L736)). An image
renders as alt text
([validated by](../../tests/ChatMessage.test.tsx#L786)). The
`linkOpensInNewTab` override reaches the notice
([validated by](../../tests/ChatMessage.test.tsx#L774)).

## Recorded decisions, interpretations and deviations

- **`MarkdownPolicy` fields are optional.** The issue's interface literal
  writes them required, but its own `Readonly<Required<MarkdownPolicy>>`
  criterion, the "merged over `defaultMarkdownPolicy`" wording and the
  one-line `http` opt-in all require field-level merging - so the fields
  carry `?` and the prop stays the issue's literal `markdown?: MarkdownPolicy`
  ([validated by](../../tests/ChatMessage.test.tsx#L749)).
- **The transform never decodes.** `java&#x09;script:` reaches the transform
  percent-encoded as `java%09script:`; comparing the raw scheme keeps the
  bypass closed, and a later `decodeURIComponent` "cleanup" would reopen it
  ([validated by](../../tests/markdown/urlPolicy.test.tsx#L71)).
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
  by](../../tests/markdown/urlPolicy.test.tsx#L319),
  [L332](../../tests/markdown/urlPolicy.test.tsx#L336),
  [L341](../../tests/markdown/urlPolicy.test.tsx#L345)).
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
  sentinel harness and key-coverage test (CONTRACT.md § Labels records the
  shape; Toast's closed-list precedent)
  ([validated by](../../tests/labelled-exports.test.tsx#L359),
  [L349](../../tests/labelled-exports.test.tsx#L437)).

  `ChatMessage`'s sentinel harness renders a numeric-text link so the notice
  label reaches the checked DOM.

- **Amendments to merged criteria, per the issue:** `ChatMessageProps` gains
  `markdown?: MarkdownPolicy` (ten fields), `ChatMessageLabels` and
  `defaultChatMessageLabels` gain `linkOpensInNewTab` (ten keys).
  - The `@ts-expect-error` completeness fixture now omits the tenth key
    ([validated by](../../tests/types/chat-message-type-assertions.tsx#L61)).
  - 019's map-keys test counts nineteen entries, a necessary consequence of
    the `img` gate
    ([validated by](../../tests/markdown-components.test.tsx#L55)).

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
  ([validated by](../../tests/markdown/urlPolicy.test.tsx#L293)).
- The default-policy objects are frozen, arrays included
  ([validated by](../../tests/markdown/urlPolicy.test.tsx#L304)).
