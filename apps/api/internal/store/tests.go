package store

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

const testSelect = `
SELECT t.id, t.owner_id, t.name,
       COALESCE((SELECT array_agg(ctq.question_id::text ORDER BY ctq.position)
                 FROM custom_test_questions ctq WHERE ctq.test_id = t.id), '{}'),
       t.timed, t.duration_minutes, t.shuffle_questions, t.shuffle_options, t.created_at
FROM custom_tests t`

func (s *Store) queryTests(ctx context.Context, sql string, args ...any) ([]CustomTest, error) {
	rows, err := s.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[CustomTest])
	return nonNil(out), err
}

func (s *Store) Tests(ctx context.Context, ownerID string) ([]CustomTest, error) {
	return s.queryTests(ctx, testSelect+` WHERE t.owner_id = $1 ORDER BY t.created_at DESC`, ownerID)
}

// Test returns a test only if it belongs to ownerID.
func (s *Store) Test(ctx context.Context, id, ownerID string) (CustomTest, error) {
	ts, err := s.queryTests(ctx, testSelect+` WHERE t.id = $1 AND t.owner_id = $2`, id, ownerID)
	if err != nil {
		return CustomTest{}, err
	}
	if len(ts) == 0 {
		return CustomTest{}, ErrNotFound
	}
	return ts[0], nil
}

type NewTest struct {
	Name             string   `json:"name"`
	QuestionIDs      []string `json:"questionIds"`
	Timed            bool     `json:"timed"`
	DurationMinutes  *int     `json:"durationMinutes"`
	ShuffleQuestions bool     `json:"shuffleQuestions"`
	ShuffleOptions   bool     `json:"shuffleOptions"`
}

func (s *Store) CreateTest(ctx context.Context, ownerID string, n NewTest) (CustomTest, error) {
	if strings.TrimSpace(n.Name) == "" {
		return CustomTest{}, ErrInvalid{"name is required"}
	}
	if len(n.QuestionIDs) == 0 {
		return CustomTest{}, ErrInvalid{"select at least one question"}
	}
	seen := map[string]bool{}
	for _, id := range n.QuestionIDs {
		if !IsUUID(id) || seen[id] {
			return CustomTest{}, ErrInvalid{"questionIds must be unique, valid ids"}
		}
		seen[id] = true
	}
	duration := n.DurationMinutes
	if !n.Timed {
		duration = nil
	} else if duration == nil || *duration < 1 {
		return CustomTest{}, ErrInvalid{"timed tests need durationMinutes >= 1"}
	}

	var id string
	err := s.withTx(ctx, func(tx pgx.Tx) error {
		var found int
		if err := tx.QueryRow(ctx, `SELECT count(*) FROM questions WHERE id = ANY($1::uuid[])`,
			n.QuestionIDs).Scan(&found); err != nil {
			return err
		}
		if found != len(n.QuestionIDs) {
			return ErrInvalid{"some questionIds do not exist"}
		}
		if err := tx.QueryRow(ctx, `
			INSERT INTO custom_tests (owner_id, name, timed, duration_minutes, shuffle_questions, shuffle_options)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
			ownerID, n.Name, n.Timed, duration, n.ShuffleQuestions, n.ShuffleOptions,
		).Scan(&id); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `
			INSERT INTO custom_test_questions (test_id, question_id, position)
			SELECT $1, qid, ord - 1 FROM unnest($2::uuid[]) WITH ORDINALITY AS u(qid, ord)`,
			id, n.QuestionIDs)
		return err
	})
	if err != nil {
		return CustomTest{}, err
	}
	return s.Test(ctx, id, ownerID)
}

func (s *Store) DeleteTest(ctx context.Context, id, ownerID string) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM custom_tests WHERE id = $1 AND owner_id = $2`, id, ownerID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) Attempts(ctx context.Context, testID, userID string) ([]TestAttempt, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, test_id, user_id, mode::text, answers, score, started_at, submitted_at
		FROM test_attempts WHERE test_id = $1 AND user_id = $2
		ORDER BY submitted_at DESC NULLS LAST`, testID, userID)
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[TestAttempt])
	return nonNil(out), err
}

type SubmitTest struct {
	Mode        string         `json:"mode"`
	Answers     map[string]any `json:"answers"`
	QuestionIDs []string       `json:"questionIds"` // subset for "Retry Incorrect Only"
	StartedAt   *time.Time     `json:"startedAt"`
}

// SubmitTest scores an attempt, stores it, and records one answer row per
// question (unanswered ones as wrong) so stats and Weak Spots stay in sync.
func (s *Store) SubmitTest(ctx context.Context, testID, userID string, in SubmitTest) (TestSubmitResult, error) {
	if in.Mode != "practice" && in.Mode != "exam" {
		return TestSubmitResult{}, ErrInvalid{"mode must be practice or exam"}
	}
	test, err := s.Test(ctx, testID, userID)
	if err != nil {
		return TestSubmitResult{}, err
	}
	ids := test.QuestionIDs
	if len(in.QuestionIDs) > 0 {
		inTest := map[string]bool{}
		for _, id := range test.QuestionIDs {
			inTest[id] = true
		}
		ids = nil
		for _, id := range in.QuestionIDs {
			if inTest[id] {
				ids = append(ids, id)
			}
		}
	}
	questions, err := s.QuestionsByIDs(ctx, ids, "en")
	if err != nil {
		return TestSubmitResult{}, err
	}

	answers := in.Answers
	if answers == nil {
		answers = map[string]any{}
	}
	breakdown := make([]TestSubmitResultItem, 0, len(questions))
	score := 0
	for _, q := range questions {
		given := answers[q.ID]
		ok := isCorrect(q, given)
		if ok {
			score++
		}
		breakdown = append(breakdown, TestSubmitResultItem{
			QuestionID: q.ID, Correct: ok, GivenAnswer: given, CorrectAnswer: q.Correct(),
		})
	}

	startedAt := time.Now()
	if in.StartedAt != nil {
		startedAt = *in.StartedAt
	}
	var attempt TestAttempt
	err = s.withTx(ctx, func(tx pgx.Tx) error {
		if err := tx.QueryRow(ctx, `
			INSERT INTO test_attempts (test_id, user_id, mode, answers, score, started_at, submitted_at)
			VALUES ($1, $2, $3::test_mode, $4, $5, $6, now())
			RETURNING id, test_id, user_id, mode::text, answers, score, started_at, submitted_at`,
			testID, userID, in.Mode, answers, score, startedAt,
		).Scan(&attempt.ID, &attempt.TestID, &attempt.UserID, &attempt.Mode, &attempt.Answers,
			&attempt.Score, &attempt.StartedAt, &attempt.SubmittedAt); err != nil {
			return err
		}
		for _, b := range breakdown {
			if _, err := tx.Exec(ctx, `
				INSERT INTO question_answers (user_id, question_id, answer_value, is_correct, test_attempt_id)
				VALUES ($1, $2, $3, $4, $5)`,
				userID, b.QuestionID, AnswerKey(b.GivenAnswer), b.Correct, attempt.ID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return TestSubmitResult{}, err
	}
	return TestSubmitResult{Attempt: attempt, Total: len(questions), Score: score, Breakdown: breakdown}, nil
}
