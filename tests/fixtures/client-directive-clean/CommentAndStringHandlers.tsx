// Green fixture for scripts/check-client-directives.mjs: on[A-Z] appears only
// inside comments and string literals, never as a JSX attribute node. The old
// textual matcher fired on the next line; the AST matcher must not.
// <button onClick={handleClick}>
/* onChange={handleChange} */
export const documentation = "wire the handler as onClick={props.onSelect}";
export const template = `attributes like onKeyDown={handler} are client-only`;
