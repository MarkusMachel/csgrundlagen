package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestWrongAnswerFeedback(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	for _, u := range []struct{ email, role string }{{"root@example.com", "admin"}, {"ada@example.com", "user"}} {
		if _, err := st.CreateUser(ctx, "Someone", u.email, "correct horse battery", u.role, "en"); err != nil {
			t.Fatal(err)
		}
	}
	login := func(email string) string {
		var body struct{ Token string }
		c.do("POST", "/api/auth/login", "", map[string]string{"email": email, "password": "correct horse battery"}, &body)
		return body.Token
	}
	root, ada := login("root@example.com"), login("ada@example.com")

	var m store.Material
	expect(t, "material", c.do("POST", "/api/materials", root, map[string]any{
		"type": "article", "title": "TCP vs UDP", "url": "https://example.com/tcp-udp", "tags": []string{"Networking"},
	}, &m), 201)
	var q store.Question
	expect(t, "create", c.do("POST", "/api/questions", root, map[string]any{
		"type": "multiple-choice", "prompt": "Which protocol is reliable?", "explanation": "TCP retransmits.",
		"tags": []string{"Networking"}, "correctOptionId": "A",
		"options": []map[string]any{
			{"id": "A", "label": "TCP", "feedback": "ignored: this is the right answer"},
			{"id": "B", "label": "UDP", "feedback": "  UDP sends and forgets: no acknowledgements.  ", "materialId": m.ID},
			{"id": "C", "label": "ICMP"},
		},
	}, &q), 201)

	// the public question never carries feedback (it would give the answer away)
	raw := rawGet(t, srv.URL+"/api/questions/"+q.ID)
	expect(t, "public question has no feedback", strings.Contains(raw, "feedback") || strings.Contains(raw, "materialId"), false)

	submit := func(answer string) store.SubmitAnswerResult {
		var res store.SubmitAnswerResult // fresh each time: omitted fields would otherwise linger
		c.do("POST", "/api/questions/"+q.ID+"/submit", ada, map[string]any{"answer": answer}, &res)
		return res
	}
	var res store.SubmitAnswerResult
	expect(t, "wrong answer", c.do("POST", "/api/questions/"+q.ID+"/submit", ada, map[string]any{"answer": "B"}, &res), 200)
	expect(t, "feedback", vals(len(res.Feedback), res.Feedback[0].OptionID, *res.Feedback[0].Text), "1 B UDP sends and forgets: no acknowledgements.")
	expect(t, "reading", vals(res.Feedback[0].Material.Title, res.Feedback[0].Material.URL), "TCP vs UDP https://example.com/tcp-udp")
	expect(t, "no feedback written", len(submit("C").Feedback), 0)
	expect(t, "right answer: none", len(submit("A").Feedback), 0)

	// authoring view includes it, minus the feedback on the correct option
	var input store.NewQuestion
	expect(t, "members can't", c.do("GET", "/api/questions/"+q.ID+"/authoring", ada, nil, nil), 403)
	expect(t, "authoring", c.do("GET", "/api/questions/"+q.ID+"/authoring", root, nil, &input), 200)
	expect(t, "correct option has none", input.Options[0].Feedback == nil, true)
	expect(t, "B kept", vals(*input.Options[1].Feedback, *input.Options[1].MaterialID == m.ID), "UDP sends and forgets: no acknowledgements. true")

	// tests show it per question in the results
	var test store.CustomTest
	c.do("POST", "/api/tests", ada, map[string]any{"name": "t", "questionIds": []string{q.ID}}, &test)
	var result store.TestSubmitResult
	expect(t, "submit test", c.do("POST", "/api/tests/"+test.ID+"/submit", ada, map[string]any{
		"mode": "exam", "answers": map[string]any{q.ID: "B"}}, &result), 200)
	expect(t, "test feedback", result.Breakdown[0].Feedback[0].OptionID, "B")

	// deleting the material keeps the text
	expect(t, "delete material", c.do("DELETE", "/api/materials/"+m.ID, root, nil, nil), 204)
	res = submit("B")
	expect(t, "text survives", vals(len(res.Feedback), res.Feedback[0].Material == nil), "1 true")
}

func rawGet(t *testing.T, url string) string {
	t.Helper()
	res, err := httpGet(url)
	if err != nil {
		t.Fatal(err)
	}
	return res
}

func httpGet(url string) (string, error) {
	res, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	b, err := io.ReadAll(res.Body)
	return string(b), err
}

func TestOfflineAnswers(t *testing.T) {
	ctx := context.Background()
	pool := newTestDB(t)
	st := store.New(pool)
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	if _, err := st.CreateUser(ctx, "Root", "root@example.com", "correct horse battery", "admin", "en"); err != nil {
		t.Fatal(err)
	}
	var login struct{ Token string }
	c.do("POST", "/api/auth/login", "", map[string]string{"email": "root@example.com", "password": "correct horse battery"}, &login)
	var q store.Question
	c.do("POST", "/api/questions", login.Token, map[string]any{
		"type": "true-false", "prompt": "p", "explanation": "e", "tags": []string{"Networking"}, "correctAnswer": true,
	}, &q)

	twoHoursAgo := time.Now().Add(-2 * time.Hour).UTC().Truncate(time.Second)
	expect(t, "offline answer", c.do("POST", "/api/questions/"+q.ID+"/submit", login.Token, map[string]any{
		"answer": true, "answeredAt": twoHoursAgo}, nil), 200)
	var at time.Time
	pool.QueryRow(ctx, `SELECT answered_at FROM question_answers WHERE question_id = $1`, q.ID).Scan(&at)
	expect(t, "dated when given", at.Equal(twoHoursAgo), true)

	// a newer answer, then an even older offline one arrives late: schedule unchanged
	c.do("POST", "/api/questions/"+q.ID+"/submit", login.Token, map[string]any{"answer": false}, nil)
	var due1, due2 time.Time
	pool.QueryRow(ctx, `SELECT due_at FROM review_schedule WHERE question_id = $1`, q.ID).Scan(&due1)
	threeHoursAgo := time.Now().Add(-3 * time.Hour)
	c.do("POST", "/api/questions/"+q.ID+"/submit", login.Token, map[string]any{"answer": true, "answeredAt": threeHoursAgo}, nil)
	pool.QueryRow(ctx, `SELECT due_at FROM review_schedule WHERE question_id = $1`, q.ID).Scan(&due2)
	expect(t, "late answer doesn't reschedule", due2.Equal(due1), true)
	var n int
	pool.QueryRow(ctx, `SELECT count(*) FROM question_answers WHERE question_id = $1`, q.ID).Scan(&n)
	expect(t, "but it is recorded", n, 3)
}
