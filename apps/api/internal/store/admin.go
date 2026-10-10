package store

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

// AdminStats aggregates platform-wide numbers for the admin Stats tab
// (same shape as apps/web/src/features/authoring/statsTypes.ts).
func (s *Store) AdminStats(ctx context.Context) (AdminStats, error) {
	var st AdminStats
	t := &st.Totals
	if err := s.pool.QueryRow(ctx, `
		SELECT (SELECT count(*) FROM questions),
		       (SELECT count(*) FROM materials),
		       (SELECT count(*) FROM users),
		       (SELECT count(*) FROM custom_tests),
		       (SELECT count(*) FROM test_attempts),
		       (SELECT count(*) FROM question_answers),
		       (SELECT count(*) FROM bookmarks),
		       (SELECT count(*) FROM question_comments),
		       (SELECT count(*) FROM bug_reports),
		       (SELECT count(*) FROM question_answers WHERE is_correct),
		       (SELECT count(*) FROM question_answers WHERE NOT is_correct)`,
	).Scan(&t.Questions, &t.Materials, &t.Users, &t.Tests, &t.TestAttempts, &t.AnswersSubmitted,
		&t.Bookmarks, &t.Comments, &t.BugReports, &st.Correctness.Correct, &st.Correctness.Incorrect); err != nil {
		return st, err
	}

	var err error
	if st.QuestionsByType, err = collect[TypeCount](s.pool.Query(ctx,
		`SELECT type::text, count(*) FROM questions GROUP BY type ORDER BY type`)); err != nil {
		return st, err
	}
	// Ordinal order (easy → medium → hard → unspecified), not alphabetical.
	if st.QuestionsByDifficulty, err = collect[DifficultyCount](s.pool.Query(ctx, `
		SELECT COALESCE(difficulty::text, 'unspecified'), count(*) FROM questions
		GROUP BY difficulty ORDER BY difficulty NULLS LAST`)); err != nil {
		return st, err
	}
	if st.MaterialsByType, err = collect[TypeCount](s.pool.Query(ctx,
		`SELECT type::text, count(*) FROM materials GROUP BY type ORDER BY type`)); err != nil {
		return st, err
	}
	if st.AnswersByTag, err = collect[TagCount](s.pool.Query(ctx, `
		SELECT t.name, count(*) FROM question_answers qa
		JOIN question_tags qt ON qt.question_id = qa.question_id
		JOIN tags t ON t.id = qt.tag_id
		GROUP BY t.name ORDER BY count(*) DESC, t.name LIMIT 8`)); err != nil {
		return st, err
	}
	return st, nil
}

// AdminBugReport is a bug report with the context an admin needs to triage it.
type AdminBugReport struct {
	ID             string    `json:"id"`
	QuestionID     string    `json:"questionId"`
	QuestionPrompt string    `json:"questionPrompt"`
	UserID         string    `json:"userId"`
	UserName       string    `json:"userName"`
	Message        string    `json:"message"`
	CreatedAt      time.Time `json:"createdAt"`
	Status         string    `json:"status"`
}

var bugStatuses = map[string]bool{"open": true, "reviewed": true, "closed": true}

// BugReports lists reports for the admin queue, newest first; status ""
// means all of them.
func (s *Store) BugReports(ctx context.Context, status string) ([]AdminBugReport, error) {
	if status != "" && !bugStatuses[status] {
		return nil, ErrInvalid{"status must be open, reviewed or closed"}
	}
	return collect[AdminBugReport](s.pool.Query(ctx, `
		SELECT b.id, b.question_id, q.prompt, b.user_id, u.name, b.message, b.created_at, b.status::text
		FROM bug_reports b
		JOIN questions q ON q.id = b.question_id
		JOIN users u ON u.id = b.user_id
		WHERE $1 = '' OR b.status::text = $1
		ORDER BY b.created_at DESC`, status))
}

func (s *Store) SetBugReportStatus(ctx context.Context, id, status string) (AdminBugReport, error) {
	if !bugStatuses[status] {
		return AdminBugReport{}, ErrInvalid{"status must be open, reviewed or closed"}
	}
	tag, err := s.pool.Exec(ctx, `UPDATE bug_reports SET status = $2::bug_report_status WHERE id = $1`, id, status)
	if err != nil {
		return AdminBugReport{}, err
	}
	if tag.RowsAffected() == 0 {
		return AdminBugReport{}, ErrNotFound
	}
	rows, err := collect[AdminBugReport](s.pool.Query(ctx, `
		SELECT b.id, b.question_id, q.prompt, b.user_id, u.name, b.message, b.created_at, b.status::text
		FROM bug_reports b JOIN questions q ON q.id = b.question_id JOIN users u ON u.id = b.user_id
		WHERE b.id = $1`, id))
	if err != nil {
		return AdminBugReport{}, err
	}
	return rows[0], nil
}

func collect[T any](rows pgx.Rows, err error) ([]T, error) {
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[T])
	return nonNil(out), err
}
