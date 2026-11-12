// The offset sites' ring fragments, FOCUS_RING and FOCUS_VISIBLE_RING (§ Theming decision 12).
import { FOCUS_RING_COLOR, RING_OFFSET } from "./tokens.js";

export const FOCUS_RING = `focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} ${RING_OFFSET}`;

export const FOCUS_VISIBLE_RING = `focus:outline-none focus-visible:ring-2 ${FOCUS_RING_COLOR} ${RING_OFFSET}`;
