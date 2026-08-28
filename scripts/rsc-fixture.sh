#!/usr/bin/env bash
set -euo pipefail

KEEP_TEMP=0
EXPECT_FAILURE=0
for argument in "$@"; do
  case "$argument" in
    --keep) KEEP_TEMP=1 ;;
    --expect-failure) EXPECT_FAILURE=1 ;;
    *)
      echo "usage: scripts/rsc-fixture.sh [--keep] [--expect-failure]" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$REPO_ROOT"

: "${TMPDIR:=/tmp}"

WORK_DIR=""
TARBALL_PATH=""
MUTATION_DIR=""
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  if [ "$KEEP_TEMP" -eq 1 ]; then
    if [ -n "$WORK_DIR" ]; then
      echo "Keeping temp directory: $WORK_DIR"
    fi
    if [ -n "$MUTATION_DIR" ]; then
      echo "Keeping mutation directory: $MUTATION_DIR"
    fi
    if [ -n "$TARBALL_PATH" ]; then
      echo "Keeping tarball: $TARBALL_PATH"
    fi
    return 0
  fi
  if [ -n "$WORK_DIR" ]; then
    rm -rf "$WORK_DIR"
  fi
  if [ -n "$MUTATION_DIR" ]; then
    rm -rf "$MUTATION_DIR"
  fi
  if [ -n "$TARBALL_PATH" ]; then
    rm -f "$TARBALL_PATH"
  fi
}
trap cleanup EXIT

echo "==> Asserting the committed fixture declares no @re-cinq/bowman-ui dependency"
if grep -q '"@re-cinq/bowman-ui"' "$REPO_ROOT/examples/rsc-fixture/package.json"; then
  echo "examples/rsc-fixture/package.json must not declare @re-cinq/bowman-ui; the tarball is the only source" >&2
  exit 1
fi

echo "==> Asserting the server files carry no use client directive"
for server_file in app/layout.tsx app/page.tsx src/fixtures.ts; do
  server_file_path="$REPO_ROOT/examples/rsc-fixture/$server_file"
  if [ ! -f "$server_file_path" ]; then
    echo "missing fixture file: $server_file_path" >&2
    exit 1
  fi
  if grep -q '"use client"' "$server_file_path"; then
    echo "$server_file must stay a server module but contains a use client directive" >&2
    exit 1
  fi
done

. "$REPO_ROOT/scripts/pack-to-temp.sh"
pack_library
copy_example_to_temp rsc-fixture

cd "$APP_DIR"

echo "==> Installing fixture dependencies"
npm install --no-fund --no-audit

if [ "$EXPECT_FAILURE" -eq 1 ]; then
  MUTATION_DIR="$(mktemp -d)"
  echo "==> Unpacking the tarball to strip the ChatMessage directive"
  tar -xzf "$TARBALL_PATH" -C "$MUTATION_DIR"
  MUTATED_FILE="$MUTATION_DIR/package/dist/components/ChatMessage.js"
  if ! head -n 1 "$MUTATED_FILE" | grep -q '^"use client";$'; then
    echo "expected $MUTATED_FILE to open with the use client directive" >&2
    exit 1
  fi
  node -e '
    const { readFileSync, writeFileSync } = require("node:fs");
    const path = process.argv[1];
    writeFileSync(path, readFileSync(path, "utf8").replace(`"use client";\n`, ""));
  ' "$MUTATED_FILE"
  if head -n 1 "$MUTATED_FILE" | grep -q '"use client"'; then
    echo "failed to strip the directive from $MUTATED_FILE" >&2
    exit 1
  fi
  MUTATED_TARBALL="$MUTATION_DIR/mutated.tgz"
  tar -czf "$MUTATED_TARBALL" -C "$MUTATION_DIR" package
  echo "==> Installing the mutated tarball by file path"
  npm install --no-fund --no-audit "$MUTATED_TARBALL"
  rm -rf .next
  echo "==> Expecting next build to fail on the directive-stripped ChatMessage"
  if ./node_modules/.bin/next build >"$WORK_DIR/expect-failure-build.log" 2>&1; then
    echo "next build succeeded although dist/components/ChatMessage.js lost its use client directive" >&2
    cat "$WORK_DIR/expect-failure-build.log" >&2
    exit 1
  fi
  if ! grep -q "useState" "$WORK_DIR/expect-failure-build.log"; then
    echo "the failing build output does not mention useState" >&2
    cat "$WORK_DIR/expect-failure-build.log" >&2
    exit 1
  fi
  if ! grep -q 'prerendering page "/"' "$WORK_DIR/expect-failure-build.log"; then
    echo "the failing build output does not attribute the failure to prerendering /" >&2
    cat "$WORK_DIR/expect-failure-build.log" >&2
    exit 1
  fi
  echo "==> Expected failure observed: next build rejected the directive-stripped client component"
  exit 0
fi

echo "==> Installing the packed tarball by file path"
npm install --no-fund --no-audit "$TARBALL_PATH"

echo "==> Building the fixture with next build"
./node_modules/.bin/next build

PORT=4319
echo "==> Starting next start on port $PORT"
./node_modules/.bin/next start -p "$PORT" >"$WORK_DIR/next-start.log" 2>&1 &
SERVER_PID=$!

RESPONSE_FILE="$WORK_DIR/response.html"
RESPONSE_OK=0
for _attempt in $(seq 1 30); do
  sleep 1
  if curl -sf "http://127.0.0.1:$PORT/" -o "$RESPONSE_FILE"; then
    RESPONSE_OK=1
    break
  fi
done
if [ "$RESPONSE_OK" -ne 1 ]; then
  echo "next start never served / on port $PORT" >&2
  cat "$WORK_DIR/next-start.log" >&2
  exit 1
fi

echo "==> Asserting the response bytes contain the rendered icons"
if ! grep -q '<svg' "$RESPONSE_FILE"; then
  echo "the / response bytes contain no svg element" >&2
  exit 1
fi
if ! grep -q 'viewBox="0 0 24 24"' "$RESPONSE_FILE" || ! grep -q 'stroke="currentColor"' "$RESPONSE_FILE"; then
  echo "the / response bytes do not contain the library icon markup" >&2
  exit 1
fi
EXPORT_COUNT="$(grep -o 'data-testid="export-count">[0-9]*' "$RESPONSE_FILE" | grep -o '[0-9]*$' || true)"
if [ -z "$EXPORT_COUNT" ] || [ "$EXPORT_COUNT" -lt 40 ]; then
  echo "the namespace import did not survive: rendered export count is ${EXPORT_COUNT:-absent}" >&2
  exit 1
fi

echo "==> RSC fixture check passed"
