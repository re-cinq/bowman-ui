// Green fixture for scripts/check-forbidden-imports.mjs: every specifier below
// is a declared dependency or peerDependency (or a subpath of one, or a
// relative path), so the allowlist scan reports no violations.
// Never imported by any real module.

import "react";
import "react-dom/client";
import "react-markdown";
import "react-markdown/lib";
import "remark-gfm";
import "./sibling.js";
import "../forbidden-imports-clean/green.js";
