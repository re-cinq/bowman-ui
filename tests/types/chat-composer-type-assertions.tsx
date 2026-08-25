// Compiled by tests/chat-composer-dist.test.ts with tsc --noEmit against the
// BUILT package: the self-referencing "@re-cinq/bowman-ui" import resolves
// through package.json's "." exports entry to dist/index.d.ts. Pins the
// labels convention's compile-time guarantee for the composer - a key added
// to ChatComposerLabels without a default cannot satisfy
// Readonly<Required<ChatComposerLabels>> - and that ChatComposerHandle
// reaches a consumer through the forwardRef surface.
import { useRef } from "react";
import {
  ChatComposer,
  defaultChatComposerLabels,
  type ChatComposerHandle,
  type ChatComposerLabels,
} from "@re-cinq/bowman-ui";

const completeDefaults = defaultChatComposerLabels satisfies Readonly<Required<ChatComposerLabels>>;

// @ts-expect-error -- a ChatComposerLabels key without a default must not
// compile: an object missing `send` (the third key) is not a
// Readonly<Required<ChatComposerLabels>>. This is what "adding a key without
// extending defaultChatComposerLabels fails npm run typecheck" looks like
// from outside.
const incompleteDefaults: Readonly<Required<ChatComposerLabels>> = {
  composerInput: "Your message",
  composerPlaceholder: "Reply...",
};

const Consumer = () => {
  const composerRef = useRef<ChatComposerHandle>(null);
  const inject = () => {
    composerRef.current?.setValue("Vis booking 4711");
    composerRef.current?.focus();
  };
  return (
    <ChatComposer
      ref={composerRef}
      onSubmit={inject}
      busy
      disabled
      autoFocus
      maxHeightPx={400}
      attachSlot={<button type="button" data-title={incompleteDefaults.composerInput} />}
      labels={{ composerInput: completeDefaults.composerInput }}
    />
  );
};

void Consumer;
