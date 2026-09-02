// The documentation view's page chrome - navigation, headings, table column
// names. The docs describe an English API and are developer-facing, so they
// are English like the rest of the demo.
//
// This is the docs view's only label source. Docs components import
// `docsLabels` from here directly, never through `labels.ts`.

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
    "Every public component of @re-cinq/bowman-ui with its purpose, its import, a running example, its props and its labels.",
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
