#!/usr/bin/env bash
set -euo pipefail

tag="${1:?usage: check-version.sh <tag>}"

if [[ ! "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Tag '$tag' is not a stable release tag (vX.Y.Z)." >&2
  echo "Prerelease and malformed tags are not published from this repo." >&2
  exit 1
fi

expected="${tag#v}"
actual="$(node -p "require('./package.json').version")"

if [[ "$actual" != "$expected" ]]; then
  echo "Tag $tag expects package.json version $expected, but package.json says $actual." >&2
  echo "Fix with: npm version $expected --no-git-tag-version" >&2
  exit 1
fi

echo "package.json version $actual matches tag $tag"
