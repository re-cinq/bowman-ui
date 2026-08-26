// Red fixture: a template literal as a JSX expression child must trip the
// hardcoded-text selector - backticks are not an escape hatch for children.
export const CopiedToast = () => <span>{`Copied!`}</span>;
