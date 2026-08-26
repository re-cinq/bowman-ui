// Red fixture for scripts/check-client-directives.mjs: an on[A-Z] JSX
// attribute is the only trigger - no hook, no createContext, no class
// heritage, no browser global. The handler rule alone must fire, which is the
// positive half the comment-and-string green fixture cannot pin.
export const JsxHandlerNoDirective = (props: { fire: () => void }) => (
  <button type="button" onClick={props.fire}>
    go
  </button>
);
