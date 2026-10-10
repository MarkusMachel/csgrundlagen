package store

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

// TestDraft is an unfinished attempt, saved so it can be resumed.
type TestDraft struct {
	Mode        string         `json:"mode"`
	QuestionIDs []string       `json:"questionIds,omitempty"`
	Answers     map[string]any `json:"answers"`
	ShuffleSeed int64          `json:"shuffleSeed"`
	StartedAt   time.Time      `json:"startedAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

// DraftSummary is what the test list shows about a draft.
type DraftSummary struct {
	Answered  int       `json:"answered"`
	Total     int       `json:"total"`
	StartedAt time.Time `json:"startedAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// maxDraftBytes keeps a draft to a sane size (answers to a few hundred questions).
const maxDraftBytes = 256 << 10

// SaveDraft creates or replaces the user's draft for a test they own.
// The start time is kept from the first save, so a timer can't be reset by
// saving again.
func (s *Store) SaveDraft(ctx context.Context, testID, userID string, d TestDraft) error {
	if d.Mode != "practice" && d.Mode != "exam" {
		return ErrInvalid{"mode must be practice or exam"}
	}
	if _, err := s.Test(ctx, testID, userID); err != nil {
		return err
	}
	if d.Answers == nil {
		d.Answers = map[string]any{}
	}
	answers, err := json.Marshal(d.Answers)
	if err != nil {
		return err
	}
	if len(answers) > maxDraftBytes {
		return ErrInvalid{"draft is too large"}
	}
	var ids any
	if len(d.QuestionIDs) > 0 {
		ids = d.QuestionIDs
	}
	if d.StartedAt.IsZero() || d.StartedAt.After(time.Now()) {
		d.StartedAt = time.Now()
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO test_attempt_drafts (test_id, user_id, mode, question_ids, answers, shuffle_seed, started_at)
		VALUES ($1, $2, $3::test_mode, $4, $5, $6, $7)
		ON CONFLICT (test_id, user_id) DO UPDATE SET
		  mode = EXCLUDED.mode, question_ids = EXCLUDED.question_ids, answers = EXCLUDED.answers,
		  shuffle_seed = EXCLUDED.shuffle_seed, updated_at = now(),
		  -- a new mode or subset is a new attempt; otherwise the clock keeps running
		  started_at = CASE
		    WHEN test_attempt_drafts.mode = EXCLUDED.mode
		     AND test_attempt_drafts.question_ids IS NOT DISTINCT FROM EXCLUDED.question_ids
		     AND test_attempt_drafts.shuffle_seed = EXCLUDED.shuffle_seed
		    THEN test_attempt_drafts.started_at ELSE EXCLUDED.started_at END`,
		testID, userID, d.Mode, ids, answers, d.ShuffleSeed, d.StartedAt)
	return err
}

// Draft returns the user's draft for a test, or nil if there is none.
func (s *Store) Draft(ctx context.Context, testID, userID string) (*TestDraft, error) {
	var d TestDraft
	var ids []string
	err := s.pool.QueryRow(ctx, `
		SELECT mode::text, question_ids, answers, shuffle_seed, started_at, updated_at
		FROM test_attempt_drafts WHERE test_id = $1 AND user_id = $2`, testID, userID,
	).Scan(&d.Mode, &ids, &d.Answers, &d.ShuffleSeed, &d.StartedAt, &d.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	d.QuestionIDs = ids
	return &d, err
}

func (s *Store) DeleteDraft(ctx context.Context, testID, userID string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM test_attempt_drafts WHERE test_id = $1 AND user_id = $2`, testID, userID)
	return err
}
