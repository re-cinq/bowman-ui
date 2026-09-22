// The offset sites' shared ring fragment (docs/design-notes.md § Theming decision 12).
import { FOCUS_RING_COLOR, RING_OFFSET } from "./tokens.js";

export const FOCUS_RING = `focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} ${RING_OFFSET}`;
