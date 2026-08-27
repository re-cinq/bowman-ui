// Red fixture for scripts/check-forbidden-imports.mjs: every import below is
// banned, and the script's built-in self-test fails unless each one trips.
// Never imported by any real module.

import "next/navigation";
import "next-intl";
import "swr";
import "lucide-react";
import "@clerk/nextjs";
import "@discovery/web";
import "@/components/anything";
