package store

import (
	"context"
	"errors"
	"slices"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// MaxSavedFilters is how many filters one user can keep.
const MaxSavedFilters = 20

// FilterSpec is the question filter the web app shows (FilterState in
// apps/web/src/features/questions/components/QuestionFilters.tsx).
type FilterSpec struct {
	Search       string   `json:"search"`
	Tags         []string `json:"tags"`
	Difficulties []string `json:"difficulties"`
	Status       string   `json:"status"`
	Sort         string   `json:"sort"`
	Seed         string   `json:"seed"`
}

type SavedFilter struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Filters   FilterSpec `json:"filters"`
	CreatedAt time.Time  `json:"createdAt"`
}

// FilterChange holds the fields to change; nil leaves one as it is.
type FilterChange struct {
	Name    *string     `json:"name"`
	Filters *FilterSpec `json:"filters"`
}

func (f *FilterSpec) normalize() error {
	f.Search = strings.TrimSpace(f.Search)
	if len(f.Search) > 200 || len(f.Seed) > 20 || len(f.Tags) > 30 {
		return ErrInvalid{"filter is too long"}
	}
	if f.Tags == nil {
		f.Tags = []string{}
	}
	if f.Difficulties == nil {
		f.Difficulties = []string{}
	}
	for _, d := range f.Difficulties {
		if !slices.Contains([]string{"easy", "medium", "hard"}, d) {
			return ErrInvalid{"difficulties must be easy, medium or hard"}
		}
	}
	if !slices.Contains([]string{"", "unanswered", "answered", "wrong", "bookmarked"}, f.Status) {
		return ErrInvalid{"status must be unanswered, answered, wrong or bookmarked"}
	}
	if f.Sort == "" {
		f.Sort = "oldest"
	}
	if !slices.Contains([]string{"oldest", "newest", "random"}, f.Sort) {
		return ErrInvalid{"sort must be oldest, newest or random"}
	}
	return nil
}

func filterName(name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" || len([]rune(name)) > 60 {
		return "", ErrInvalid{"name is required (at most 60 characters)"}
	}
	return name, nil
}

func uniqueName(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrConflict{"you already have a filter with this name"}
	}
	return err
}

func (s *Store) SavedFilters(ctx context.Context, userID string) ([]SavedFilter, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, name, filters, created_at FROM saved_filters
		WHERE user_id = $1 ORDER BY lower(name)`, userID)
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, func(r pgx.CollectableRow) (SavedFilter, error) {
		var f SavedFilter
		err := r.Scan(&f.ID, &f.Name, &f.Filters, &f.CreatedAt)
		return f, err
	})
	return nonNil(out), err
}

func (s *Store) SaveFilter(ctx context.Context, userID, name string, spec FilterSpec) (SavedFilter, error) {
	name, err := filterName(name)
	if err != nil {
		return SavedFilter{}, err
	}
	if err := spec.normalize(); err != nil {
		return SavedFilter{}, err
	}
	var f SavedFilter
	err = s.withTx(ctx, func(tx pgx.Tx) error {
		// the user row lock makes the limit hold under concurrent saves
		var n int
		if err := tx.QueryRow(ctx, `
			SELECT (SELECT count(*) FROM saved_filters WHERE user_id = u.id)
			FROM users u WHERE u.id = $1 FOR UPDATE`, userID).Scan(&n); err != nil {
			return notFound(err)
		}
		if n >= MaxSavedFilters {
			return ErrConflict{"you can keep up to 20 saved filters; delete one first"}
		}
		err := tx.QueryRow(ctx, `
			INSERT INTO saved_filters (user_id, name, filters) VALUES ($1, $2, $3)
			RETURNING id, name, filters, created_at`, userID, name, spec,
		).Scan(&f.ID, &f.Name, &f.Filters, &f.CreatedAt)
		return uniqueName(err)
	})
	return f, err
}

func (s *Store) ChangeFilter(ctx context.Context, userID, id string, c FilterChange) (SavedFilter, error) {
	var name *string
	if c.Name != nil {
		n, err := filterName(*c.Name)
		if err != nil {
			return SavedFilter{}, err
		}
		name = &n
	}
	if c.Filters != nil {
		if err := c.Filters.normalize(); err != nil {
			return SavedFilter{}, err
		}
	}
	var f SavedFilter
	err := s.pool.QueryRow(ctx, `
		UPDATE saved_filters SET name = COALESCE($3, name), filters = COALESCE($4, filters)
		WHERE id = $1 AND user_id = $2
		RETURNING id, name, filters, created_at`, id, userID, name, c.Filters,
	).Scan(&f.ID, &f.Name, &f.Filters, &f.CreatedAt)
	return f, notFound(uniqueName(err))
}

func (s *Store) DeleteFilter(ctx context.Context, userID, id string) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM saved_filters WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
