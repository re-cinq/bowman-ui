// The published site is a static build with no backend: the chat's replies are
// canned fixtures grown by setTimeout (see streaming.ts), never a model call.
// The chat's own AI-disclosure band is the aiDisclosure prop being demonstrated,
// not a claim of a live model, so this note states the static nature plainly.
// English and unconditional, like the documentation chrome.
export const staticDemoNote =
  "Static demo - canned responses, no AI backend or network.";
