// The documentation view's page chrome - navigation, headings, table column
// names. It follows VITE_DEMO_LOCALE like every other label in this demo.
//
// The line drawn here: chrome is localised, and everything that describes the
// library is not. Component purposes, prop descriptions, variant captions and
// the usage snippets are developer documentation about an English API, and
// they stay English in both locales rather than being translated twice and
// drifting once.

export interface DocsLabels {
  title: string;
  intro: string;
  /** Heading and nav label for the component index. */
  components: string;
  /** Heading and nav label for the hooks, markdown and types page. */
  overview: string;
  backToChat: string;
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
