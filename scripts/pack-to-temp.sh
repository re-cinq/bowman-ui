#!/usr/bin/env bash

pack_library() {
  echo "==> Building @re-cinq/bowman-ui"
  npm run build
  echo "==> Packing the tarball"
  TARBALL_NAME="$(npm pack --pack-destination "$TMPDIR" | tail -n 1)"
  TARBALL_PATH="$TMPDIR/$TARBALL_NAME"
}

copy_example_to_temp() {
  local example_name="$1"
  WORK_DIR="$(mktemp -d)"
  WORK_DIR_REAL="$(cd "$WORK_DIR" && pwd -P)"
  if [[ "$WORK_DIR_REAL" == "$REPO_ROOT" || "$WORK_DIR_REAL" == "$REPO_ROOT"/* ]]; then
    echo "Refusing to run: install directory $WORK_DIR_REAL is inside the repo tree $REPO_ROOT" >&2
    exit 1
  fi
  echo "==> Installing into $WORK_DIR_REAL (outside $REPO_ROOT)"
  APP_DIR="$WORK_DIR/$example_name"
  mkdir -p "$APP_DIR"
  tar -C "$REPO_ROOT/examples/$example_name" \
    --exclude node_modules \
    --exclude dist \
    --exclude .next \
    --exclude next-env.d.ts \
    --exclude tsconfig.tsbuildinfo \
    --exclude test-results \
    --exclude playwright-report \
    --exclude package-lock.json \
    -cf - . | tar -xf - -C "$APP_DIR"
}
