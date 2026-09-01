// The non-component surface, four groups deep: hooks, the markdown policy
// trio, the labels merge and the entry types.

import { docsLabels } from "../activeLabels";
import { docsHref } from "./DocsApp";
import { CodeBlock, DocSection } from "./DocsUi";
import { hookNotes, labelNotes, markdownNotes, typeNotes, type ApiNote } from "./overview";

function NoteGroup({ title, notes }: { title: string; notes: ReadonlyArray<ApiNote> }) {
  return (
    <DocSection title={title}>
      <div className="flex flex-col gap-6">
        {notes.map((note) => (
          <article key={note.id} data-doc-note={note.id} className="flex flex-col gap-2">
            <h3 className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
              {note.name}
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{note.summary}</p>
            <CodeBlock code={note.snippet} />
          </article>
        ))}
      </div>
    </DocSection>
  );
}

export function OverviewPage() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <a
          href={docsHref()}
          className="text-sm text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {docsLabels.backToIndex}
        </a>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {docsLabels.overview}
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          Everything the package exports that is not a component. No props tables here: these are
          signatures rather than rendered surfaces.
        </p>
      </header>

      <NoteGroup title="Hooks" notes={hookNotes} />
      <NoteGroup title="Markdown" notes={markdownNotes} />
      <NoteGroup title="Labels" notes={labelNotes} />
      <NoteGroup title="Types" notes={typeNotes} />
    </>
  );
}
