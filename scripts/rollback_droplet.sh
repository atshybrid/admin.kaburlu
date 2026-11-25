#!/usr/bin/env bash
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${KABURLU_ALLOW_DROPLET_DEPLOY:-}" != "1" ]]; then
  exec bash "$_SCRIPT_DIR/deploy_disabled.sh"
fi
# Restore admin .next from .next_prev (created by deploy_droplet.sh).
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$REPO_ROOT/.deploy.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.deploy.env"
  set +a
fi

HOST="${DEPLOY_HOST:-}"
USER_NAME="${DEPLOY_USER:-deploy}"
APP_DIR="${DEPLOY_PATH:-/home/deploy/admin.kaburlu}"
APP_NAME="${DEPLOY_APP_NAME:-kaburlu-admin}"
DEPLOY_PORT="${DEPLOY_PORT:-3000}"

if [[ -z "$HOST" ]]; then
  echo "[admin-rollback] DEPLOY_HOST required" >&2
  exit 1
fi

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

ssh "${SSH_OPTS[@]}" "$USER_NAME@$HOST" bash -se <<REMOTE
set -Eeuo pipefail
cd "$APP_DIR"
if [[ ! -d .next_prev ]]; then
  echo "[admin-rollback] .next_prev missing" >&2
  ls -1t backups/admin-next-*.tar.gz 2>/dev/null | head -3 >&2 || true
  exit 1
fi
rm -rf .next
cp -a .next_prev .next
pm2 reload "$APP_NAME" --update-env || pm2 restart "$APP_NAME"
sleep 4
curl -fsS --max-time 5 "http://127.0.0.1:$DEPLOY_PORT/" >/dev/null
echo "[admin-rollback] OK"
REMOTE