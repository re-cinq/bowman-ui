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

echo "==> Building @re-cinq/bowman-ui"
npm run build

echo "==> Asserting npm pack ships only dist/, package.json, LICENSE and README.md"
PACKED_FILES="$(npm pack --dry-run --json 2>/dev/null | node -e '
  const chunks = [];
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", () => {
    const [report] = JSON.parse(chunks.join(""));
    process.stdout.write(report.files.map((file) => file.path).join("\n"));
  });
')"
for required_file in package.json LICENSE README.md dist/index.js; do
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

echo "==> Packing the tarball"
TARBALL_NAME="$(npm pack --pack-destination "$TMPDIR" | tail -n 1)"
TARBALL_PATH="$TMPDIR/$TARBALL_NAME"

WORK_DIR="$(mktemp -d)"
WORK_DIR_REAL="$(cd "$WORK_DIR" && pwd -P)"
case "$WORK_DIR_REAL" in
  "$REPO_ROOT" | "$REPO_ROOT"/*)
    echo "Refusing to run: install directory $WORK_DIR_REAL is inside the repo tree $REPO_ROOT" >&2
    exit 1
    ;;
esac
echo "==> Installing into $WORK_DIR_REAL (outside $REPO_ROOT)"

APP_DIR="$WORK_DIR/chat-demo"
mkdir -p "$APP_DIR"
tar -C "$REPO_ROOT/examples/chat-demo" \
  --exclude node_modules \
  --exclude dist \
  --exclude test-results \
  --exclude playwright-report \
  --exclude package-lock.json \
  -cf - . | tar -xf - -C "$APP_DIR"

cd "$APP_DIR"

echo "==> Installing demo dependencies"
npm install --no-fund --no-audit

echo "==> Installing the packed tarball by file path"
npm install --no-fund --no-audit "$TARBALL_PATH"

echo "==> Scanning the installed node_modules for forbidden packages"
FORBIDDEN_MATCHES="$(find "$APP_DIR/node_modules" \( -type d -o -type l \) \( \
  -path "*/node_modules/next" -o \
  -path "*/node_modules/next-intl" -o \
  -path "*/node_modules/swr" -o \
  -path "*/node_modules/lucide-react" -o \
  -path "*/node_modules/@clerk" -o \
  -path "*/node_modules/@discovery" \
  \))"
if [ -n "$FORBIDDEN_MATCHES" ]; then
  echo "Forbidden package found in the installed tree:" >&2
  echo "$FORBIDDEN_MATCHES" >&2
  exit 1
fi

echo "==> Typechecking the consumer (strict, moduleResolution bundler)"
npm run typecheck

echo "==> Building the consumer with vite"
npm run build

echo "==> Installing Chromium for the pinned @playwright/test"
npx playwright install chromium

echo "==> Running the Playwright suite against vite preview"
npx playwright test

echo "==> Consumer app check passed"
