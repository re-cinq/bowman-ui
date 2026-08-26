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

// A leading pair of slashes (forward, back, or mixed) is a protocol-relative
// URL: it resolves to a model-chosen host, so it never counts as relative.
const schemeRelativePattern = /^[/\\]{2}/;

// The value arrives percent-encoded from micromark - java&#x09;script: reaches
// this function as java%09script: - so the scheme comparison must never decode
// first; decoding would let an encoded tab smuggle javascript: past the
// allowlist that browsers strip before navigating.
export const createUrlTransform = (policy?: MarkdownPolicy) => {
  const resolved = resolveLabels(defaultMarkdownPolicy, policy);
  return (value: string): string => {
    const colon = value.indexOf(":");
    const delimiter = value.search(/[/?#]/);
    const hasScheme = colon !== -1 && (delimiter === -1 || colon < delimiter);
    if (!hasScheme) {
      if (schemeRelativePattern.test(value)) {
        return "";
      }
      return resolved.allowRelativeUrls ? value : "";
    }
    const scheme = value.slice(0, colon).toLowerCase();
    return resolved.allowedSchemes.some((allowed) => allowed.toLowerCase() === scheme) ? value : "";
  };
};
