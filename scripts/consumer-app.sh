#!/usr/bin/env bash
# Issue 82: prove the packed tarball renders the full chat screen in a
# standalone Vite consumer. Builds and packs @re-cinq/bowman-ui, copies
# examples/chat-demo to a temp directory outside the repo tree, installs the
# tarball by file path (never the registry), and runs typecheck, vite build,
# vite preview (started by Playwright's webServer) and the Playwright suite
# against a real Chromium. --keep retains the temp directory and tarball and
# prints their paths for debugging.
set -euo pipefail

KEEP_TEMP=0
for argument in "$@"; do
  case "$argument" in
    --keep) KEEP_TEMP=1 ;;
    *)
      echo "usage: scripts/consumer-app.sh [--keep]" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$REPO_ROOT"

: "${TMPDIR:=/tmp}"

WORK_DIR=""
TARBALL_PATH=""
cleanup() {
  if [ "$KEEP_TEMP" -eq 1 ]; then
    if [ -n "$WORK_DIR" ]; then
      echo "Keeping temp directory: $WORK_DIR"
    fi
    if [ -n "$TARBALL_PATH" ]; then
      echo "Keeping tarball: $TARBALL_PATH"
    fi
    return 0
  fi
  if [ -n "$WORK_DIR" ]; then
    rm -rf "$WORK_DIR"
  fi
  if [ -n "$TARBALL_PATH" ]; then
    rm -f "$TARBALL_PATH"
  fi
}
trap cleanup EXIT

. "$REPO_ROOT/scripts/pack-to-temp.sh"
pack_library

echo "==> Asserting npm pack ships only dist/, package.json, LICENSE and README.md"
PACKED_FILES="$(npm pack --dry-run --json 2>/dev/null | node -e '
  const chunks = [];
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", () => {
    const [report] = JSON.parse(chunks.join(""));
    process.stdout.write(report.files.map((file) => file.path).join("\n"));
  });
')"
for required_file in package.json LICENSE README.md dist/index.js dist/styles.css; do
  if ! printf "%s\n" "$PACKED_FILES" | grep -qx "$required_file"; then
    echo "npm pack --dry-run is missing required file: $required_file" >&2
    exit 1
  fi
done
while IFS= read -r packed_file; do
  case "$packed_file" in
    dist/* | package.json | LICENSE | README.md) ;;
    *)
      echo "npm pack --dry-run would ship an unexpected file: $packed_file" >&2
      exit 1
      ;;
  esac
done <<<"$PACKED_FILES"

echo "==> Asserting the committed demo declares no @re-cinq/bowman-ui dependency"
if grep -q '"@re-cinq/bowman-ui"' "$REPO_ROOT/examples/chat-demo/package.json"; then
  echo "examples/chat-demo/package.json must not declare @re-cinq/bowman-ui; the tarball is the only source" >&2
  exit 1
fi
if grep -q "executablePath" "$REPO_ROOT/examples/chat-demo/playwright.config.ts"; then
  echo "examples/chat-demo/playwright.config.ts must not hardcode an executablePath" >&2
  exit 1
fi

copy_example_to_temp chat-demo

cd "$APP_DIR"

echo "==> Installing demo dependencies"
npm ci --no-fund --no-audit --ignore-scripts

echo "==> Installing the packed tarball by file path"
npm install --no-fund --no-audit --ignore-scripts --no-save "$TARBALL_PATH"

echo "==> Scanning the installed node_modules for forbidden packages"
"$REPO_ROOT/scripts/scan-forbidden-node-modules.sh" "$APP_DIR/node_modules"

echo "==> Typechecking the consumer (strict, moduleResolution bundler)"
npm run typecheck

echo "==> Building the consumer with vite"
npm run build

echo "==> Installing Chromium (and OS deps on Linux) for the pinned @playwright/test"
npx playwright install --with-deps chromium

echo "==> Running the Playwright suite against vite preview"
npx playwright test

echo "==> Consumer app check passed"
