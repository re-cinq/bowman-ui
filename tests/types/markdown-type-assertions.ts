// Compiled by tests/markdown-components.test.tsx with tsc --noEmit. The map is
// typed structurally in src/ (no react-markdown import there); this assignment
// proves it satisfies react-markdown's Components contract anyway.
import type { Components } from "react-markdown";

import { markdownComponents } from "../../src/markdown/components.js";

const mapSatisfiesReactMarkdownComponents: Components = markdownComponents;

void mapSatisfiesReactMarkdownComponents;
