// The index: the list of components the documentation covers, each linking to
// its own page, plus the one link to the non-component surface.

import { docsLabels } from "../activeLabels";
import { componentDocs } from "./componentDocs";
import { docsHref } from "./DocsApp";
import { DocSection } from "./DocsUi";

// The first sentence of the page's own purpose paragraph, so the index cannot
// describe a component differently from its page.
const firstSentence = (text: string): string => `${text.split(". ")[0]}.`;

const rowClassName =
  "flex flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900";

export function IndexPage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {docsLabels.title}
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{docsLabels.intro}</p>
      </header>

      <DocSection title={docsLabels.components}>
        <ul className="flex list-none flex-col gap-2">
          {componentDocs.map((doc) => (
            <li key={doc.id}>
              <a href={docsHref(doc.id)} data-doc-index-entry={doc.id} className={rowClassName}>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {doc.name}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {firstSentence(doc.purpose)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title={docsLabels.overview}>
        <a href={docsHref("overview")} className={rowClassName}>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            The five hooks, the markdown policy, resolveLabels and the entry types.
          </span>
        </a>
      </DocSection>
    </>
  );
}
