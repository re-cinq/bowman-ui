// Red fixture: a string literal reached through a ternary or && inside an
// assistive attribute must trip the attribute selector.
export const CopyButton = ({ copied }: { copied: boolean }) => (
  <button type="button" aria-label={copied ? "Copied" : "Copy message"} />
);
