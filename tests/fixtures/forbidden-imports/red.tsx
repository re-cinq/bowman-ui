// Red fixture for scripts/check-forbidden-imports.mjs: every specifier below
// falls outside the package.json dependency allowlist, and the script's
// built-in self-test fails unless each one trips.
// Never imported by any real module.

import "next/navigation";
import "next-intl";
import "swr";
import "lucide-react";
import "@clerk/nextjs";
import "@/components/anything";
import "typescript";
