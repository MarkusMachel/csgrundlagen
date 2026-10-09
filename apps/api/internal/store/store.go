package store

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func (s *Store) Ping(ctx context.Context) error { return s.pool.Ping(ctx) }

var uuidRe = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// IsUUID reports whether s is a canonical UUID. Ids that aren't can't match
// any row, so handlers answer 404 instead of sending them to Postgres.
func IsUUID(s string) bool { return uuidRe.MatchString(s) }

// NormalizeLocale maps anything other than a supported locale to 'en'.
func NormalizeLocale(l string) string {
	switch l {
	case "pt-BR", "de":
		return l
	default:
		return "en"
	}
}

// likePattern turns user input into a case-insensitive substring pattern,
// escaping LIKE metacharacters so they match literally.
func likePattern(q string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return "%" + r.Replace(q) + "%"
}

func notFound(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

// withTx runs fn in a transaction, committing on success.
func (s *Store) withTx(ctx context.Context, fn func(pgx.Tx) error) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// ensureTags inserts any missing tag names and returns nothing; callers link
// by name afterwards.
func ensureTags(ctx context.Context, tx pgx.Tx, tags []string) error {
	if len(tags) == 0 {
		return nil
	}
	_, err := tx.Exec(ctx,
		`INSERT INTO tags (name) SELECT DISTINCT unnest($1::text[]) ON CONFLICT (name) DO NOTHING`, tags)
	return err
}

func nonNil[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}
