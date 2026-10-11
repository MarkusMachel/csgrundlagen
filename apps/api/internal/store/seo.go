package store

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

// PageEntry is a public page for search engines: a question or design
// challenge, when it last changed, and enough to title a link.
type PageEntry struct {
	ID       string
	Type     string
	Prompt   string
	Modified time.Time
}

// PublicPages lists every question and design challenge, oldest first, with
// the time of its latest edit (or creation).
func (s *Store) PublicPages(ctx context.Context) ([]PageEntry, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT q.id, q.type::text, q.prompt,
		       COALESCE((SELECT max(r.created_at) FROM question_revisions r WHERE r.question_id = q.id), q.created_at)
		FROM questions q
		ORDER BY q.created_at, q.id`)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (PageEntry, error) {
		var e PageEntry
		err := r.Scan(&e.ID, &e.Type, &e.Prompt, &e.Modified)
		return e, err
	})
}
