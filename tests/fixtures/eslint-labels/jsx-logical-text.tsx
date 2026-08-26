// Red fixture: string literals reached through &&, ?: or + as JSX children
// must trip the hardcoded-text selector - the idiomatic conditional-render
// forms are not an escape hatch.
export const CopiedToast = ({ ok }: { ok: boolean }) => (
  <span>
    {ok && "Copied to clipboard"}
    {ok ? "Copied" : "Failed"}
    {"Copied" + " message"}
  </span>
);
