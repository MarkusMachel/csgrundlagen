package store

import (
	"context"
	"fmt"
)

const searchLimit = 5

// Search matches questions (prompt or tag), materials (title, description or
// tag) and, for a signed-in user, their own tests by name.
func (s *Store) Search(ctx context.Context, q, locale, userID string) (SearchResults, error) {
	p := likePattern(q)
	res := SearchResults{Questions: []SearchResultItem{}, Materials: []SearchResultItem{}, Tests: []SearchResultItem{}}

	var err error
	res.Questions, err = collect[SearchResultItem](s.pool.Query(ctx, `
		SELECT q.id, COALESCE(tr.prompt, q.prompt),
		       COALESCE((SELECT string_agg(t.name, ', ' ORDER BY t.name)
		                 FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
		                 WHERE qt.question_id = q.id), '')
		FROM questions q
		LEFT JOIN question_translations tr ON tr.question_id = q.id AND tr.locale = $1::locale
		WHERE COALESCE(tr.prompt, q.prompt) ILIKE $2
		   OR EXISTS (SELECT 1 FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
		              WHERE qt.question_id = q.id AND t.name ILIKE $2)
		ORDER BY q.created_at, q.id LIMIT $3`, locale, p, searchLimit))
	if err != nil {
		return res, err
	}

	res.Materials, err = collect[SearchResultItem](s.pool.Query(ctx, `
		SELECT m.id, m.title, m.type::text FROM materials m
		WHERE m.title ILIKE $1 OR m.description ILIKE $1
		   OR EXISTS (SELECT 1 FROM material_tags mt JOIN tags t ON t.id = mt.tag_id
		              WHERE mt.material_id = m.id AND t.name ILIKE $1)
		ORDER BY m.created_at, m.id LIMIT $2`, p, searchLimit))
	if err != nil {
		return res, err
	}

	if userID != "" {
		rows, err := s.pool.Query(ctx, `
			SELECT t.id, t.name,
			       (SELECT count(*) FROM custom_test_questions c WHERE c.test_id = t.id)
			FROM custom_tests t
			WHERE t.owner_id = $1 AND t.name ILIKE $2
			ORDER BY t.created_at DESC LIMIT $3`, userID, p, searchLimit)
		if err != nil {
			return res, err
		}
		defer rows.Close()
		for rows.Next() {
			var item SearchResultItem
			var n int
			if err := rows.Scan(&item.ID, &item.Title, &n); err != nil {
				return res, err
			}
			item.Subtitle = fmt.Sprintf("%d questions", n)
			res.Tests = append(res.Tests, item)
		}
		if err := rows.Err(); err != nil {
			return res, err
		}
	}
	return res, nil
}
