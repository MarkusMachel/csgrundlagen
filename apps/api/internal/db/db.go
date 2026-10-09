// Package db owns the Postgres connection pool and the schema migrations.
package db

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

// Connect opens a pool and verifies the database is reachable.
func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("open pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return pool, nil
}

// Migrate applies every embedded migrations/*.sql file not yet recorded in
// schema_migrations, in filename order, each inside its own transaction.
// Applied files must never be edited — add a new numbered file instead.
func Migrate(ctx context.Context, pool *pgxpool.Pool, log *slog.Logger) error {
	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	names, err := fs.Glob(migrationFiles, "migrations/*.sql")
	if err != nil {
		return err
	}
	sort.Strings(names)

	for _, name := range names {
		version := strings.TrimSuffix(strings.TrimPrefix(name, "migrations/"), ".sql")

		var applied bool
		if err := pool.QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)`, version,
		).Scan(&applied); err != nil {
			return fmt.Errorf("check migration %s: %w", version, err)
		}
		if applied {
			continue
		}

		sql, err := migrationFiles.ReadFile(name)
		if err != nil {
			return err
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}
		// No arguments → simple protocol, so multi-statement files are fine.
		if _, err := tx.Exec(ctx, string(sql)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("apply migration %s: %w", version, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, version); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("record migration %s: %w", version, err)
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
		log.Info("applied migration", "version", version)
	}
	return nil
}
