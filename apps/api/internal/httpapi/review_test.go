package httpapi_test

import (
	"testing"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestReviewAndProgress(t *testing.T) {
	c, admin, ada := newServer(t)
	mk := func(prompt, tag string) store.Question {
		var q store.Question
		expect(t, "create "+prompt, c.do("POST", "/api/questions", admin, map[string]any{
			"type": "true-false", "prompt": prompt, "tags": []string{tag},
			"explanation": "x", "correctAnswer": true,
		}, &q), 201)
		return q
	}
	q1, q2, q3 := mk("Q one", "SQL & Databases"), mk("Q two", "SQL & Databases"), mk("Q three", "Go")

	var queue store.ReviewQueue
	expect(t, "empty queue", c.do("GET", "/api/review/queue", ada, nil, &queue), 200)
	expect(t, "nothing due yet", vals(queue.Due, len(queue.Items)), "0 0")
	expect(t, "queue with new", c.do("GET", "/api/review/queue?new=2", ada, nil, &queue), 200)
	expect(t, "two new questions offered", vals(queue.New, len(queue.Items)), "2 2")

	// correct -> back in a day; wrong -> due again within minutes
	var res store.SubmitAnswerResult
	c.do("POST", "/api/questions/"+q1.ID+"/submit", ada, map[string]any{"answer": true}, &res)
	if res.NextReviewAt == nil || res.NextReviewAt.Sub(time.Now()) < 23*time.Hour {
		t.Fatalf("correct answer should schedule ~1 day out, got %v", res.NextReviewAt)
	}
	c.do("POST", "/api/questions/"+q2.ID+"/submit", ada, map[string]any{"answer": false}, &res)
	if res.NextReviewAt == nil || res.NextReviewAt.Sub(time.Now()) > 11*time.Minute {
		t.Fatalf("wrong answer should come back within 10 minutes, got %v", res.NextReviewAt)
	}
	// Due now: nothing yet (q2 is 10 minutes away). New excludes answered questions.
	c.do("GET", "/api/review/queue?new=5", ada, nil, &queue)
	expect(t, "only q3 is new", vals(queue.Due, queue.New, queue.Items[0].ID), vals(0, 1, q3.ID))

	// --- progress ---
	var p store.Progress
	expect(t, "progress", c.do("GET", "/api/me/progress?tz=Europe/Berlin", ada, nil, &p), 200)
	expect(t, "totals", vals(p.Totals.Questions, p.Totals.Seen, p.Totals.Answers, p.Totals.Correct, p.Totals.StreakDays), "3 2 2 1 1")
	byTag := map[string]store.TagProgress{}
	for _, tp := range p.ByTag {
		byTag[tp.Tag] = tp
	}
	expect(t, "sql tag", vals(byTag["SQL & Databases"].Questions, byTag["SQL & Databases"].Seen, byTag["SQL & Databases"].Correct), "2 2 1")
	expect(t, "go tag untouched", vals(byTag["Go"].Questions, byTag["Go"].Seen), "1 0")
	expect(t, "30 days of activity", len(p.Activity), 30)
	today := p.Activity[29]
	expect(t, "today's activity", vals(today.Answers, today.Correct), "2 1")
	expect(t, "7 days ahead", len(p.Upcoming), 7)
	expect(t, "q2 due today", p.Upcoming[0].Count, 1)
	expect(t, "bad tz falls back", c.do("GET", "/api/me/progress?tz=Not/AZone", ada, nil, &p), 200)
	expect(t, "progress is per user", c.do("GET", "/api/me/progress", admin, nil, &p), 200)
	expect(t, "admin has none", p.Totals.Seen, 0)
	expect(t, "auth required", c.do("GET", "/api/me/progress", "", nil, nil), 401)
}
