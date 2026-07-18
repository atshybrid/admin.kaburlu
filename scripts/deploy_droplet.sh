#!/usr/bin/env bash
# Deploy admin.kaburlu (Next.js) to production droplet.
# Requires: .deploy.env with DEPLOY_HOST (+ optional DEPLOY_SSH_KEY)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$REPO_ROOT/.deploy.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.deploy.env"
  set +a
fi

set -Eeuo pipefail
trap 'echo "[admin-deploy] ERROR at line $LINENO: $BASH_COMMAND" >&2' ERR

HOST="${DEPLOY_HOST:-${DO_SERVER_IP:-${DROPLET_HOST:-}}}"
USER_NAME="${DEPLOY_USER:-deploy}"
APP_DIR="${DEPLOY_PATH:-/home/deploy/admin.kaburlu}"
APP_NAME="${DEPLOY_APP_NAME:-kaburlu-admin}"
DEPLOY_PORT="${DEPLOY_PORT:-3000}"

if [[ -z "$HOST" ]]; then
  echo "[admin-deploy] Set DEPLOY_HOST in .deploy.env (see .deploy.env.example)" >&2
  exit 1
fi

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=( -i "$DEPLOY_SSH_KEY" )
fi

echo "[admin-deploy] Deploying to $USER_NAME@$HOST:$APP_DIR"
ssh "${SSH_OPTS[@]}" "$USER_NAME@$HOST" \
  APP_DIR="$APP_DIR" APP_NAME="$APP_NAME" DEPLOY_PORT="$DEPLOY_PORT" 'bash -se' <<'REMOTE'
set -Eeuo pipefail
cd "$APP_DIR"

echo "[remote] git pull origin main"
git fetch origin main
git reset --hard origin/main

echo "[remote] npm ci && npm run build"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}"
if ! npm ci; then npm install; fi
npm run build

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "[remote] pm2 reload $APP_NAME"
  pm2 reload "$APP_NAME" --update-env
else
  echo "[remote] pm2 start npm --name $APP_NAME -- start"
  pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save

echo "[remote] Health check port $DEPLOY_PORT"
OK=0
for i in $(seq 1 20); do
  if curl -fsS --max-time 3 "http://127.0.0.1:$DEPLOY_PORT" >/dev/null 2>&1; then
    OK=1
    echo "[remote] Admin responding (attempt $i)"
    break
  fi
  sleep 2
done

if [[ "$OK" -ne 1 ]]; then
  echo "[remote] WARN: HTTP check failed — verify nginx + pm2 logs"
  pm2 logs "$APP_NAME" --lines 40 --nostream || true
fi

echo "[remote] Admin deploy done"
REMOTE

echo "[admin-deploy] Completed."
