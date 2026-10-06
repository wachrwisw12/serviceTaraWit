#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# pre-deploy-check.sh
# ตรวจสอบ data integrity ก่อน deploy migration ขึ้น prod
# รันบน prod server ก่อน deploy
# ============================================================

DB_CONTAINER="${1:-tarawit-postgres}"
DB_USER="${DB_USER:-yeawyow}"
DB_NAME="${DB_NAME:-tarawitDB}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass()  { echo -e "  ${GREEN}✅ PASS${NC} — $1"; }
warn()  { echo -e "  ${YELLOW}⚠️  WARN${NC} — $1"; }
fail()  { echo -e "  ${RED}❌ FAIL${NC} — $1"; FAILED=true; }

FAILED=false

echo "═══════════════════════════════════════════════"
echo " 🔍 Pre-Deploy Data Integrity Check"
echo "═══════════════════════════════════════════════"
echo ""

PSQL="docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -A -c"

# ── Check 1: Migration state ───────────────────────────
echo "📋 Migration State:"
APPLIED=$($PSQL "SELECT count(*) FROM schema_migrations;" 2>/dev/null || echo "0")
echo "  Applied migrations: $APPLIED"

for m in \
  000001_baseline.sql \
  000002_evaluation_instance_audit_log.sql \
  000002_iqa_module.sql \
  000003_attendance_geofence.sql \
  000004_attendance_edit_audit.sql \
  000005_attendance_time_windows.sql \
  000006_module_settings.sql \
  000007_add_missing_foreign_keys.sql \
  000008_drop_orphaned_sequences.sql \
  000009_rename_duplicate_fk_constraints.sql \
  000010_sync_permissions.sql; do
  EXISTS=$($PSQL "SELECT count(*) FROM schema_migrations WHERE name='$m';" 2>/dev/null || echo "0")
  if [ "$EXISTS" = "0" ]; then
    warn "Migration $m NOT yet applied — will be applied during deploy"
  fi
done
echo ""

echo "📋 Pending user columns:"
for column in nickname department_id; do
  EXISTS=$($PSQL "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='$column';")
  if [ "$EXISTS" = "1" ]; then
    pass "users.$column already exists"
  else
    warn "users.$column is pending and will be added"
  fi
done
echo ""

# ── Check 2: FK 000007 — users.position_id ─────────────
echo "🔗 FK Check: users.position_id → positions.id"
ORPHAN=$($PSQL "SELECT count(*) FROM users u LEFT JOIN positions p ON p.id = u.position_id WHERE u.position_id IS NOT NULL AND p.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
  $PSQL "SELECT id, first_name, last_name, position_id FROM users u LEFT JOIN positions p ON p.id = u.position_id WHERE u.position_id IS NOT NULL AND p.id IS NULL LIMIT 5;"
fi

# ── Check 3: FK 000007 — users.prefix_id ───────────────
echo "🔗 FK Check: users.prefix_id → prefixes.id"
ORPHAN=$($PSQL "SELECT count(*) FROM users u LEFT JOIN prefixes pr ON pr.id = u.prefix_id WHERE u.prefix_id IS NOT NULL AND pr.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

# ── Check 4: FK 000007 — users.person_type_id ──────────
echo "🔗 FK Check: users.person_type_id → person_types.id"
ORPHAN=$($PSQL "SELECT count(*) FROM users u LEFT JOIN person_types pt ON pt.id = u.person_type_id WHERE u.person_type_id IS NOT NULL AND pt.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

# ── Check 5: FK 000007 — evaluation_instance_evaluators.user_id ──
echo "🔗 FK Check: evaluation_instance_evaluators.user_id → users.id"
ORPHAN=$($PSQL "SELECT count(*) FROM evaluation_instance_evaluators e LEFT JOIN users u ON u.id = e.user_id WHERE u.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

# ── Check 6: FK 000007 — evaluation_targets.user_id ────
echo "🔗 FK Check: evaluation_targets.user_id → users.id"
ORPHAN=$($PSQL "SELECT count(*) FROM evaluation_targets t LEFT JOIN users u ON u.id = t.user_id WHERE u.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

# ── Check 7: FK 000007 — audit_log FKs ─────────────────
echo "🔗 FK Check: evaluation_instance_audit_log.actor_user_id → users.id"
ORPHAN=$($PSQL "SELECT count(*) FROM evaluation_instance_audit_log a LEFT JOIN users u ON u.id = a.actor_user_id WHERE a.actor_user_id IS NOT NULL AND u.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

echo "🔗 FK Check: evaluation_instance_audit_log.target_user_id → users.id"
ORPHAN=$($PSQL "SELECT count(*) FROM evaluation_instance_audit_log a LEFT JOIN users u ON u.id = a.target_user_id WHERE a.target_user_id IS NOT NULL AND u.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

# ── Check 8: FK 000007 — line_login_states.user_id ─────
echo "🔗 FK Check: line_login_states.user_id → users.id"
ORPHAN=$($PSQL "SELECT count(*) FROM line_login_states l LEFT JOIN users u ON u.id = l.user_id WHERE l.user_id IS NOT NULL AND u.id IS NULL;")
if [ "$ORPHAN" = "0" ]; then
  pass "No orphaned data"
else
  fail "$ORPHAN orphaned rows found!"
fi

# ── Check 9: Existing FK conflicts ─────────────────────
echo ""
echo "🔗 FK Check: Duplicate constraint names (will migration 000009 conflict?)"
DUP=$($PSQL "SELECT count(*) FROM pg_constraint WHERE contype='f' AND conname='fk_role';")
if [ "$DUP" -gt 0 ]; then
  warn "$DUP FK constraints named 'fk_role' exist — migration 000009 will rename them"
fi

# ── Check 10: Orphaned sequences ───────────────────────
echo ""
echo "📦 Sequence Check: Orphaned sequences (migration 000008 will drop)"
for seq in departments_id_seq1 positions_id_seq1 prefixes_id_seq1; do
  EXISTS=$($PSQL "SELECT count(*) FROM pg_sequences WHERE sequencename='$seq' AND schemaname='public';")
  if [ "$EXISTS" = "1" ]; then
    warn "Sequence $seq exists — will be dropped"
  else
    pass "Sequence $seq already gone"
  fi
done

# ── Summary ────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
if [ "$FAILED" = true ]; then
  echo -e " ${RED}❌ DEPLOY BLOCKED — Fix orphaned data first!${NC}"
  echo ""
  echo "  Run these to see problem rows:"
  echo "  docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME \\"
  echo "    -c \"SELECT * FROM users u LEFT JOIN positions p ON p.id = u.position_id"
  echo "         WHERE u.position_id IS NOT NULL AND p.id IS NULL;\""
  exit 1
else
  echo -e " ${GREEN}✅ ALL CHECKS PASSED — Safe to deploy!${NC}"
  exit 0
fi
