import {
  createElement,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactElement,
} from "react";
import { resolveLabels } from "../labels.js";
import { defaultMarkdownPolicy, type MarkdownPolicy } from "./urlPolicy.js";

export type MarkdownElementProps = HTMLAttributes<HTMLElement> & {
  node?: unknown;
};

type MarkdownAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  node?: unknown;
};

type MarkdownImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  node?: unknown;
};

export interface MarkdownComponentsLabels {
  linkOpensInNewTab: string;
}

export const defaultMarkdownComponentsLabels: Readonly<Required<MarkdownComponentsLabels>> =
  Object.freeze({
    linkOpensInNewTab: "(opens in a new tab)",
  });

export interface MarkdownComponentsOptions {
  policy?: MarkdownPolicy;
  labels?: Partial<MarkdownComponentsLabels>;
}

type MarkdownTag =
  | "p"
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

const mergeClassName = (base: string, className: string | undefined) =>
  className ? `${base} ${className}` : base;

const markdownElement = (tag: MarkdownTag) => {
  const MarkdownElement = ({
    node: _node,
    className,
    ...rest
  }: MarkdownElementProps): ReactElement =>
    createElement(tag, {
      ...rest,
      className: mergeClassName(`bowman-md-${tag}`, className),
    });
  MarkdownElement.displayName = `BowmanMarkdown(${tag})`;
  return MarkdownElement;
};

const markdownAnchor = (
  policy: Required<MarkdownPolicy>,
  labels: Required<MarkdownComponentsLabels>
) => {
  const opensInNewTab = policy.linkTarget === "_blank";
  const MarkdownAnchor = ({
    node: _node,
    className,
    href,
    children,
    ...rest
  }: MarkdownAnchorProps): ReactElement => {
    if (!href) {
      return (
        <span {...rest} className={className}>
          {children}
        </span>
      );
    }
    return (
      <a
        {...rest}
        href={href}
        className={mergeClassName("bowman-md-a", className)}
        target={opensInNewTab ? "_blank" : undefined}
        rel="noopener noreferrer"
      >
        {children}
        {opensInNewTab && <span className="bowman-sr-only">{labels.linkOpensInNewTab}</span>}
      </a>
    );
  };
  MarkdownAnchor.displayName = "BowmanMarkdown(a)";
  return MarkdownAnchor;
};

const markdownImage = (policy: Required<MarkdownPolicy>) => {
  const MarkdownImage = ({
    node: _node,
    className,
    src,
    alt,
    ...rest
  }: MarkdownImageProps): ReactElement => {
    if (!policy.allowImages || !src) {
      return <>{alt}</>;
    }
    return (
      <img {...rest} src={src} alt={alt} className={mergeClassName("bowman-md-img", className)} />
    );
  };
  MarkdownImage.displayName = "BowmanMarkdown(img)";
  return MarkdownImage;
};

const staticComponents = {
  p: markdownElement("p"),
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

export const createMarkdownComponents = (options: MarkdownComponentsOptions = {}) => {
  const policy = resolveLabels(defaultMarkdownPolicy, options.policy);
  const labels = resolveLabels(defaultMarkdownComponentsLabels, options.labels);
  return {
    ...staticComponents,
    a: markdownAnchor(policy, labels),
    img: markdownImage(policy),
  };
};
