package store

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// ReviewState is one user's spaced-repetition state for one question.
type ReviewState struct {
	Repetitions  int
	IntervalDays float64
	Ease         float64
	DueAt        time.Time
}

const (
	startEase  = 2.5
	minEase    = 1.3
	maxEase    = 3.0
	relearnGap = 10 * time.Minute
	// maxInterval caps the gap between reviews. Without it the interval grows
	// exponentially and, after enough correct answers, overflows time.Duration.
	maxIntervalDays = 365
)

// NextReview applies a simplified SM-2 to one answer. prev is nil the first
// time the user answers the question.
//
//	correct: repetitions+1; next gap 1 day, then 3 days, then gap * ease
//	         (at most 365 days); ease +0.05
//	wrong:   repetitions reset to 0; due again in 10 minutes; ease -0.2
func NextReview(prev *ReviewState, correct bool, now time.Time) ReviewState {
	s := ReviewState{Ease: startEase}
	if prev != nil {
		s = *prev
	}
	if !correct {
		s.Repetitions = 0
		s.IntervalDays = 0
		s.Ease = math.Max(minEase, s.Ease-0.2)
		s.DueAt = now.Add(relearnGap)
		return s
	}
	s.Repetitions++
	switch s.Repetitions {
	case 1:
		s.IntervalDays = 1
	case 2:
		s.IntervalDays = 3
	default:
		s.IntervalDays = math.Min(maxIntervalDays, math.Round(math.Max(s.IntervalDays, 1)*s.Ease*10)/10)
	}
	s.Ease = math.Min(maxEase, s.Ease+0.05)
	s.DueAt = now.Add(time.Duration(s.IntervalDays * float64(24*time.Hour)))
	return s
}

// querier is what recordReview needs from a pool or a transaction.
type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

// recordReview updates the user's schedule for a question after an answer
// and returns when it is due next.
func recordReview(ctx context.Context, q querier, userID, questionID string, correct bool, now time.Time) (time.Time, error) {
	var prev ReviewState
	err := q.QueryRow(ctx, `
		SELECT repetitions, interval_days, ease, due_at FROM review_schedule
		WHERE user_id = $1 AND question_id = $2`, userID, questionID,
	).Scan(&prev.Repetitions, &prev.IntervalDays, &prev.Ease, &prev.DueAt)
	var next ReviewState
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		next = NextReview(nil, correct, now)
	case err != nil:
		return time.Time{}, err
	default:
		next = NextReview(&prev, correct, now)
	}
	_, err = q.Exec(ctx, `
		INSERT INTO review_schedule (user_id, question_id, repetitions, interval_days, ease, due_at, last_reviewed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, question_id) DO UPDATE
		SET repetitions = EXCLUDED.repetitions, interval_days = EXCLUDED.interval_days,
		    ease = EXCLUDED.ease, due_at = EXCLUDED.due_at, last_reviewed_at = EXCLUDED.last_reviewed_at`,
		userID, questionID, next.Repetitions, next.IntervalDays, next.Ease, next.DueAt, now)
	return next.DueAt, err
}

// ReviewQueue is what a review session works through: questions that are due
// (most overdue first), optionally followed by some never-answered ones.
type ReviewQueue struct {
	Items []Question `json:"items"`
	// Due is how many questions are due now in total (Items may hold fewer).
	Due int `json:"due"`
	// New is how many unseen questions were appended after the due ones.
	New int `json:"new"`
}

func (s *Store) ReviewQueue(ctx context.Context, userID, locale string, limit, newLimit int) (ReviewQueue, error) {
	var out ReviewQueue
	if err := s.pool.QueryRow(ctx, `
		SELECT count(*) FROM review_schedule WHERE user_id = $1 AND due_at <= now()`, userID,
	).Scan(&out.Due); err != nil {
		return out, err
	}
	due, err := s.queryQuestions(ctx, locale, questionSelect+`
		JOIN review_schedule rs ON rs.question_id = q.id AND rs.user_id = $2
		WHERE rs.due_at <= now()
		ORDER BY rs.due_at, q.id
		LIMIT $3`, userID, limit)
	if err != nil {
		return out, err
	}
	out.Items = due
	if newLimit > 0 {
		fresh, err := s.queryQuestions(ctx, locale, questionSelect+`
			WHERE NOT EXISTS (SELECT 1 FROM review_schedule rs WHERE rs.question_id = q.id AND rs.user_id = $2)
			ORDER BY q.created_at, q.id
			LIMIT $3`, userID, newLimit)
		if err != nil {
			return out, err
		}
		out.New = len(fresh)
		out.Items = append(out.Items, fresh...)
	}
	return out, nil
}
