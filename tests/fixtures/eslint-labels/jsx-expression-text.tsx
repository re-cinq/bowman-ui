// Red fixture: a string literal as a JSX expression child must trip the
// hardcoded-text selector the same as bare JSX text.
export const CopiedToast = () => <span>{"Copied!"}</span>;
