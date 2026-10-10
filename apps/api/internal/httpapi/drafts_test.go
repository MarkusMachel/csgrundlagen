package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestTestDrafts(t *testing.T) {
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

	var ids []string
	for _, p := range []string{"TCP is reliable.", "UDP is connection-oriented."} {
		var q store.Question
		c.do("POST", "/api/questions", root, map[string]any{
			"type": "true-false", "prompt": p, "explanation": "e", "correctAnswer": true, "tags": []string{"Networking"},
		}, &q)
		ids = append(ids, q.ID)
	}
	var test store.CustomTest
	expect(t, "create test", c.do("POST", "/api/tests", ada, map[string]any{
		"name": "Net", "questionIds": ids, "timed": true, "durationMinutes": 10,
	}, &test), 201)

	var draft *store.TestDraft
	expect(t, "no draft", c.do("GET", "/api/tests/"+test.ID+"/draft", ada, nil, &draft), 200)
	expect(t, "nil", draft == nil, true)

	started := time.Now().Add(-3 * time.Minute).UTC().Truncate(time.Second)
	save := func(answers map[string]any, startedAt time.Time) int {
		return c.do("PUT", "/api/tests/"+test.ID+"/draft", ada, map[string]any{
			"mode": "exam", "answers": answers, "shuffleSeed": 42, "startedAt": startedAt,
		}, nil)
	}
	expect(t, "save", save(map[string]any{ids[0]: true}, started), 204)
	expect(t, "others can't", c.do("PUT", "/api/tests/"+test.ID+"/draft", root, map[string]any{"mode": "exam", "shuffleSeed": 1}, nil), 404)
	expect(t, "bad mode", c.do("PUT", "/api/tests/"+test.ID+"/draft", ada, map[string]any{"mode": "zen", "shuffleSeed": 1}, nil), 400)

	// a later save can't reset the clock
	expect(t, "save again", save(map[string]any{ids[0]: true, ids[1]: false}, time.Now()), 204)
	c.do("GET", "/api/tests/"+test.ID+"/draft", ada, nil, &draft)
	expect(t, "draft restored", vals(draft.Mode, len(draft.Answers), draft.ShuffleSeed), "exam 2 42")
	expect(t, "clock kept", draft.StartedAt.Equal(started), true)

	var tests []store.CustomTest
	c.do("GET", "/api/tests", ada, nil, &tests)
	expect(t, "summary in list", vals(tests[0].Draft.Answered, tests[0].Draft.Total), "2 2")

	// submitting ends the draft
	expect(t, "submit", c.do("POST", "/api/tests/"+test.ID+"/submit", ada, map[string]any{
		"mode": "exam", "answers": map[string]any{ids[0]: true, ids[1]: false}, "startedAt": started,
	}, nil), 200)
	c.do("GET", "/api/tests/"+test.ID+"/draft", ada, nil, &draft)
	expect(t, "draft gone", draft == nil, true)
	var after []store.CustomTest // fresh: decoding into the old slice would keep its Draft
	c.do("GET", "/api/tests", ada, nil, &after)
	expect(t, "no summary", after[0].Draft == nil, true)

	// discarding
	save(map[string]any{}, started)
	expect(t, "discard", c.do("DELETE", "/api/tests/"+test.ID+"/draft", ada, nil, nil), 204)
	c.do("GET", "/api/tests/"+test.ID+"/draft", ada, nil, &draft)
	expect(t, "discarded", draft == nil, true)
}
