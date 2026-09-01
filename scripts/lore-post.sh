#!/usr/bin/env bash
# Issue 38: the shared hardened POST used by both .github/workflows/lore-ingest.yml
# jobs. Invariant: a misconfigured LORE_INGEST_URL or LORE_INGEST_TOKEN must never
# pass as a green run, the token must never appear on the curl command line, and a
# response body must never forge a ::workflow-command::.
set -euo pipefail

USAGE="usage: lore-post.sh <endpoint-path-suffix> <payload-json> <failure-noun>"
ENDPOINT_SUFFIX="${1:?${USAGE}}"
PAYLOAD="${2:?${USAGE}}"
FAILURE_NOUN="${3:?${USAGE}}"

# Misconfiguration (unset URL) is a hard error - a missing var must
# never silently fall back and report success.
if [ -z "${LORE_INGEST_URL:-}" ]; then
  echo "::error::LORE_INGEST_URL repository variable is not set - ${FAILURE_NOUN}"
  exit 1
fi
# Same class of misconfiguration: an unset token means every POST is
# rejected with 401, which must never pass as a green run.
if [ -z "${LORE_INGEST_TOKEN:-}" ]; then
  echo "::error::LORE_INGEST_TOKEN repository secret is not set - ${FAILURE_NOUN}"
  exit 1
fi
# The Authorization header rides in a file so the token never
# appears on the curl command line (readable in the process table
# for the request duration; the env var stays readable to same-uid
# processes, so this narrows the exposure, not eliminates it).
AUTH_FILE="$(mktemp)"
BODY_FILE="$(mktemp)"
trap 'rm -f "${AUTH_FILE}" "${BODY_FILE}"' EXIT
printf 'Authorization: Bearer %s\n' "${LORE_INGEST_TOKEN}" > "${AUTH_FILE}"
# Capture the HTTP status instead of curl -f: a blanket warning once
# masked a permanent 401 (unset token) as transient for a repo's
# entire history. curl exits non-zero here only when no HTTP
# response arrived, where -w prints 000.
CURL_EXIT=0
HTTP_STATUS=$(curl -s -o "${BODY_FILE}" -w "%{http_code}" -X POST \
  -H @"${AUTH_FILE}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}" \
  "${LORE_INGEST_URL}${ENDPOINT_SUFFIX}") || CURL_EXIT=$?
echo "Lore endpoint ${ENDPOINT_SUFFIX} returned HTTP ${HTTP_STATUS:-000} (curl exit ${CURL_EXIT})"
# Prefix each body line with '| ': the runner strips leading
# whitespace before parsing ::workflow-commands::, so only a
# non-whitespace prefix stops a response body from forging one. The
# echo keeps the annotations below on a fresh line even when the
# body has no trailing newline.
head -c 4096 "${BODY_FILE}" | sed 's/^/| /'
echo
# A URL that cannot be parsed (exit 3) or resolved (exit 6) is a
# misconfigured LORE_INGEST_URL, not a transient blip - hard-fail
# like the unset checks above. TLS failures (exit 35/51/60) stay in
# the warn arm below: cert rotation windows are genuinely transient.
if [ "${CURL_EXIT}" = "3" ] || [ "${CURL_EXIT}" = "6" ]; then
  echo "::error::curl could not reach ${LORE_INGEST_URL} (exit ${CURL_EXIT}) - ${FAILURE_NOUN}"
  exit 1
fi
case "${HTTP_STATUS}" in
  2??)
    ;;
  5??|408|429|000|"")
    # Server-side trouble, throttling, or a network blip is
    # plausibly transient - warn and rely on the next doc push to
    # retry. This workflow runs on push to main and never blocks a
    # merge.
    echo "::warning::Lore endpoint ${ENDPOINT_SUFFIX} returned HTTP ${HTTP_STATUS:-000} (transient - next doc push retries)"
    ;;
  *)
    # Anything else (4xx auth/config, unexpected redirects) is
    # permanent - a retry will not fix it, so fail the run.
    echo "::error::Lore endpoint ${ENDPOINT_SUFFIX} returned HTTP ${HTTP_STATUS} - ${FAILURE_NOUN}"
    exit 1
    ;;
esac
