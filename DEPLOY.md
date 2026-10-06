# Production deployment

Production deployment is intentionally split into backup, migration, and
application replacement. The API does not run migrations during startup.

## Required environment

Create `.env.prod` (or `.env` on the Pi) with non-empty values for:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `CORS_ALLOW_ORIGINS` (the exact HTTPS origin; wildcard is rejected)

Never commit this file.

## Pre-deploy

Keep the existing Docker volumes. The API deployment does not require Go source
on the Pi: `deploy-binary.sh` sends the ARM64 binary, runtime Dockerfile,
production Compose file, and runtime keys. From the deployment directory,
confirm there is enough disk space and run:

```bash
./pre-deploy-check.sh
```

The check is read-only. The deploy script then creates a fresh logical backup
under `backups/`, verifies that the dump completed, packages the prebuilt API
binary into a small runtime image, builds the web/migration images, shows
migration status, and applies pending migrations before replacing the API
container. The API image does not contain Go and does not compile source code.

## Deploy

Build and send the ARM64 binary from the development machine:

```bash
./deploy-binary.sh
```

To run the full backup and migration flow from the Pi after the binary has been
copied there:

```bash
./deploy.sh
```

Run the full migration script only from a complete project checkout because the
migration image is built separately. It verifies that
`server/tarawit-api-arm64` and `server/Dockerfile.prod` exist and that the API
uses the runtime Dockerfile. `make -C server build` cross-compiles a static
`linux/arm64` binary; Docker only copies that binary into the runtime image.

For an API-only release, run `deploy-binary.sh` from the development machine.
The Pi does not need the Go source tree for this path. Any source directories
left from the old deployment are legacy files and are not used by the API image.

The current deployment target is a 64-bit Pi (`aarch64`). The deploy script
rejects other CPU architectures instead of starting an incompatible binary.

The expected pending production migrations are:

- `000011_add_nickname.sql`: adds `users.nickname`
- `000012_add_department_id.sql`: adds `users.department_id` and its FK

Both are forward-only and preserve existing rows.

## Verification

```bash
docker compose --env-file .env -f docker-compose.prod.yml ps
docker compose --env-file .env -f docker-compose.prod.yml logs --tail=100 api
docker exec tarawit-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT name, applied_at FROM schema_migrations ORDER BY name;"
```

Also verify user count, role mappings, uploaded avatars/attachments, login, and
the personnel create/edit screens.

## Rollback

Application rollback and database restore are separate decisions. The two
pending migrations are additive, so an older API can normally run while the new
nullable columns remain in place. Prefer rolling back only the API/Web image.

Restore a database dump only after stopping writes and confirming that data
created after the backup may be lost. Never restore automatically from the
deploy script.

## Network notes

- PostgreSQL is bound to `127.0.0.1:5432`, not every network interface.
- Nginx serves HTTP on the origin; TLS is expected to terminate at the external
  reverse proxy or tunnel.
- The upload and PostgreSQL named volumes must never be removed during deploy.
