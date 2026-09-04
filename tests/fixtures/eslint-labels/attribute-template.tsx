// Red fixture: a template literal carrying words in an assistive attribute
// must trip the attribute selector - backticks are not an escape hatch.
export const SendButton = () => (
  <button type="button" aria-label={`Send message`} />
);
