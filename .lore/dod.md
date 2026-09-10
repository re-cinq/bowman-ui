# Definition of Done

> Colors are only coarsely customizable: components carry Tailwind utility classes, and a consumer's Tailwind v4 build can re-map the raw palette (`--color-blue-500` etc.), but that recolors every use of a palette entry rather than expressing intent (accent vs surface vs text). A consumer-specific brand color today means overriding palette names globally, which is blunt and entangled with the neutral chrome.

**Strategy: `direct`** — Brand-adjacent surfaces (send button, streaming avatar) are rendered by named components with queryable class strings. The seam is the className: after the fix each surface must carry a `--bowman-*` token name. The fallback lives inside each class's inline `var(--bowman-accent, var(--color-blue-500))`, not in a `:root` block.

## Done when these pass

- [x] **ChatComposer send button references --bowman-accent** — the send button's className contains `--bowman-accent` (was `bg-blue-500`)
  `tests/theming.test.tsx`

- [x] **Streaming assistant avatar references --bowman-accent-soft** — when `isStreaming: true`, the avatar circle's className contains `--bowman-accent-soft` (was `bg-blue-50`)
  `tests/theming.test.tsx`

## Facets

- [x] Define `src/theme/tokens.ts` with every `--bowman-*` token as a Tailwind v4 arbitrary-value constant including inline fallback
- [x] Switch every brand-adjacent surface across all components to use the token constants
- [x] Document token list and fallback rule in `docs/design-notes.md § Theming`
- [x] Verify `npm test` passes green end-to-end (covered by `tests/theming-tokens-dist.test.ts` from main)

## Out of scope

- A theming runtime or `ThemeProvider`
- Dark-mode strategy (consumer's build decision)
- Recoloring neutral slate chrome semantically (neutral tokens are also covered, but not part of the original ticket claim)
- Any change in a consuming application
