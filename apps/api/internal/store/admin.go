package store

import (
	"context"

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

func collect[T any](rows pgx.Rows, err error) ([]T, error) {
	if err != nil {
		return nil, err
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[T])
	return nonNil(out), err
}
