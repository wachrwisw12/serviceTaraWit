#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$PROJECT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKUP_DIR="${BACKUP_DIR:-backups}"

if [ ! -f "$ENV_FILE" ] && [ -f .env ]; then
  ENV_FILE=".env"
fi

error() { printf '❌ %s\n' "$*" >&2; exit 1; }
info() { printf '✅ %s\n' "$*"; }

command -v docker >/dev/null 2>&1 || error "docker not found"
[ -f "$ENV_FILE" ] || error "environment file not found: $ENV_FILE"
[ -f "$COMPOSE_FILE" ] || error "compose file not found: $COMPOSE_FILE"
[ -f server/Dockerfile.prod ] || error "server/Dockerfile.prod not found; sync the complete project to the Pi"
[ -f server/tarawit-api-arm64 ] || error "server/tarawit-api-arm64 not found; build it before deploy with: make -C server build"
[ -x server/tarawit-api-arm64 ] || chmod 0755 server/tarawit-api-arm64

if ! grep -Eq '^[[:space:]]+context:[[:space:]]+\./server([[:space:]]|$)' "$COMPOSE_FILE" ||
   ! grep -Eq '^[[:space:]]+dockerfile:[[:space:]]+Dockerfile\.prod([[:space:]]|$)' "$COMPOSE_FILE"; then
  error "API must use the runtime-only server/Dockerfile.prod with server/ as its build context"
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${CORS_ALLOW_ORIGINS:?CORS_ALLOW_ORIGINS is required}"

case ",$CORS_ALLOW_ORIGINS," in
  *,\*,*) error "CORS_ALLOW_ORIGINS must not contain wildcard (*) in production" ;;
esac

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

if grep -R -n -- "+goose Down" server/db/migrations/*.sql; then
  error "migration files must be forward-only for the custom migration runner"
fi

info "Running read-only production checks"
DB_USER="$POSTGRES_USER" DB_NAME="$POSTGRES_DB" ./pre-deploy-check.sh

mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
info "Backing up database to $backup_file"
docker exec tarawit-postgres pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --clean --if-exists --no-owner --no-privileges > "$backup_file"
grep -q "PostgreSQL database dump complete" "$backup_file" \
  || error "database backup did not complete"

info "Building web/migration images and packaging the prebuilt API binary"
"${compose[@]}" build nginx api migrate

info "Checking migration status"
"${compose[@]}" --profile tools run --rm migrate status

info "Applying reviewed migrations"
MIGRATION_CONFIRM_DB="$POSTGRES_DB" \
  "${compose[@]}" --profile tools run --rm migrate up

info "Starting the new API and web containers"
"${compose[@]}" up -d --no-deps api
"${compose[@]}" up -d --no-deps nginx

for attempt in $(seq 1 30); do
  if "${compose[@]}" exec -T api wget -q -O /dev/null http://127.0.0.1:8000/health; then
    info "API health check passed"
    "${compose[@]}" ps
    exit 0
  fi
  sleep 1
done

"${compose[@]}" logs --tail=100 api
error "API health check failed; database backup is $backup_file"
