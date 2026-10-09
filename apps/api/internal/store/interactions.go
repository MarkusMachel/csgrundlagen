package store

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (s *Store) questionExists(ctx context.Context, id string) error {
	var ok bool
	if err := s.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM questions WHERE id = $1)`, id).Scan(&ok); err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	return nil
}

func (s *Store) Comments(ctx context.Context, questionID string) ([]Comment, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT c.id, c.question_id, c.user_id, u.name, c.body, c.created_at
		FROM question_comments c JOIN users u ON u.id = c.user_id
		WHERE c.question_id = $1
		ORDER BY c.created_at`, questionID)
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Comment])
	return nonNil(out), err
}

func (s *Store) AddComment(ctx context.Context, user User, questionID, body string) (Comment, error) {
	if strings.TrimSpace(body) == "" {
		return Comment{}, ErrInvalid{"comment body is required"}
	}
	if err := s.questionExists(ctx, questionID); err != nil {
		return Comment{}, err
	}
	c := Comment{QuestionID: questionID, UserID: user.ID, UserName: user.Name, Body: body}
	err := s.pool.QueryRow(ctx, `
		INSERT INTO question_comments (question_id, user_id, body)
		VALUES ($1, $2, $3) RETURNING id, created_at`, questionID, user.ID, body,
	).Scan(&c.ID, &c.CreatedAt)
	return c, err
}

// Note returns the user's private note on a question, or nil if none exists.
func (s *Store) Note(ctx context.Context, userID, questionID string) (*Note, error) {
	var n Note
	err := s.pool.QueryRow(ctx, `
		SELECT id, user_id, question_id, body, updated_at FROM question_notes
		WHERE user_id = $1 AND question_id = $2`, userID, questionID,
	).Scan(&n.ID, &n.UserID, &n.QuestionID, &n.Body, &n.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (s *Store) SaveNote(ctx context.Context, userID, questionID, body string) (Note, error) {
	if err := s.questionExists(ctx, questionID); err != nil {
		return Note{}, err
	}
	var n Note
	err := s.pool.QueryRow(ctx, `
		INSERT INTO question_notes (user_id, question_id, body) VALUES ($1, $2, $3)
		ON CONFLICT (user_id, question_id) DO UPDATE SET body = EXCLUDED.body
		RETURNING id, user_id, question_id, body, updated_at`, userID, questionID, body,
	).Scan(&n.ID, &n.UserID, &n.QuestionID, &n.Body, &n.UpdatedAt)
	return n, err
}

// ToggleBookmark adds the bookmark if absent, removes it if present, and
// reports the resulting state.
func (s *Store) ToggleBookmark(ctx context.Context, userID, questionID string) (bool, error) {
	if err := s.questionExists(ctx, questionID); err != nil {
		return false, err
	}
	tag, err := s.pool.Exec(ctx,
		`DELETE FROM bookmarks WHERE user_id = $1 AND question_id = $2`, userID, questionID)
	if err != nil {
		return false, err
	}
	if tag.RowsAffected() > 0 {
		return false, nil
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2)
		ON CONFLICT (user_id, question_id) DO NOTHING`, userID, questionID)
	return err == nil, err
}

func (s *Store) AddBugReport(ctx context.Context, userID, questionID, message string) (BugReport, error) {
	if strings.TrimSpace(message) == "" {
		return BugReport{}, ErrInvalid{"message is required"}
	}
	if err := s.questionExists(ctx, questionID); err != nil {
		return BugReport{}, err
	}
	r := BugReport{QuestionID: questionID, UserID: userID, Message: message}
	err := s.pool.QueryRow(ctx, `
		INSERT INTO bug_reports (question_id, user_id, message) VALUES ($1, $2, $3)
		RETURNING id, created_at, status::text`, questionID, userID, message,
	).Scan(&r.ID, &r.CreatedAt, &r.Status)
	return r, err
}
