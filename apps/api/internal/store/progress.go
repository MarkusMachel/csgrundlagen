package store

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

// Progress is one user's learning overview (GET /api/me/progress).
type Progress struct {
	Totals struct {
		Questions  int `json:"questions"`  // in the bank
		Seen       int `json:"seen"`       // answered at least once
		Answers    int `json:"answers"`    // every answer, repeats included
		Correct    int `json:"correct"`    // correct answers
		DueNow     int `json:"dueNow"`     // spaced-repetition reviews due
		StreakDays int `json:"streakDays"` // consecutive days with an answer, up to today
	} `json:"totals"`
	ByTag    []TagProgress `json:"byTag"`
	Activity []DayActivity `json:"activity"` // the last 30 days, oldest first
	Upcoming []DayCount    `json:"upcoming"` // reviews due on each of the next 7 days
}

type TagProgress struct {
	Tag       string `json:"tag"`
	Questions int    `json:"questions"`
	Seen      int    `json:"seen"`
	Answers   int    `json:"answers"`
	Correct   int    `json:"correct"`
}

type DayActivity struct {
	Date    string `json:"date"` // YYYY-MM-DD in the user's time zone
	Answers int    `json:"answers"`
	Correct int    `json:"correct"`
}

type DayCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// UserProgress builds the overview. Days are calendar days in loc (the
// user's time zone), so "today" and the streak match their clock.
//
// The four queries go to the database in one round trip, and the answer
// queries read only idx_question_answers_user_time.
func (s *Store) UserProgress(ctx context.Context, userID string, loc *time.Location) (Progress, error) {
	var p Progress
	tz := loc.String()
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	b := &pgx.Batch{}
	t := &p.Totals
	b.Queue(`
		SELECT (SELECT count(*) FROM questions),
		       count(DISTINCT question_id),
		       count(*),
		       count(*) FILTER (WHERE is_correct),
		       (SELECT count(*) FROM review_schedule WHERE user_id = $1 AND due_at <= now())
		FROM question_answers WHERE user_id = $1`, userID,
	).QueryRow(func(row pgx.Row) error {
		return row.Scan(&t.Questions, &t.Seen, &t.Answers, &t.Correct, &t.DueNow)
	})

	// Per question first, so each question's answers are counted once per tag
	// without DISTINCT over the joined rows.
	b.Queue(`
		WITH mine AS (
		  SELECT question_id, count(*) AS answers, count(*) FILTER (WHERE is_correct) AS correct
		  FROM question_answers WHERE user_id = $1
		  GROUP BY question_id
		)
		SELECT t.name,
		       count(*)::int,
		       count(m.question_id)::int,
		       coalesce(sum(m.answers), 0)::int,
		       coalesce(sum(m.correct), 0)::int
		FROM tags t
		JOIN question_tags qt ON qt.tag_id = t.id
		LEFT JOIN mine m ON m.question_id = qt.question_id
		GROUP BY t.name
		ORDER BY t.name`, userID,
	).Query(func(rows pgx.Rows) error {
		var err error
		p.ByTag, err = collect[TagProgress](rows, nil)
		return err
	})

	// Answers per local day for the last year (activity chart + streak).
	byDay := map[string]DayActivity{}
	b.Queue(`
		SELECT (answered_at AT TIME ZONE $2)::date AS day,
		       count(*), count(*) FILTER (WHERE is_correct)
		FROM question_answers
		WHERE user_id = $1 AND answered_at > now() - interval '366 days'
		GROUP BY day`, userID, tz,
	).Query(func(rows pgx.Rows) error {
		var day time.Time
		var d DayActivity
		_, err := pgx.ForEachRow(rows, []any{&day, &d.Answers, &d.Correct}, func() error {
			d.Date = day.Format("2006-01-02")
			byDay[d.Date] = d
			return nil
		})
		return err
	})

	// Reviews per local day for the next week; overdue ones count as today.
	upcoming := map[string]int{}
	b.Queue(`
		SELECT greatest((due_at AT TIME ZONE $2)::date, (now() AT TIME ZONE $2)::date) AS day,
		       count(*)
		FROM review_schedule
		WHERE user_id = $1 AND due_at < $3
		GROUP BY day`, userID, tz, today.AddDate(0, 0, 7),
	).Query(func(rows pgx.Rows) error {
		var day time.Time
		var n int
		_, err := pgx.ForEachRow(rows, []any{&day, &n}, func() error {
			upcoming[day.Format("2006-01-02")] = n
			return nil
		})
		return err
	})

	if err := s.pool.SendBatch(ctx, b).Close(); err != nil {
		return p, err
	}

	for i := 29; i >= 0; i-- {
		date := today.AddDate(0, 0, -i).Format("2006-01-02")
		d := byDay[date]
		d.Date = date
		p.Activity = append(p.Activity, d)
	}
	// A streak survives until the end of today: count back from today, or
	// from yesterday if nothing has been answered yet today.
	day := today
	if _, ok := byDay[day.Format("2006-01-02")]; !ok {
		day = day.AddDate(0, 0, -1)
	}
	for {
		if _, ok := byDay[day.Format("2006-01-02")]; !ok {
			break
		}
		t.StreakDays++
		day = day.AddDate(0, 0, -1)
	}

	for i := 0; i < 7; i++ {
		date := today.AddDate(0, 0, i).Format("2006-01-02")
		p.Upcoming = append(p.Upcoming, DayCount{Date: date, Count: upcoming[date]})
	}
	return p, nil
}
