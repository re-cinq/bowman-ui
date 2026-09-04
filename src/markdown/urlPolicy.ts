import { resolveLabels } from "../labels.js";

export interface MarkdownPolicy {
  allowedSchemes?: readonly string[];
  allowRelativeUrls?: boolean;
  linkTarget?: "_blank" | "_self";
  allowImages?: boolean;
}

export const defaultMarkdownPolicy: Readonly<Required<MarkdownPolicy>> = Object.freeze({
  allowedSchemes: Object.freeze(["https", "mailto", "tel"]),
  allowRelativeUrls: false,
  linkTarget: "_blank",
  allowImages: false,
});

// Two leading slashes (forward, back or mixed) are protocol-relative: a model-chosen host, never relative.
const schemeRelativePattern = /^[/\\]{2}/;

// Authority-less special schemes resolve against the reader's origin; mailto: and tel: are legitimately opaque.
const originRelativeSchemes = ["http", "https", "ws", "wss", "ftp", "file"];

// Compare schemes undecoded: micromark hands over java%09script:, and decoding would let it smuggle past the allowlist.
export const createUrlTransform = (policy?: MarkdownPolicy) => {
  const resolved = resolveLabels(defaultMarkdownPolicy, policy);

  return (value: string): string => {
    const colon = value.indexOf(":");
    const delimiter = value.search(/[/?#]/);
    const hasScheme = colon !== -1 && (delimiter === -1 || colon < delimiter);

    if (!hasScheme && schemeRelativePattern.test(value)) {
      return "";
    }

    if (!hasScheme) {
      return resolved.allowRelativeUrls ? value : "";
    }
    const scheme = value.slice(0, colon).toLowerCase();

    if (!resolved.allowedSchemes.some((allowed) => allowed.toLowerCase() === scheme)) {
      return "";
    }
    const needsAuthority = originRelativeSchemes.includes(scheme);

    return needsAuthority && !schemeRelativePattern.test(value.slice(colon + 1)) ? "" : value;
  };
};
