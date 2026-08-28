#!/usr/bin/env bash
# Issue 82: the dynamic node_modules scan. Fails when a forbidden package is
# installed at any depth under the given tree - the auth SDK, data-fetching,
# i18n, meta-framework, the banned icon library, or an internal source-app
# scope. Called against a consumer's install (consumer-app.sh) and against
# the repo's own install (the rsc CI job). CONTRACT.md § RSC fixture: next is
# allowed only under examples/rsc-fixture, so this scan is never pointed at
# the fixture's own tree, which contains next by design; the scan is
# unchanged by that exemption.
set -euo pipefail

SCAN_ROOT="$1"

FORBIDDEN_MATCHES="$(find "$SCAN_ROOT" \( -type d -o -type l \) \( \
  -path "*/node_modules/next" -o \
  -path "*/node_modules/next-intl" -o \
  -path "*/node_modules/swr" -o \
  -path "*/node_modules/lucide-react" -o \
  -path "*/node_modules/@clerk" -o \
  -path "*/node_modules/@discovery" \
  \))"
if [ -n "$FORBIDDEN_MATCHES" ]; then
  echo "Forbidden package found in the installed tree $SCAN_ROOT:" >&2
  echo "$FORBIDDEN_MATCHES" >&2
  exit 1
fi
