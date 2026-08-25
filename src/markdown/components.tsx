import { createElement, type HTMLAttributes, type ReactElement } from "react";

export type MarkdownElementProps = HTMLAttributes<HTMLElement> & {
  node?: unknown;
};

type MarkdownTag =
  | "p"
  | "a"
  | "ul"
  | "ol"
  | "li"
  | "code"
  | "pre"
  | "blockquote"
  | "h1"
  | "h2"
  | "h3"
  | "table"
  | "thead"
  | "th"
  | "td"
  | "hr"
  | "strong"
  | "em";

const markdownElement = (tag: MarkdownTag) => {
  const MarkdownElement = ({
    node: _node,
    className,
    ...rest
  }: MarkdownElementProps): ReactElement =>
    createElement(tag, {
      ...rest,
      className: className ? `bowman-md-${tag} ${className}` : `bowman-md-${tag}`,
    });
  MarkdownElement.displayName = `BowmanMarkdown(${tag})`;
  return MarkdownElement;
};

export const markdownComponents = {
  p: markdownElement("p"),
  a: markdownElement("a"),
  ul: markdownElement("ul"),
  ol: markdownElement("ol"),
  li: markdownElement("li"),
  code: markdownElement("code"),
  pre: markdownElement("pre"),
  blockquote: markdownElement("blockquote"),
  h1: markdownElement("h1"),
  h2: markdownElement("h2"),
  h3: markdownElement("h3"),
  table: markdownElement("table"),
  thead: markdownElement("thead"),
  th: markdownElement("th"),
  td: markdownElement("td"),
  hr: markdownElement("hr"),
  strong: markdownElement("strong"),
  em: markdownElement("em"),
};
