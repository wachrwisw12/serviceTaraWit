package migrations

import (
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"fmt"
	"io/fs"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SQLFiles is compiled into the migration command so production does not need
// to mount the source directory separately.
//
//go:embed *.sql
var SQLFiles embed.FS

const migrationLockID int64 = 730025081

type Status struct {
	Name      string
	Applied   bool
	AppliedAt *time.Time
}

type migration struct {
	name     string
	sql      string
	checksum string
}

func ensureTable(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name TEXT PRIMARY KEY,
			checksum CHAR(64) NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	return err
}

func load() ([]migration, error) {
	entries, err := fs.ReadDir(SQLFiles, ".")
	if err != nil {
		return nil, fmt.Errorf("read embedded migrations: %w", err)
	}

	items := make([]migration, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		body, err := SQLFiles.ReadFile(entry.Name())
		if err != nil {
			return nil, fmt.Errorf("read migration %s: %w", entry.Name(), err)
		}

		hash := sha256.Sum256(body)
		items = append(items, migration{
			name:     entry.Name(),
			sql:      string(body),
			checksum: hex.EncodeToString(hash[:]),
		})
	}

	sort.Slice(items, func(i, j int) bool { return items[i].name < items[j].name })
	return items, nil
}

func applied(ctx context.Context, pool *pgxpool.Pool) (map[string]Status, map[string]string, error) {
	var tableExists bool
	if err := pool.QueryRow(ctx, `SELECT to_regclass('public.schema_migrations') IS NOT NULL`).Scan(&tableExists); err != nil {
		return nil, nil, fmt.Errorf("check schema_migrations: %w", err)
	}
	if !tableExists {
		return map[string]Status{}, map[string]string{}, nil
	}

	rows, err := pool.Query(ctx, `SELECT name, checksum, applied_at FROM schema_migrations ORDER BY name`)
	if err != nil {
		return nil, nil, fmt.Errorf("query schema_migrations: %w", err)
	}
	defer rows.Close()

	statuses := make(map[string]Status)
	checksums := make(map[string]string)
	for rows.Next() {
		var name, checksum string
		var appliedAt time.Time
		if err := rows.Scan(&name, &checksum, &appliedAt); err != nil {
			return nil, nil, fmt.Errorf("scan schema migration: %w", err)
		}
		statuses[name] = Status{Name: name, Applied: true, AppliedAt: &appliedAt}
		checksums[name] = checksum
	}

	return statuses, checksums, rows.Err()
}

func ListStatus(ctx context.Context, pool *pgxpool.Pool) ([]Status, error) {
	items, err := load()
	if err != nil {
		return nil, err
	}
	statuses, checksums, err := applied(ctx, pool)
	if err != nil {
		return nil, err
	}

	result := make([]Status, 0, len(items))
	for _, item := range items {
		status, ok := statuses[item.name]
		if ok && checksums[item.name] != item.checksum {
			return nil, fmt.Errorf("migration %s was changed after it was applied", item.name)
		}
		if !ok {
			status = Status{Name: item.name}
		}
		result = append(result, status)
	}
	return result, nil
}

func Up(ctx context.Context, pool *pgxpool.Pool) ([]string, error) {
	items, err := load()
	if err != nil {
		return nil, err
	}
	if err := ensureTable(ctx, pool); err != nil {
		return nil, fmt.Errorf("create schema_migrations: %w", err)
	}

	conn, err := pool.Acquire(ctx)
	if err != nil {
		return nil, fmt.Errorf("acquire migration connection: %w", err)
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, `SELECT pg_advisory_lock($1)`, migrationLockID); err != nil {
		return nil, fmt.Errorf("lock migrations: %w", err)
	}
	defer conn.Exec(context.Background(), `SELECT pg_advisory_unlock($1)`, migrationLockID) //nolint:errcheck

	completed := make([]string, 0)
	for _, item := range items {
		var storedChecksum string
		err := conn.QueryRow(ctx, `SELECT checksum FROM schema_migrations WHERE name = $1`, item.name).Scan(&storedChecksum)
		if err == nil {
			if storedChecksum != item.checksum {
				return completed, fmt.Errorf("migration %s was changed after it was applied", item.name)
			}
			continue
		}
		if err != pgx.ErrNoRows {
			return completed, fmt.Errorf("check migration %s: %w", item.name, err)
		}

		tx, err := conn.Begin(ctx)
		if err != nil {
			return completed, fmt.Errorf("begin migration %s: %w", item.name, err)
		}
		if _, err := tx.Exec(ctx, item.sql); err != nil {
			tx.Rollback(ctx) //nolint:errcheck
			return completed, fmt.Errorf("apply migration %s: %w", item.name, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)`, item.name, item.checksum); err != nil {
			tx.Rollback(ctx) //nolint:errcheck
			return completed, fmt.Errorf("record migration %s: %w", item.name, err)
		}
		if err := tx.Commit(ctx); err != nil {
			return completed, fmt.Errorf("commit migration %s: %w", item.name, err)
		}
		completed = append(completed, item.name)
	}

	return completed, nil
}
