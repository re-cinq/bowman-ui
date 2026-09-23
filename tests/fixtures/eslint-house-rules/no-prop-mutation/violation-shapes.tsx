import React, { forwardRef } from "react";

interface Props {
  count: number;
  counts: number[];
  tags: Set<string>;
  nested: { depth: number };
}

export const Assigned = (props: Props) => {
  props.count = 1;

  return null;
};

export const Updated = (props: Props) => {
  props.count++;

  return null;
};

export const Deleted = (props: Partial<Props>) => {
  delete props.count;

  return null;
};

export const Nested = (props: Props) => {
  props.nested.depth = 2;

  return null;
};

export const SetAdded = (props: Props) => {
  props.tags.add("pinned");

  return null;
};

export const ComputedRoot = (props: Props) => {
  props["counts"].push(0);

  return null;
};

export const OptionalMutator = (props: Props) => {
  props.counts?.push(0);

  return null;
};

export const Destructured = ({ counts }: Props) => {
  counts.push(0);

  return null;
};

export const ReactMemo = React.memo((props: Props) => {
  props.counts.push(0);

  return null;
});

export const ReactForwardRef = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  props.counts.push(0);

  return <div ref={ref} />;
});

export const Wrapped = forwardRef<HTMLDivElement, Props>((props, ref) => {
  props.counts.push(0);

  return <div ref={ref} />;
});

export function Declared(props: Props) {
  props.count = 1;

  return null;
}

export const Named = function NamedBadge(props: Props) {
  props.count++;

  return null;
};

export const ComputedMutator = (props: Props) => {
  props.counts["push"](0);

  return null;
};

export const ComputedWrapper = React["memo"]((props: Props) => {
  props.counts.push(0);

  return null;
});

export const ComputedChain = (props: Props) => {
  props["counts"]["push"](0);

  return null;
};

export const TemplateMutator = (props: Props) => {
  props.counts[`push`](0);

  return null;
};

// Left alone: a computed callee whose property is a template with substitutions,
// a lowercase function, a non-mutating method, and a second parameter.
export const SubstitutionMutator = (props: Props) => {
  props.counts[`pu${"sh"}`](0);

  return null;
};

export const helper = (props: Props) => {
  props.counts.push(0);

  return null;
};

export const Reader = (props: Props) => {
  const next = props.counts.slice();

  next.push(props.count);

  return null;
};

export const Tracked = (props: Props, ref: { current: number }) => {
  ref.current = props.count;

  return null;
};

// A non-computed member whose property is a private name, not an Identifier.
export class Registry {
  #memo = (render: (props: Props) => null) => render;
  #push = (value: number) => value;

  pinned = React.#memo((props: Props) => {
    props.counts.push(0);

    return null;
  });

  Pushed = (props: Props) => {
    props.#push(0);

    return null;
  };
}
