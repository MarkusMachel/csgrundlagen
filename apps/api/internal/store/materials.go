package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
)

const materialSelect = `
SELECT m.id, m.type::text, m.title, m.url, m.author, m.description,
       COALESCE((SELECT array_agg(t.name ORDER BY t.name)
                 FROM material_tags mt JOIN tags t ON t.id = mt.tag_id
                 WHERE mt.material_id = m.id), '{}'),
       COALESCE((SELECT array_agg(mq.question_id::text ORDER BY mq.question_id)
                 FROM material_questions mq WHERE mq.material_id = m.id), '{}')
FROM materials m`

func (s *Store) queryMaterials(ctx context.Context, sql string, args ...any) ([]Material, error) {
	rows, err := s.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Material])
	return nonNil(out), err
}

var materialTypes = map[string]bool{"book": true, "video": true, "article": true, "link": true}

// Materials lists curated material, optionally filtered by type and by
// having any of the given tags.
func (s *Store) Materials(ctx context.Context, typ string, tags []string) ([]Material, error) {
	var where []string
	var args []any
	if typ != "" {
		if !materialTypes[typ] {
			return []Material{}, nil
		}
		args = append(args, typ)
		where = append(where, fmt.Sprintf("m.type = $%d::material_type", len(args)))
	}
	if len(tags) > 0 {
		args = append(args, tags)
		where = append(where, fmt.Sprintf(`EXISTS (SELECT 1 FROM material_tags mt JOIN tags t ON t.id = mt.tag_id
			WHERE mt.material_id = m.id AND t.name = ANY($%d::text[]))`, len(args)))
	}
	sql := materialSelect
	if len(where) > 0 {
		sql += " WHERE " + strings.Join(where, " AND ")
	}
	return s.queryMaterials(ctx, sql+" ORDER BY m.created_at, m.id", args...)
}

func (s *Store) MaterialsForQuestion(ctx context.Context, questionID string) ([]Material, error) {
	return s.queryMaterials(ctx, materialSelect+`
		JOIN material_questions link ON link.material_id = m.id AND link.question_id = $1
		ORDER BY m.created_at, m.id`, questionID)
}

type NewMaterial struct {
	Type               string   `json:"type"`
	Title              string   `json:"title"`
	URL                string   `json:"url"`
	Author             *string  `json:"author"`
	Description        *string  `json:"description"`
	Tags               []string `json:"tags"`
	RelatedQuestionIDs []string `json:"relatedQuestionIds"`
}

func emptyToNil(s *string) *string {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	return s
}

func (s *Store) CreateMaterial(ctx context.Context, createdBy string, n NewMaterial) (Material, error) {
	if !materialTypes[n.Type] {
		return Material{}, ErrInvalid{"type must be book, video, article or link"}
	}
	if strings.TrimSpace(n.Title) == "" || strings.TrimSpace(n.URL) == "" {
		return Material{}, ErrInvalid{"title and url are required"}
	}
	if len(n.Tags) == 0 {
		return Material{}, ErrInvalid{"at least one tag is required"}
	}
	for _, id := range n.RelatedQuestionIDs {
		if !IsUUID(id) {
			return Material{}, ErrInvalid{"relatedQuestionIds contains an invalid id"}
		}
	}

	var id string
	err := s.withTx(ctx, func(tx pgx.Tx) error {
		if err := tx.QueryRow(ctx, `
			INSERT INTO materials (type, title, url, author, description, created_by)
			VALUES ($1::material_type, $2, $3, $4, $5, $6) RETURNING id`,
			n.Type, n.Title, n.URL, emptyToNil(n.Author), emptyToNil(n.Description), createdBy,
		).Scan(&id); err != nil {
			return err
		}
		if err := ensureTags(ctx, tx, n.Tags); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO material_tags (material_id, tag_id)
			SELECT $1, id FROM tags WHERE name = ANY($2::text[])`, id, n.Tags); err != nil {
			return err
		}
		if len(n.RelatedQuestionIDs) > 0 {
			if _, err := tx.Exec(ctx, `
				INSERT INTO material_questions (material_id, question_id)
				SELECT $1, q.id FROM questions q WHERE q.id = ANY($2::uuid[])
				ON CONFLICT DO NOTHING`, id, n.RelatedQuestionIDs); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return Material{}, err
	}
	ms, err := s.queryMaterials(ctx, materialSelect+` WHERE m.id = $1`, id)
	if err != nil {
		return Material{}, err
	}
	if len(ms) == 0 {
		return Material{}, ErrNotFound
	}
	return ms[0], nil
}
