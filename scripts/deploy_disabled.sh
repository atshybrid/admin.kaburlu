#!/usr/bin/env bash
set -euo pipefail
cat <<'EOF'
Production deploy DISABLED (local dev only until Coolify).
  npm run dev
  npm run preflight:deploy
See docs/DEPLOY_COOLIFY.md
EOF
exit 1