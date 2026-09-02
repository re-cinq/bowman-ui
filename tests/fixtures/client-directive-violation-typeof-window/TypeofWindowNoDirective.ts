// Red fixture for scripts/check-client-directives.mjs: pins the deliberate
// decision that a typeof window guard triggers the directive. This package's
// policy is directives, not isomorphic guards (docs/design-notes.md
// decision 1), and over-requiring is the check's fail-safe direction.
export const isBrowser = () => typeof window !== "undefined";
