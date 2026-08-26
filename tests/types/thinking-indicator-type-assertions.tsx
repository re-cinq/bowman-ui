// Compiled by tests/thinking-indicator-dist.test.ts with tsc --noEmit against
// the BUILT package: the self-referencing "@re-cinq/bowman-ui" import resolves
// through package.json's "." exports entry to dist/index.d.ts. Pins the labels
// convention's compile-time guarantee (a ThinkingIndicatorLabels key without a
// default cannot satisfy Readonly<Required<...>>) and 024's private-subcomponent
// decision: ThinkingDots must stay out of the public type surface, so importing
// it is a compile error. The runtime export set is pinned separately by
// tests/public-api.test.ts's dist/index.js snapshot.
import { defaultThinkingIndicatorLabels, type ThinkingIndicatorLabels } from "@re-cinq/bowman-ui";
// @ts-expect-error -- ThinkingDots is the shared private subcomponent and is
// deliberately not exported; the day it reaches the barrel this directive
// turns unused and the compile fails.
import { ThinkingDots } from "@re-cinq/bowman-ui";

const completeDefaults = defaultThinkingIndicatorLabels satisfies Readonly<
  Required<ThinkingIndicatorLabels>
>;

// @ts-expect-error -- a ThinkingIndicatorLabels key without a default must not
// compile: an object missing `thinkingRegion` is not a
// Readonly<Required<ThinkingIndicatorLabels>>.
const incompleteDefaults: Readonly<Required<ThinkingIndicatorLabels>> = {
  thinking: "Thinking",
};

void ThinkingDots;
void completeDefaults;
void incompleteDefaults;
