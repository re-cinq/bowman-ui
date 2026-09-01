// The documentation view's page chrome - navigation, headings, table column
// names. Unlike every other label in this demo, it does not follow
// VITE_DEMO_LOCALE: the docs describe an English API and are developer-facing,
// not a demonstration of the locale switch, so they stay English regardless
// of which catalogue the chat screen is using.
//
// This is the docs view's only label source. Docs components import
// `docsLabels` from here directly, never through `activeLabels.ts`.

export interface DocsLabels {
  title: string;
  intro: string;
  /** Heading and nav label for the component index. */
  components: string;
  /** Heading and nav label for the hooks, markdown and types page. */
  overview: string;
  backToIndex: string;
  purpose: string;
  importHeading: string;
  usage: string;
  props: string;
  labelsHeading: string;
  variants: string;
  propName: string;
  propType: string;
  propRequired: string;
  propDefault: string;
  propDescription: string;
  required: string;
  optional: string;
  /** Marks a label key the library ships no default for. */
  noDefault: string;
  /** One line under each labels table saying what the labels prop is for. */
  labelsNote: string;
}

export const docsLabels: DocsLabels = {
  title: "Component documentation",
  intro:
    "Every public component of @re-cinq/bowman-ui with its purpose, its import, a running example, its props and its labels. This documentation view is always in English, regardless of VITE_DEMO_LOCALE.",
  components: "Components",
  overview: "Hooks, markdown and types",
  backToIndex: "Back to the index",
  purpose: "Purpose",
  importHeading: "Import",
  usage: "Usage",
  props: "Props",
  labelsHeading: "Labels",
  variants: "States",
  propName: "Name",
  propType: "Type",
  propRequired: "Required",
  propDefault: "Default",
  propDescription: "Description",
  required: "yes",
  optional: "no",
  noDefault: "no default",
  labelsNote:
    "Labels are the library's only language mechanism: a partial label object is merged over the English defaults, key by key.",
};
