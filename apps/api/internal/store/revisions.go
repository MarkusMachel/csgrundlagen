package store

import (
	"context"
	"encoding/json"
	"errors"
	"slices"
	"time"

	"github.com/jackc/pgx/v5"
)

// Revision is one saved version of a question.
type Revision struct {
	ID         int64       `json:"id"`
	Kind       string      `json:"kind"` // created, edited, restored or original
	EditorName *string     `json:"editorName,omitempty"`
	Snapshot   NewQuestion `json:"snapshot"`
	CreatedAt  time.Time   `json:"createdAt"`
	// RestoredFrom is set on "restored" revisions.
	RestoredFrom *int64 `json:"restoredFrom,omitempty"`
}

type revisionSnapshot struct {
	NewQuestion
	RestoredFrom *int64 `json:"restoredFrom,omitempty"`
}

// asInput turns a stored question back into the form's input shape.
func (q Question) asInput(materialIDs []string) NewQuestion {
	n := NewQuestion{
		Type: q.Type, Prompt: q.Prompt, Tags: q.Tags, Difficulty: q.Difficulty, Explanation: q.Explanation,
		Options: q.Options, CorrectOptionID: q.CorrectOptionID, CorrectOptionIDs: q.CorrectOptionIDs,
		CorrectAnswer: q.CorrectAnswer, Code: q.Code, CodeLanguage: q.CodeLanguage,
		ExpectedOutput: q.ExpectedOutput, RelatedMaterialIDs: materialIDs,
	}
	if q.Type == "ordering" && len(q.CorrectOrder) > 0 {
		// ordering input lists the options in their correct order
		byID := map[string]Option{}
		for _, o := range q.Options {
			byID[o.ID] = o
		}
		n.Options = nil
		for _, id := range q.CorrectOrder {
			n.Options = append(n.Options, byID[id])
		}
	}
	return n
}

func (s *Store) currentInput(ctx context.Context, id string) (NewQuestion, error) {
	q, err := s.GetQuestion(ctx, id, "en")
	if err != nil {
		return NewQuestion{}, err
	}
	rows, err := s.pool.Query(ctx, `SELECT material_id::text FROM material_questions WHERE question_id = $1 ORDER BY material_id`, id)
	if err != nil {
		return NewQuestion{}, err
	}
	ids, err := pgx.CollectRows(rows, pgx.RowTo[string])
	if err != nil {
		return NewQuestion{}, err
	}
	n := q.asInput(ids)
	return n, s.withOptionFeedback(ctx, id, &n)
}

func recordRevision(ctx context.Context, tx pgx.Tx, questionID, editorID, kind string, snap revisionSnapshot) error {
	if snap.RelatedMaterialIDs != nil {
		slices.Sort(snap.RelatedMaterialIDs)
	}
	raw, err := json.Marshal(snap)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO question_revisions (question_id, editor_id, kind, snapshot) VALUES ($1, $2, $3, $4)`,
		questionID, nullIfEmpty(editorID), kind, raw)
	return err
}

// hasRevisions reports whether a question already has history; questions
// from before history existed get their pre-edit state saved as "original".
func hasRevisions(ctx context.Context, tx pgx.Tx, questionID string) (bool, error) {
	var ok bool
	err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM question_revisions WHERE question_id = $1)`, questionID).Scan(&ok)
	return ok, err
}

// Revisions lists a question's versions, newest first.
func (s *Store) Revisions(ctx context.Context, questionID string) ([]Revision, error) {
	if err := s.questionExists(ctx, questionID); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		SELECT r.id, r.kind, u.name, r.snapshot, r.created_at
		FROM question_revisions r LEFT JOIN users u ON u.id = r.editor_id
		WHERE r.question_id = $1 ORDER BY r.id DESC`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Revision{}
	for rows.Next() {
		var r Revision
		var raw []byte
		if err := rows.Scan(&r.ID, &r.Kind, &r.EditorName, &raw, &r.CreatedAt); err != nil {
			return nil, err
		}
		var snap revisionSnapshot
		if err := json.Unmarshal(raw, &snap); err != nil {
			return nil, err
		}
		r.Snapshot, r.RestoredFrom = snap.NewQuestion, snap.RestoredFrom
		out = append(out, r)
	}
	return out, rows.Err()
}

// RestoreRevision saves an earlier version as the question's current content,
// recorded as a new "restored" revision (history is never rewritten).
func (s *Store) RestoreRevision(ctx context.Context, editorID, questionID string, revisionID int64) (Question, error) {
	var raw []byte
	err := s.pool.QueryRow(ctx, `SELECT snapshot FROM question_revisions WHERE id = $1 AND question_id = $2`,
		revisionID, questionID).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return Question{}, ErrNotFound
	}
	if err != nil {
		return Question{}, err
	}
	var snap revisionSnapshot
	if err := json.Unmarshal(raw, &snap); err != nil {
		return Question{}, err
	}
	// materials deleted since the snapshot can't be linked again
	snap.RelatedMaterialIDs, err = s.existingMaterials(ctx, snap.RelatedMaterialIDs)
	if err != nil {
		return Question{}, err
	}
	return s.saveQuestion(ctx, editorID, questionID, snap.NewQuestion, "restored", &revisionID)
}

func (s *Store) existingMaterials(ctx context.Context, ids []string) ([]string, error) {
	if len(ids) == 0 {
		return ids, nil
	}
	rows, err := s.pool.Query(ctx, `SELECT id::text FROM materials WHERE id::text = ANY($1) ORDER BY id`, ids)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowTo[string])
}
