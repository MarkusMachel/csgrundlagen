package store

import (
	"context"
	"strings"
	"time"
)

var reportReasons = map[string]bool{"spam": true, "offensive": true, "misleading": true, "other": true}

// ReportComment records a reader's report. Reporting the same comment twice
// is a no-op, and authors can't report their own comments.
func (s *Store) ReportComment(ctx context.Context, userID, commentID, reason, note string) error {
	if !reportReasons[reason] {
		return ErrInvalid{"reason must be spam, offensive, misleading or other"}
	}
	var authorID string
	if err := s.pool.QueryRow(ctx, `SELECT user_id FROM question_comments WHERE id = $1 AND hidden_at IS NULL`, commentID).Scan(&authorID); err != nil {
		return notFound(err)
	}
	if authorID == userID {
		return ErrInvalid{"you can't report your own comment"}
	}
	var notePtr *string
	if n := strings.TrimSpace(note); n != "" {
		n = clip(n, 500)
		notePtr = &n
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO comment_reports (comment_id, user_id, reason, note) VALUES ($1, $2, $3, $4)
		ON CONFLICT (comment_id, user_id) DO NOTHING`, commentID, userID, reason, notePtr)
	return err
}

// DeleteComment removes a comment; only its author or an admin may.
func (s *Store) DeleteComment(ctx context.Context, actor User, commentID string) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM question_comments WHERE id = $1 AND (user_id = $2 OR $3)`,
		commentID, actor.ID, actor.IsAdmin())
	if err == nil && tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return err
}

// ModerateComment hides or unhides a comment, or with neither just dismisses
// its open reports. Hiding resolves the open reports too.
func (s *Store) ModerateComment(ctx context.Context, adminID, commentID string, hidden *bool) error {
	var tagRows int64
	if hidden != nil {
		tag, err := s.pool.Exec(ctx, `
			UPDATE question_comments
			SET hidden_at = CASE WHEN $2 THEN COALESCE(hidden_at, now()) END,
			    hidden_by = CASE WHEN $2 THEN $3::uuid END
			WHERE id = $1`, commentID, *hidden, adminID)
		if err != nil {
			return err
		}
		tagRows = tag.RowsAffected()
	} else {
		var exists bool
		if err := s.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM question_comments WHERE id = $1)`, commentID).Scan(&exists); err != nil {
			return err
		}
		if exists {
			tagRows = 1
		}
	}
	if tagRows == 0 {
		return ErrNotFound
	}
	if hidden == nil || *hidden {
		_, err := s.pool.Exec(ctx, `UPDATE comment_reports SET resolved_at = now()
			WHERE comment_id = $1 AND resolved_at IS NULL`, commentID)
		return err
	}
	return nil
}

// CommentReport is one reader's report, as the moderation queue shows it.
type CommentReport struct {
	Reason    string    `json:"reason"`
	Note      *string   `json:"note,omitempty"`
	UserName  string    `json:"userName"`
	CreatedAt time.Time `json:"createdAt"`
}

// ModeratedComment is a row of the admin comment queue.
type ModeratedComment struct {
	Comment
	QuestionPrompt string          `json:"questionPrompt"`
	HiddenAt       *time.Time      `json:"hiddenAt,omitempty"`
	OpenReports    []CommentReport `json:"openReports"`
}

// ModerationQueue lists comments for admins: "reported" (open reports, most
// reported first), "hidden", or "all" (newest first, at most 200).
func (s *Store) ModerationQueue(ctx context.Context, filter string) ([]ModeratedComment, error) {
	where, order := `EXISTS (SELECT 1 FROM comment_reports r WHERE r.comment_id = c.id AND r.resolved_at IS NULL)`,
		`(SELECT count(*) FROM comment_reports r WHERE r.comment_id = c.id AND r.resolved_at IS NULL) DESC, c.created_at DESC`
	switch filter {
	case "hidden":
		where, order = `c.hidden_at IS NOT NULL`, `c.hidden_at DESC`
	case "all":
		where, order = `true`, `c.created_at DESC`
	}
	rows, err := s.pool.Query(ctx, `
		SELECT c.id, c.question_id, c.user_id, u.name, c.body, c.created_at, c.hidden_at,
		       q.prompt,
		       COALESCE((SELECT json_agg(json_build_object(
		           'reason', r.reason, 'note', r.note, 'userName', ru.name, 'createdAt', r.created_at)
		           ORDER BY r.created_at)
		         FROM comment_reports r JOIN users ru ON ru.id = r.user_id
		         WHERE r.comment_id = c.id AND r.resolved_at IS NULL), '[]')
		FROM question_comments c
		JOIN users u ON u.id = c.user_id
		JOIN questions q ON q.id = c.question_id
		WHERE `+where+` ORDER BY `+order+` LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ModeratedComment{}
	for rows.Next() {
		var m ModeratedComment
		if err := rows.Scan(&m.ID, &m.QuestionID, &m.UserID, &m.UserName, &m.Body, &m.CreatedAt, &m.HiddenAt,
			&m.QuestionPrompt, &m.OpenReports); err != nil {
			return nil, err
		}
		m.Hidden = m.HiddenAt != nil
		out = append(out, m)
	}
	return out, rows.Err()
}

// OpenCommentReports counts comments with unresolved reports, for the admin tab badge.
func (s *Store) OpenCommentReports(ctx context.Context) (int, error) {
	var n int
	err := s.pool.QueryRow(ctx, `SELECT count(DISTINCT comment_id) FROM comment_reports WHERE resolved_at IS NULL`).Scan(&n)
	return n, err
}
