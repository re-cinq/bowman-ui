// Red fixture: a string literal wrapped in a JSX expression container must
// trip the attribute selector the same as the bare literal form.
export const CopyButton = () => <button type="button" aria-label={"Copy message"} />;
