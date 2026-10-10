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

	"github.com/markusmachel/csgrundlagen/apps/api/internal/db"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// getCached fetches a path and returns the body and the X-Cache header.
func getCached(t *testing.T, srv *httptest.Server, path, token string) (string, string) {
	t.Helper()
	req, _ := http.NewRequest("GET", srv.URL+path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		t.Fatalf("GET %s: %d %s", path, res.StatusCode, body)
	}
	return string(body), res.Header.Get("X-Cache")
}

func TestResponseCache(t *testing.T) {
	pool := newTestDB(t)
	st := store.New(pool)
	ctx := context.Background()
	if _, err := st.CreateUser(ctx, "Admin", "admin@example.com", "correct horse battery", "admin", "en"); err != nil {
		t.Fatal(err)
	}
	cache := httpapi.NewCache()
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1, Cache: cache}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	admin := login(t, c, "admin@example.com")

	var q store.Question
	expect(t, "create", c.do("POST", "/api/questions", admin, map[string]any{
		"type": "true-false", "prompt": "UDP is reliable", "tags": []string{"Networking"},
		"explanation": "No.", "correctAnswer": false}, &q), 201)

	// the second identical request is served from memory, byte for byte
	first, status := getCached(t, srv, "/api/questions?pageSize=5", "")
	expect(t, "first is a miss", status, "miss")
	second, status := getCached(t, srv, "/api/questions?pageSize=5", "")
	expect(t, "second is a hit", status, "hit")
	expect(t, "same response", first == second, true)
	_, status = getCached(t, srv, "/api/questions?pageSize=6", "")
	expect(t, "other filters are their own entry", status, "miss")
	for _, p := range []string{"/api/questions/" + q.ID, "/api/questions/daily", "/api/tags"} {
		getCached(t, srv, p, "")
		_, status = getCached(t, srv, p, "")
		expect(t, p+" cached", status, "hit")
	}

	// personal filters are never cached
	_, status = getCached(t, srv, "/api/questions?status=answered", admin)
	expect(t, "per-user list not cached", status, "")

	// an edit through the API drops the cache at once
	expect(t, "edit", c.do("PUT", "/api/questions/"+q.ID, admin, map[string]any{
		"type": "true-false", "prompt": "UDP guarantees delivery", "tags": []string{"Networking"},
		"explanation": "No.", "correctAnswer": false}, nil), 200)
	body, status := getCached(t, srv, "/api/questions?pageSize=5", "")
	expect(t, "miss after edit", status, "miss")
	expect(t, "edited prompt shown", strings.Contains(body, "UDP guarantees delivery"), true)
	body, _ = getCached(t, srv, "/api/questions/"+q.ID, "")
	expect(t, "single question fresh", strings.Contains(body, "UDP guarantees delivery"), true)

	// a change straight in the database (seed tool, another instance) arrives
	// as a Postgres notification
	lctx, cancel := context.WithCancel(ctx)
	defer cancel()
	go db.Listen(lctx, pool, "content_changed", cache.Clear, slog.New(slog.NewTextHandler(io.Discard, nil)))
	getCached(t, srv, "/api/tags", "")
	time.Sleep(200 * time.Millisecond) // let the listener connect
	if _, err := st.CreateQuestion(ctx, "", store.NewQuestion{Type: "true-false", Prompt: "TCP is ordered",
		Tags: []string{"Transport"}, Explanation: "Yes.", CorrectAnswer: ptr(true)}); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(3 * time.Second)
	for {
		body, _ = getCached(t, srv, "/api/tags", "")
		if strings.Contains(body, "Transport") {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("tags still stale after a database change: %s", body)
		}
		time.Sleep(20 * time.Millisecond)
	}
}

func ptr[T any](v T) *T { return &v }
