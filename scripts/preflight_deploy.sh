#!/usr/bin/env bash
# Run before admin production deploy.
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "${DEPLOY_SKIP_PREFLIGHT:-false}" == "true" ]]; then
  echo "[admin-preflight] SKIP (DEPLOY_SKIP_PREFLIGHT=true)" >&2
  exit 0
fi

echo "[admin-preflight] 1/2 npm run lint..."
npm run lint

echo "[admin-preflight] 2/2 npm run test:newsdesk..."
npm run test:newsdesk

echo "[admin-preflight] PASS"