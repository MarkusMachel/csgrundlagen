package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestAnkiImportExport(t *testing.T) {
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

	cards := map[string]any{
		"defaultTags": []string{"Go"},
		"cards": []map[string]any{
			{"front": "What is a goroutine?", "back": "A lightweight thread managed by the Go runtime.", "tags": []string{"Async & Concurrency"}},
			{"front": "What does `defer` do?", "back": "Runs a call when the function returns."},
			{"front": "", "back": "no front"},
		},
	}
	var res store.ImportResult
	expect(t, "members can't import", c.do("POST", "/api/admin/import/flashcards", ada, cards, nil), 403)
	expect(t, "import", c.do("POST", "/api/admin/import/flashcards", root, cards, &res), 200)
	expect(t, "result", vals(res.Created, res.Skipped, len(res.Errors)), "2 0 1")
	expect(t, "again: skipped", c.do("POST", "/api/admin/import/flashcards", root, cards, &res), 200)
	expect(t, "idempotent", vals(res.Created, res.Skipped), "0 2")

	var page store.QuestionsPage
	c.do("GET", "/api/questions?tags=Go", "", nil, &page)
	expect(t, "default tag used", vals(page.Total, page.Items[0].Type), "1 flashcard")
	card := page.Items[0]

	// self-graded answers feed reviews like any other
	var sub store.SubmitAnswerResult
	expect(t, "knew it", c.do("POST", "/api/questions/"+card.ID+"/submit", ada, map[string]any{"answer": true}, &sub), 200)
	expect(t, "correct + scheduled", vals(sub.Correct, sub.NextReviewAt != nil), "true true")

	// export: bookmarks, and the feed filter
	c.do("POST", "/api/questions/"+card.ID+"/bookmark", ada, nil, nil)
	body := get(t, srv.URL+"/api/export/anki?source=bookmarks", ada)
	expect(t, "bookmarks export", strings.Count(body, "\tcs-trainer-"), 1)
	expect(t, "export has the card", strings.Contains(body, "What does <code>defer</code> do?"), true)
	body = get(t, srv.URL+"/api/export/anki?tags=Async+%26+Concurrency", ada)
	expect(t, "filter export", strings.Contains(body, "What is a goroutine?") && !strings.Contains(body, "defer"), true)
	expect(t, "needs login", c.do("GET", "/api/export/anki", "", nil, nil), 401)
}

func get(t *testing.T, url, token string) string {
	t.Helper()
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		t.Fatalf("GET %s: %d %s", url, res.StatusCode, b)
	}
	return string(b)
}
