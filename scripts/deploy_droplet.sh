#!/usr/bin/env bash
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${KABURLU_ALLOW_DROPLET_DEPLOY:-}" != "1" ]]; then
  exec bash "$_SCRIPT_DIR/deploy_disabled.sh"
fi
# Deploy admin.kaburlu (Next.js) to production droplet via Mac build + rsync.
# No git operations on server. No .env overwrite.
#
# Requires: .deploy.env with DEPLOY_HOST (+ optional DEPLOY_SSH_KEY)
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f "$REPO_ROOT/.deploy.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.deploy.env"
  set +a
fi

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

if [[ "${DEPLOY_SKIP_PREFLIGHT:-false}" != "true" ]]; then
  echo "[admin-deploy] Running preflight..."
  bash "$REPO_ROOT/scripts/preflight_deploy.sh"
fi

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

echo "[admin-deploy] Building locally (preserves uncommitted working tree)..."
npm run build

echo "[admin-deploy] Uploading build to $USER_NAME@$HOST:$APP_DIR ..."
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" \
  --exclude node_modules \
  --exclude .git \
  --exclude .env.local \
  --exclude .backup \
  "$REPO_ROOT/.next/" "$USER_NAME@$HOST:$APP_DIR/.next_new/"
rsync -az -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_ROOT/package.json" \
  "$REPO_ROOT/package-lock.json" \
  "$REPO_ROOT/next.config.js" \
  "$USER_NAME@$HOST:$APP_DIR/"
rsync -az -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_ROOT/public/" "$USER_NAME@$HOST:$APP_DIR/public/"

# Optional standalone server bundle (output: 'standalone' in next.config.js)
if [[ -d "$REPO_ROOT/.next/standalone" ]]; then
  rsync -az -e "ssh ${SSH_OPTS[*]}" \
    "$REPO_ROOT/.next/standalone/" "$USER_NAME@$HOST:$APP_DIR/.next_standalone_new/"
fi

ssh "${SSH_OPTS[@]}" "$USER_NAME@$HOST" \
  APP_DIR="$APP_DIR" APP_NAME="$APP_NAME" DEPLOY_PORT="$DEPLOY_PORT" 'bash -se' <<'REMOTE'
set -Eeuo pipefail
cd "$APP_DIR"

if [[ ! -d .next_new ]]; then
  echo "[remote] .next_new missing" >&2
  exit 1
fi

echo "[remote] Backing up .next"
mkdir -p backups
if [[ -d .next ]]; then
  rm -rf .next_prev
  cp -a .next .next_prev
  tar -czf "backups/admin-next-$(date +%Y%m%d%H%M%S).tar.gz" .next 2>/dev/null || echo "[remote] WARN: tar backup failed"
fi

rm -rf .next
mv .next_new .next

if [[ -d .next_standalone_new ]]; then
  rm -rf .next_standalone_prev
  [[ -d .next_standalone ]] && cp -a .next_standalone .next_standalone_prev || true
  rm -rf .next_standalone
  mv .next_standalone_new .next_standalone
fi

echo "[remote] npm install --omit=dev (lockfile from Mac)"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}"
if ! npm install --omit=dev --ignore-scripts --no-audit --no-fund; then
  echo "[remote] npm install failed" >&2
  exit 1
fi

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "[remote] pm2 reload $APP_NAME"
  pm2 reload "$APP_NAME" --update-env
else
  echo "[remote] pm2 start npm --name $APP_NAME -- start"
  pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save

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
  echo "[remote] Health check failed"
  pm2 logs "$APP_NAME" --lines 50 --nostream || true
  exit 1
fi

echo "[remote] Admin deploy done"
REMOTE

echo "[admin-deploy] Completed."