# Definition of Done

> Colors are only coarsely customizable: components carry Tailwind utility classes, and a consumer's Tailwind v4 build can re-map the raw palette (`--color-blue-500` etc.), but that recolors every use of a palette entry rather than expressing intent (accent vs surface vs text). A consumer-specific brand color today means overriding palette names globally, which is blunt and entangled with the neutral chrome.

**Strategy: `direct`** — Brand-adjacent surfaces (send button, streaming avatar) are rendered by named components with queryable class strings, and the stylesheet is a build artifact read by the established `tests/styles.test.ts` pattern. All three seams exist today.

## Done when these pass

- [ ] **ChatComposer send button references --bowman-accent** — the send button's className contains `--bowman-accent` (currently `bg-blue-500`)
  `tests/theming.test.tsx`

- [ ] **Streaming avatar references --bowman-accent-soft** — when `isStreaming: true`, the avatar circle's className contains `--bowman-accent-soft` (currently `bg-blue-50`)
  `tests/theming.test.tsx`

- [ ] **dist/styles.css declares tokens with fallbacks** — the built stylesheet contains a `:root` block declaring `--bowman-accent`, `--bowman-accent-soft`, and `--bowman-accent-border` with blue-palette fallback values
  `tests/styles.test.ts`

## Facets

- [ ] Add `--bowman-accent`, `--bowman-accent-soft`, `--bowman-accent-border` (plus dark-mode counterparts) as CSS custom properties with fallbacks in `src/styles.css`
- [ ] Switch `ChatComposer` send button from `bg-blue-500` / `dark:bg-blue-600` to `bg-(--bowman-accent)` / `dark:bg-(--bowman-accent)`
- [ ] Switch `ChatMessage` streaming avatar from `border-blue-200 bg-blue-50` to `border-(--bowman-accent-border) bg-(--bowman-accent-soft)` (and dark counterparts)
- [ ] Switch focus rings across components (`ring-blue-500` / `dark:ring-blue-400`) to `ring-(--bowman-accent)`
- [ ] Switch `ThinkingIndicator` streaming circle from `border-blue-200 bg-blue-50` to token classes
- [ ] Add `## Theming` section to `docs/design-notes.md` documenting the token list, fallback rule, and boundary
- [ ] Verify `npm test` passes green end-to-end

## Out of scope

- A theming runtime or `ThemeProvider`
- Dark-mode strategy (consumer's build decision)
- Recoloring neutral slate chrome semantically
- Any change in a consuming application
- The Vite consumer demo branding (examples/chat-demo; not a library correctness gate)
