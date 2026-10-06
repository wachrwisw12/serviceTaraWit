#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Deploy binary ไป Pi โดยไม่ยุ่งกับ DB
#
# Usage:
#   ./deploy-binary.sh                  # build + deploy
#   PI_HOST=pi@192.168.1.10 ./deploy-binary.sh
#   ./deploy-binary.sh --skip-build     # deploy binary ที่ build ไว้แล้ว
# ═══════════════════════════════════════════════════════════════

PI_HOST="${PI_HOST:-pi}"
PI_DIR="${PI_DIR:-/home/pi/servicetarawit}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
CONTAINER_API="${CONTAINER_API:-tarawit-api}"
BINARY="server/tarawit-api-arm64"
RUNTIME_DOCKERFILE="server/Dockerfile.prod"
RUNTIME_DOCKERIGNORE="server/.dockerignore"

info()  { printf "✅ %s\n" "$*"; }
error() { printf "❌ %s\n" "$*" >&2; exit 1; }

# ── Build ──────────────────────────────────────────────────────
if [[ "${1:-}" != "--skip-build" ]]; then
  info "Building binary for linux/arm64..."
  make -C server build
fi

[ -f "$BINARY" ] || error "Binary not found: $BINARY — run without --skip-build first"
[ -f "$RUNTIME_DOCKERFILE" ] || error "Runtime Dockerfile not found: $RUNTIME_DOCKERFILE"
[ -f "$RUNTIME_DOCKERIGNORE" ] || error "Docker ignore file not found: $RUNTIME_DOCKERIGNORE"
[ -f "$COMPOSE_FILE" ] || error "Compose file not found: $COMPOSE_FILE"

# ── Copy to Pi ─────────────────────────────────────────────────
info "Preparing the runtime-only API directory on $PI_HOST"
ssh "$PI_HOST" "mkdir -p '$PI_DIR/server/keys'"

info "Copying binary and production runtime files"
scp "$BINARY" "$PI_HOST:$PI_DIR/server/tarawit-api-arm64"
scp "$RUNTIME_DOCKERFILE" "$PI_HOST:$PI_DIR/server/Dockerfile.prod"
scp "$RUNTIME_DOCKERIGNORE" "$PI_HOST:$PI_DIR/server/.dockerignore"
scp -r server/keys/. "$PI_HOST:$PI_DIR/server/keys/"

# ── Rebuild runtime image + replace API container ─────────────
# Dockerfile.prod แค่ COPY binary เข้า Alpine image ไม่มี Go build stage
info "Creating runtime image from binary and replacing API container..."
ssh "$PI_HOST" bash -s <<REMOTE
set -euo pipefail
cd "$PI_DIR"

case "\$(uname -m)" in
  aarch64|arm64) ;;
  *) echo "❌ This binary requires a 64-bit ARM Pi (found: \$(uname -m))"; exit 1 ;;
esac

chmod 0755 "$BINARY"

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

# สร้างเฉพาะ runtime image ของ API แล้ว replace container เดิม
"\${compose[@]}" build api
"\${compose[@]}" up -d --no-deps --force-recreate api

echo "⏳ Waiting for API health check..."
for i in \$(seq 1 20); do
  if "\${compose[@]}" exec -T api wget -q -O /dev/null http://127.0.0.1:8000/health 2>/dev/null; then
    echo "✅ API is healthy"
    exit 0
  fi
  sleep 1
done
echo "❌ API health check failed — check logs:"
docker logs --tail=30 $CONTAINER_API
exit 1
REMOTE

info "Deploy complete — DB unchanged"
