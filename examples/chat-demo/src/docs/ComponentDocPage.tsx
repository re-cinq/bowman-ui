// One component's reference page, in a fixed order: purpose, import, usage,
// props, labels, states.
//
// Two of those sections cannot go stale. The usage listing is the example
// file's own source, read through Vite's `?raw` suffix, so it is literally the
// code rendering above it. The labels table is Object.entries over the
// library's own exported defaults object, so a key added or renamed upstream
// shows up here on the next build with nothing to edit.

import { docsLabels } from "../docs-labels";
import type { ComponentDoc, LabelValue } from "./componentDocs";
import { CodeBlock, DocSection, Stage } from "./DocsUi";
import { docsHref } from "./DocsApp";
import type { PropDoc } from "./propDocs";

const headerCellClassName =
  "border-b border-slate-200 px-3 py-2 text-left font-medium dark:border-slate-800";
const cellClassName = "border-b border-slate-100 px-3 py-2 align-top dark:border-slate-900";

// An interpolated label is a function by convention (docs/design-notes.md § Labels), so
// the table shows what it produces rather than "function".
const labelSample = (value: LabelValue): string => {
  if (typeof value === "function") {
    return value("…");
  }

  return value;
};

function PropsTable({ props }: { props: Readonly<Record<string, PropDoc>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-xs text-slate-700 dark:text-slate-300">
        <thead className="text-slate-500 dark:text-slate-400">
          <tr>
            <th className={headerCellClassName}>{docsLabels.propName}</th>
            <th className={headerCellClassName}>{docsLabels.propType}</th>
            <th className={headerCellClassName}>{docsLabels.propRequired}</th>
            <th className={headerCellClassName}>{docsLabels.propDefault}</th>
            <th className={headerCellClassName}>{docsLabels.propDescription}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(props).map(([name, doc]) => (
            <tr key={name}>
              <td className={cellClassName}>
                <code className="font-mono">{name}</code>
              </td>
              <td className={cellClassName}>
                <code className="font-mono text-slate-500 dark:text-slate-400">{doc.type}</code>
              </td>
              <td className={cellClassName}>
                {doc.required ? docsLabels.required : docsLabels.optional}
              </td>
              <td className={cellClassName}>
                <code className="font-mono text-slate-500 dark:text-slate-400">
                  {doc.default ?? "-"}
                </code>
              </td>
              <td className={cellClassName}>{doc.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabelsTable({ doc }: { doc: ComponentDoc }) {
  if (!doc.labels) {
    return null;
  }
  const { defaults, missing } = doc.labels;

  return (
    <DocSection title={docsLabels.labelsHeading}>
      <p className="text-sm text-slate-600 dark:text-slate-400">{docsLabels.labelsNote}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-xs text-slate-700 dark:text-slate-300">
          <tbody>
            {missing.map((key) => (
              <tr key={key}>
                <td className={cellClassName}>
                  <code className="font-mono">{key}</code>
                </td>
                <td className={`${cellClassName} text-slate-500 dark:text-slate-400`}>
                  {docsLabels.noDefault}
                </td>
              </tr>
            ))}
            {Object.entries(defaults).map(([key, value]) => (
              <tr key={key}>
                <td className={cellClassName}>
                  <code className="font-mono">{key}</code>
                </td>
                <td className={cellClassName}>{labelSample(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocSection>
  );
}

export function ComponentDocPage({ doc }: { doc: ComponentDoc }) {
  const { Example } = doc;

  return (
    <>
      <header className="flex flex-col gap-3">
        <a
          href={docsHref()}
          className="text-sm text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {docsLabels.backToIndex}
        </a>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{doc.name}</h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{doc.purpose}</p>
      </header>

      <DocSection title={docsLabels.importHeading}>
        <CodeBlock code={doc.importLine} />
      </DocSection>

      <DocSection title={docsLabels.usage}>
        <Stage>
          <Example />
        </Stage>
        <CodeBlock code={doc.exampleSource.trimEnd()} />
      </DocSection>

      <DocSection title={docsLabels.props}>
        <PropsTable props={doc.props} />
      </DocSection>

      <LabelsTable doc={doc} />

      {doc.variants.length > 0 && (
        <DocSection title={docsLabels.variants}>
          <div className="flex flex-col gap-6">
            {doc.variants.map((variant) => (
              <figure
                key={variant.id}
                data-doc-variant={variant.id}
                className="flex flex-col gap-2"
              >
                <figcaption className="text-xs text-slate-500 dark:text-slate-400">
                  {variant.caption}
                </figcaption>
                <Stage>{variant.node}</Stage>
              </figure>
            ))}
          </div>
        </DocSection>
      )}
    </>
  );
}
