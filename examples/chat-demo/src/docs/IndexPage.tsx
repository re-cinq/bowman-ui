// The index: the list of components the documentation covers, each linking to
// its own page, plus the one link to the non-component surface.

import { docsLabels } from "../docs-labels";
import { staticDemoNote } from "../staticDemoNote";
import { componentDocs } from "./componentDocs";
import { docsHref } from "./DocsApp";
import { DocSection } from "./DocsUi";
import heroSrc from "./assets/chat-hero.png";

const heroAlt =
  "A full chat application built with bowman-ui, in a single light theme: a sidebar with a " +
  "new chat button and a conversation list beside a transcript where an assistant answers a " +
  "question about caching strategy with a bulleted list, a code block and a table, a " +
  "thinking indicator while a follow-up question is answered, and the message composer.";

// The first sentence of the page's own purpose paragraph, so the index cannot
// describe a component differently from its page.
const firstSentence = (text: string): string => `${text.split(". ")[0]}.`;

const rowClassName =
  "flex flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900";

export function IndexPage() {
  return (
    <>
      <figure className="flex flex-col gap-2">
        <img
          data-hero-image
          src={heroSrc}
          alt={heroAlt}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800"
        />
        <figcaption
          data-static-demo-note
          className="text-center text-xs text-slate-500 dark:text-slate-400"
        >
          Built with bowman-ui. {staticDemoNote}
        </figcaption>
      </figure>

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
