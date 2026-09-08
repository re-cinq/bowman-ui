// Compiled by tests/primitives-dist.test.ts with tsc --noEmit against the
// BUILT package: the self-referencing "@re-cinq/bowman-ui" import resolves
// through package.json's "." exports entry to dist/index.d.ts. Pins the
// styled primitives' contract (specs/bowman-ui-styled-primitives/spec.md):
// IconButton's labels is required with no defaults object, no primitive
// takes className, the variant union is closed, and SearchField's defaults
// object satisfies the labels convention's fully-required shape.
import { useRef } from "react";
import {
  Button,
  IconButton,
  PlusIcon,
  PromptChips,
  SearchField,
  defaultSearchFieldLabels,
  type ButtonSize,
  type ButtonVariant,
  type ChatComposerHandle,
  type SearchFieldLabels,
} from "@re-cinq/bowman-ui";

const completeDefaults = defaultSearchFieldLabels satisfies Readonly<Required<SearchFieldLabels>>;

// @ts-expect-error -- an object missing searchPlaceholder is not a
// Readonly<Required<SearchFieldLabels>>: a key added without a default
// fails npm run typecheck.
const incompleteDefaults: Readonly<Required<SearchFieldLabels>> = {
  searchInput: "Søg",
};

const variant: ButtonVariant = "ghost";
const size: ButtonSize = "sm";

const Consumer = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<ChatComposerHandle>(null);

  return (
    <>
      <Button ref={buttonRef} variant={variant} size={size}>
        {incompleteDefaults.searchInput}
      </Button>
      <Button variant="secondary" icon={PlusIcon}>
        4711
      </Button>
      {/* @ts-expect-error -- "tertiary" is outside the closed ButtonVariant union */}
      <Button variant="tertiary">4711</Button>
      {/* @ts-expect-error -- Button takes no className (spec decision 4) */}
      <Button variant="primary" className="mt-2">
        4711
      </Button>
      <IconButton ref={iconButtonRef} icon={PlusIcon} labels={{ accessibleName: "Tilføj" }} />
      {/* @ts-expect-error -- omitting labels is a compile error: accessibleName has no default */}
      <IconButton icon={PlusIcon} />
      {/* @ts-expect-error -- IconButton takes no className (spec decision 4) */}
      <IconButton icon={PlusIcon} labels={{ accessibleName: "Tilføj" }} className="mt-2" />
      <PromptChips prompts={["4711"]} onPick={(text) => composerRef.current?.setValue(text)} />
      {/* @ts-expect-error -- PromptChips takes no className (spec decision 4) */}
      <PromptChips prompts={["4711"]} onPick={() => {}} className="mt-2" />
      <SearchField ref={searchRef} value="" onChange={(next) => void next} />
      {/* @ts-expect-error -- SearchField takes no className (spec decision 4) */}
      <SearchField value="" onChange={() => {}} className="mt-2" />
      <SearchField
        value=""
        onChange={() => {}}
        labels={{ searchInput: completeDefaults.searchInput }}
      />
    </>
  );
};

void Consumer;
