package store

import (
	"context"
	"time"
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
func (s *Store) UserProgress(ctx context.Context, userID string, loc *time.Location) (Progress, error) {
	var p Progress
	t := &p.Totals
	if err := s.pool.QueryRow(ctx, `
		SELECT (SELECT count(*) FROM questions),
		       (SELECT count(DISTINCT question_id) FROM question_answers WHERE user_id = $1),
		       (SELECT count(*) FROM question_answers WHERE user_id = $1),
		       (SELECT count(*) FROM question_answers WHERE user_id = $1 AND is_correct),
		       (SELECT count(*) FROM review_schedule WHERE user_id = $1 AND due_at <= now())`, userID,
	).Scan(&t.Questions, &t.Seen, &t.Answers, &t.Correct, &t.DueNow); err != nil {
		return p, err
	}

	var err error
	if p.ByTag, err = collect[TagProgress](s.pool.Query(ctx, `
		SELECT t.name,
		       count(DISTINCT qt.question_id),
		       count(DISTINCT a.question_id),
		       count(a.id),
		       count(a.id) FILTER (WHERE a.is_correct)
		FROM tags t
		JOIN question_tags qt ON qt.tag_id = t.id
		LEFT JOIN question_answers a ON a.question_id = qt.question_id AND a.user_id = $1
		GROUP BY t.name
		ORDER BY t.name`, userID)); err != nil {
		return p, err
	}

	tz := loc.String()
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	// Answers per local day for the last year (activity chart + streak).
	rows, err := s.pool.Query(ctx, `
		SELECT to_char((answered_at AT TIME ZONE $2)::date, 'YYYY-MM-DD'),
		       count(*), count(*) FILTER (WHERE is_correct)
		FROM question_answers
		WHERE user_id = $1 AND answered_at > now() - interval '366 days'
		GROUP BY 1`, userID, tz)
	if err != nil {
		return p, err
	}
	byDay := map[string]DayActivity{}
	for rows.Next() {
		var d DayActivity
		if err := rows.Scan(&d.Date, &d.Answers, &d.Correct); err != nil {
			rows.Close()
			return p, err
		}
		byDay[d.Date] = d
	}
	rows.Close()
	if err := rows.Err(); err != nil {
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

	// Reviews per local day for the next week; overdue ones count as today.
	rows, err = s.pool.Query(ctx, `
		SELECT to_char(greatest((due_at AT TIME ZONE $2)::date, (now() AT TIME ZONE $2)::date), 'YYYY-MM-DD'),
		       count(*)
		FROM review_schedule
		WHERE user_id = $1 AND due_at < $3
		GROUP BY 1`, userID, tz, today.AddDate(0, 0, 7))
	if err != nil {
		return p, err
	}
	upcoming := map[string]int{}
	for rows.Next() {
		var date string
		var n int
		if err := rows.Scan(&date, &n); err != nil {
			rows.Close()
			return p, err
		}
		upcoming[date] = n
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return p, err
	}
	for i := 0; i < 7; i++ {
		date := today.AddDate(0, 0, i).Format("2006-01-02")
		p.Upcoming = append(p.Upcoming, DayCount{Date: date, Count: upcoming[date]})
	}
	return p, nil
}
