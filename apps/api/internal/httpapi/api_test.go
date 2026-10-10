package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/rand/v2"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/config"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/db"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// newTestDB creates a throwaway database next to the one in DATABASE_URL,
// migrates it, and drops it when the test ends. Skips if Postgres is down.
func newTestDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()
	base := config.Load().DatabaseURL

	admin, err := db.Connect(ctx, base)
	if err != nil {
		t.Skipf("postgres not reachable (start it with `npm run db:up`): %v", err)
	}
	name := fmt.Sprintf("csgrundlagen_test_%d", rand.Int64N(1<<40))
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		admin.Close()
		t.Fatalf("create test database: %v", err)
	}

	u, _ := url.Parse(base)
	u.Path = "/" + name
	pool, err := db.Connect(ctx, u.String())
	if err != nil {
		t.Fatalf("connect test database: %v", err)
	}
	t.Cleanup(func() {
		pool.Close()
		_, _ = admin.Exec(context.Background(), "DROP DATABASE IF EXISTS "+name+" WITH (FORCE)")
		admin.Close()
	})

	quiet := slog.New(slog.NewTextHandler(io.Discard, nil))
	if err := db.Migrate(ctx, pool, quiet); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	// Running migrations twice must be a no-op.
	if err := db.Migrate(ctx, pool, quiet); err != nil {
		t.Fatalf("re-migrate: %v", err)
	}
	return pool
}

type client struct {
	t   *testing.T
	srv *httptest.Server
	ua  string // User-Agent header, if set
}

// do sends a JSON request and decodes the JSON response into out (if non-nil).
func (c client) do(method, path, token string, body, out any) int {
	c.t.Helper()
	var r io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		r = bytes.NewReader(b)
	}
	req, _ := http.NewRequest(method, c.srv.URL+path, r)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if c.ua != "" {
		req.Header.Set("User-Agent", c.ua)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		c.t.Fatalf("%s %s: %v", method, path, err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if out != nil && len(raw) > 0 {
		if err := json.Unmarshal(raw, out); err != nil {
			c.t.Fatalf("%s %s: decode %q: %v", method, path, raw, err)
		}
	}
	return res.StatusCode
}

// vals space-separates values (fmt.Sprint omits spaces next to strings).
func vals(xs ...any) string { return strings.TrimSpace(fmt.Sprintln(xs...)) }

func expect(t *testing.T, what string, got, want any) {
	t.Helper()
	if fmt.Sprint(got) != fmt.Sprint(want) {
		t.Fatalf("%s: got %v, want %v", what, got, want)
	}
}

func login(t *testing.T, c client, email string) string {
	t.Helper()
	var res struct {
		Token string     `json:"token"`
		User  store.User `json:"user"`
	}
	expect(t, "login status", c.do("POST", "/api/auth/login", "", map[string]string{
		"email": email, "password": "correct horse battery",
	}, &res), 200)
	if res.Token == "" || !strings.EqualFold(res.User.Email, email) {
		t.Fatalf("login response missing token/user: %+v", res)
	}
	return res.Token
}

func TestAPI(t *testing.T) {
	pool := newTestDB(t)
	st := store.New(pool)
	ctx := context.Background()
	for _, u := range []struct{ name, email, role string }{
		{"Admin", "admin@example.com", "admin"},
		{"Ada", "ada@example.com", "user"},
		{"Grace", "grace@example.com", "user"},
	} {
		if _, err := st.CreateUser(ctx, u.name, u.email, "correct horse battery", u.role, "en"); err != nil {
			t.Fatalf("create user %s: %v", u.email, err)
		}
	}

	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}

	// --- auth ---
	var errBody struct{ Message string }
	expect(t, "bad password", c.do("POST", "/api/auth/login", "", map[string]string{
		"email": "admin@example.com", "password": "nope"}, &errBody), 401)
	expect(t, "error message shape", errBody.Message, "Invalid email or password")
	expect(t, "unknown email", c.do("POST", "/api/auth/login", "", map[string]string{
		"email": "who@example.com", "password": "x"}, nil), 401)
	expect(t, "me without token", c.do("GET", "/api/auth/me", "", nil, nil), 401)

	adminTok := login(t, c, "admin@example.com")
	adaTok := login(t, c, "ADA@example.com") // email match is case-insensitive
	graceTok := login(t, c, "grace@example.com")

	var me store.User
	expect(t, "me", c.do("GET", "/api/auth/me", adminTok, nil, &me), 200)
	expect(t, "me role", me.Role, "admin")

	// --- authoring is admin-only ---
	mcBody := map[string]any{
		"type": "multiple-choice", "prompt": "Which OSI layer handles end-to-end delivery?",
		"tags": []string{"Networking", "OSI Model"}, "difficulty": "easy",
		"explanation": "The transport layer.",
		"options": []map[string]string{
			{"id": "A", "label": "Network"}, {"id": "B", "label": "Transport"}, {"id": "C", "label": "Session"}},
		"correctOptionId": "B",
	}
	expect(t, "non-admin create question", c.do("POST", "/api/questions", adaTok, mcBody, nil), 403)
	expect(t, "anonymous create question", c.do("POST", "/api/questions", "", mcBody, nil), 401)

	var mc store.Question
	expect(t, "create mc", c.do("POST", "/api/questions", adminTok, mcBody, &mc), 201)
	expect(t, "mc options", len(mc.Options), 3)
	expect(t, "mc correct", *mc.CorrectOptionID, "B")
	expect(t, "mc tags", mc.Tags, []string{"Networking", "OSI Model"})

	var tf store.Question
	expect(t, "create tf", c.do("POST", "/api/questions", adminTok, map[string]any{
		"type": "true-false", "prompt": "UDP guarantees ordering.", "tags": []string{"Networking"},
		"explanation": "It does not.", "correctAnswer": false,
	}, &tf), 201)
	expect(t, "tf correctAnswer present even when false", tf.CorrectAnswer != nil && !*tf.CorrectAnswer, true)

	expect(t, "invalid question", c.do("POST", "/api/questions", adminTok, map[string]any{
		"type": "multiple-choice", "prompt": "x", "tags": []string{"t"}, "explanation": "e",
		"options": []map[string]string{{"id": "A", "label": "only one"}}, "correctOptionId": "A",
	}, &errBody), 400)

	var mat store.Material
	expect(t, "create material", c.do("POST", "/api/materials", adminTok, map[string]any{
		"type": "book", "title": "Computer Networking", "url": "https://example.com/book",
		"author": "Kurose", "tags": []string{"Networking"}, "relatedQuestionIds": []string{mc.ID},
	}, &mat), 201)
	expect(t, "material links", mat.RelatedQuestionIDs, []string{mc.ID})
	expect(t, "non-admin create material", c.do("POST", "/api/materials", adaTok, map[string]any{}, nil), 403)

	var forQ []store.Material
	expect(t, "question materials", c.do("GET", "/api/questions/"+mc.ID+"/materials", "", nil, &forQ), 200)
	expect(t, "question materials count", len(forQ), 1)

	// linking from the question side
	var linked store.Question
	expect(t, "create linked question", c.do("POST", "/api/questions", adminTok, map[string]any{
		"type": "true-false", "prompt": "TCP is connection-oriented.", "tags": []string{"Networking"},
		"explanation": "Yes.", "correctAnswer": true, "relatedMaterialIds": []string{mat.ID},
	}, &linked), 201)
	var mats []store.Material
	expect(t, "materials list", c.do("GET", "/api/materials?type=book&tags=Networking", "", nil, &mats), 200)
	expect(t, "material now links both", len(mats[0].RelatedQuestionIDs), 2)

	// --- listing, filters, pagination ---
	var page store.QuestionsPage
	expect(t, "list", c.do("GET", "/api/questions?pageSize=2&page=2", "", nil, &page), 200)
	expect(t, "list totals", vals(page.Total, page.TotalPages, len(page.Items)), "3 2 1")
	expect(t, "tag filter", c.do("GET", "/api/questions?tags=OSI%20Model", "", nil, &page), 200)
	expect(t, "tag filter total", page.Total, 1)
	expect(t, "search", c.do("GET", "/api/questions?search=udp", "", nil, &page), 200)
	expect(t, "search hit", page.Items[0].ID, tf.ID)
	expect(t, "search with like metachar", c.do("GET", "/api/questions?search=%25", "", nil, &page), 200)
	expect(t, "literal % matches nothing", page.Total, 0)

	var tags []string
	expect(t, "tags", c.do("GET", "/api/tags", "", nil, &tags), 200)
	expect(t, "tags list", tags, []string{"Networking", "OSI Model"})

	var daily store.Question
	expect(t, "daily", c.do("GET", "/api/questions/daily", "", nil, &daily), 200)
	var daily2 store.Question
	c.do("GET", "/api/questions/daily", "", nil, &daily2)
	expect(t, "daily is stable", daily2.ID, daily.ID)

	expect(t, "unknown id", c.do("GET", "/api/questions/00000000-0000-0000-0000-000000000000", "", nil, nil), 404)
	expect(t, "non-uuid id", c.do("GET", "/api/questions/q1", "", nil, nil), 404)
	expect(t, "unknown route", c.do("GET", "/api/nope", "", nil, nil), 404)

	// --- localization ---
	if _, err := pool.Exec(ctx, `INSERT INTO question_translations (question_id, locale, prompt)
		VALUES ($1, 'de', 'Welche OSI-Schicht?')`, mc.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO question_option_translations (option_id, locale, label)
		SELECT id, 'de', 'Transportschicht' FROM question_options WHERE question_id = $1 AND option_key = 'B'`, mc.ID); err != nil {
		t.Fatal(err)
	}
	var de store.Question
	expect(t, "localized get", c.do("GET", "/api/questions/"+mc.ID+"?locale=de", "", nil, &de), 200)
	expect(t, "localized prompt", de.Prompt, "Welche OSI-Schicht?")
	expect(t, "localized option", de.Options[1].Label, "Transportschicht")
	expect(t, "untranslated explanation falls back", de.Explanation, "The transport layer.")

	// --- answering, stats, weak spots ---
	var ans store.SubmitAnswerResult
	expect(t, "anon submit", c.do("POST", "/api/questions/"+mc.ID+"/submit", "", map[string]any{"answer": "A"}, nil), 401)
	expect(t, "bad answer type", c.do("POST", "/api/questions/"+mc.ID+"/submit", adaTok, map[string]any{"answer": 3}, nil), 400)
	expect(t, "submit wrong", c.do("POST", "/api/questions/"+mc.ID+"/submit", adaTok, map[string]any{"answer": "A"}, &ans), 200)
	expect(t, "wrong result", vals(ans.Correct, ans.CorrectAnswer), "false B")
	expect(t, "submit tf right", c.do("POST", "/api/questions/"+tf.ID+"/submit", adaTok, map[string]any{"answer": false}, &ans), 200)
	expect(t, "tf result", vals(ans.Correct, ans.CorrectAnswer), "true false")

	var stats store.QuestionStats
	expect(t, "stats", c.do("GET", "/api/questions/"+mc.ID+"/stats", "", nil, &stats), 200)
	expect(t, "stats total", stats.TotalResponses, 1)
	expect(t, "stats A", vals(stats.Distribution[0].OptionID, stats.Distribution[0].Count, stats.Distribution[0].Percentage), "A 1 100")

	var weak []store.Question
	expect(t, "weak", c.do("GET", "/api/questions/weak", adaTok, nil, &weak), 200)
	expect(t, "weak contains wrong answer only", vals(len(weak), weak[0].ID), vals(1, mc.ID))
	expect(t, "weak is per user", c.do("GET", "/api/questions/weak", graceTok, nil, &weak), 200)
	expect(t, "grace has none", len(weak), 0)

	// --- richer list filters: difficulty, per-user status, sort ---
	expect(t, "difficulty", c.do("GET", "/api/questions?difficulty=easy", "", nil, &page), 200)
	expect(t, "difficulty hit", vals(page.Total, page.Items[0].ID), vals(1, mc.ID))
	expect(t, "bogus difficulty ignored", c.do("GET", "/api/questions?difficulty=nope", "", nil, &page), 200)
	expect(t, "bogus difficulty total", page.Total, 3)
	expect(t, "answered", c.do("GET", "/api/questions?status=answered", adaTok, nil, &page), 200)
	expect(t, "answered total", page.Total, 2)
	expect(t, "wrong", c.do("GET", "/api/questions?status=wrong", adaTok, nil, &page), 200)
	expect(t, "wrong hit", vals(page.Total, page.Items[0].ID), vals(1, mc.ID))
	expect(t, "unanswered", c.do("GET", "/api/questions?status=unanswered", adaTok, nil, &page), 200)
	expect(t, "unanswered hit", vals(page.Total, page.Items[0].ID), vals(1, linked.ID))
	expect(t, "status is per user", c.do("GET", "/api/questions?status=answered", graceTok, nil, &page), 200)
	expect(t, "grace answered none", page.Total, 0)
	expect(t, "anonymous status ignored", c.do("GET", "/api/questions?status=wrong", "", nil, &page), 200)
	expect(t, "anonymous total", page.Total, 3)
	expect(t, "newest", c.do("GET", "/api/questions?sort=newest", "", nil, &page), 200)
	expect(t, "newest first", page.Items[0].ID, linked.ID)
	var r1, r2 store.QuestionsPage
	c.do("GET", "/api/questions?sort=random&seed=abc", "", nil, &r1)
	c.do("GET", "/api/questions?sort=random&seed=abc", "", nil, &r2)
	expect(t, "random is stable per seed", vals(r2.Items[0].ID, r2.Items[1].ID, r2.Items[2].ID),
		vals(r1.Items[0].ID, r1.Items[1].ID, r1.Items[2].ID))

	// --- bookmarks, notes, comments, bug reports ---
	var bm struct{ Bookmarked bool }
	expect(t, "bookmark on", c.do("POST", "/api/questions/"+mc.ID+"/bookmark", adaTok, nil, &bm), 200)
	expect(t, "bookmarked", bm.Bookmarked, true)
	expect(t, "bookmarked filter", c.do("GET", "/api/questions?status=bookmarked", adaTok, nil, &page), 200)
	expect(t, "bookmarked filter hit", vals(page.Total, page.Items[0].ID), vals(1, mc.ID))
	var bms []store.Question
	c.do("GET", "/api/bookmarks", adaTok, nil, &bms)
	expect(t, "bookmarks list", len(bms), 1)
	c.do("POST", "/api/questions/"+mc.ID+"/bookmark", adaTok, nil, &bm)
	expect(t, "bookmark off", bm.Bookmarked, false)
	c.do("GET", "/api/bookmarks", adaTok, nil, &bms)
	expect(t, "bookmarks empty", len(bms), 0)

	var rawNote json.RawMessage
	expect(t, "no note yet", c.do("GET", "/api/questions/"+mc.ID+"/notes", adaTok, nil, &rawNote), 200)
	expect(t, "note is null", string(rawNote), "null")
	var note store.Note
	expect(t, "save note", c.do("PUT", "/api/questions/"+mc.ID+"/notes", adaTok, map[string]string{"body": "layer 4"}, &note), 200)
	c.do("PUT", "/api/questions/"+mc.ID+"/notes", adaTok, map[string]string{"body": "layer 4!"}, &note)
	expect(t, "note upserted", note.Body, "layer 4!")
	c.do("GET", "/api/questions/"+mc.ID+"/notes", graceTok, nil, &rawNote)
	expect(t, "notes are private", string(rawNote), "null")

	var cm store.Comment
	expect(t, "comment", c.do("POST", "/api/questions/"+mc.ID+"/comments", graceTok, map[string]string{"body": "Nice"}, &cm), 201)
	expect(t, "comment author", cm.UserName, "Grace")
	expect(t, "empty comment", c.do("POST", "/api/questions/"+mc.ID+"/comments", graceTok, map[string]string{"body": "  "}, nil), 400)
	var cms []store.Comment
	c.do("GET", "/api/questions/"+mc.ID+"/comments", "", nil, &cms)
	expect(t, "comments list", len(cms), 1)

	var bug store.BugReport
	expect(t, "bug report", c.do("POST", "/api/questions/"+mc.ID+"/bug-reports", adaTok, map[string]string{"message": "typo"}, &bug), 201)
	expect(t, "bug status", bug.Status, "open")

	// --- custom tests ---
	var test store.CustomTest
	expect(t, "create test", c.do("POST", "/api/tests", adaTok, map[string]any{
		"name": "Net quiz", "questionIds": []string{mc.ID, tf.ID}, "timed": true, "durationMinutes": 10,
	}, &test), 201)
	expect(t, "test order", test.QuestionIDs, []string{mc.ID, tf.ID})
	expect(t, "timed without duration", c.do("POST", "/api/tests", adaTok, map[string]any{
		"name": "x", "questionIds": []string{mc.ID}, "timed": true}, nil), 400)
	expect(t, "unknown question in test", c.do("POST", "/api/tests", adaTok, map[string]any{
		"name": "x", "questionIds": []string{"00000000-0000-0000-0000-000000000000"}}, nil), 400)
	expect(t, "other user can't see test", c.do("GET", "/api/tests/"+test.ID, graceTok, nil, nil), 404)

	var result store.TestSubmitResult
	expect(t, "submit test", c.do("POST", "/api/tests/"+test.ID+"/submit", adaTok, map[string]any{
		"mode": "exam", "answers": map[string]any{mc.ID: "B"}, // tf left unanswered
	}, &result), 200)
	expect(t, "test score", vals(result.Score, result.Total), "1 2")
	expect(t, "unanswered omitted", result.Breakdown[1].GivenAnswer, nil)
	expect(t, "invalid mode", c.do("POST", "/api/tests/"+test.ID+"/submit", adaTok, map[string]any{"mode": "x"}, nil), 400)

	expect(t, "retry subset", c.do("POST", "/api/tests/"+test.ID+"/submit", adaTok, map[string]any{
		"mode": "practice", "answers": map[string]any{tf.ID: false}, "questionIds": []string{tf.ID},
	}, &result), 200)
	expect(t, "retry scored only subset", vals(result.Score, result.Total), "1 1")

	var attempts []store.TestAttempt
	expect(t, "attempts", c.do("GET", "/api/tests/"+test.ID+"/attempts", adaTok, nil, &attempts), 200)
	expect(t, "attempts count + newest first", vals(len(attempts), attempts[0].Mode), "2 practice")

	var search store.SearchResults
	expect(t, "search", c.do("GET", "/api/search?q=net", adaTok, nil, &search), 200)
	expect(t, "search groups", vals(len(search.Questions), len(search.Materials), len(search.Tests)), "3 1 1")
	c.do("GET", "/api/search?q=net", "", nil, &search)
	expect(t, "anonymous search has no tests", len(search.Tests), 0)

	// --- admin stats ---
	expect(t, "stats non-admin", c.do("GET", "/api/admin/stats", adaTok, nil, nil), 403)
	var as store.AdminStats
	expect(t, "stats admin", c.do("GET", "/api/admin/stats", adminTok, nil, &as), 200)
	tot := as.Totals
	expect(t, "totals", vals(tot.Questions, tot.Materials, tot.Users, tot.Tests, tot.TestAttempts, tot.AnswersSubmitted, tot.Comments, tot.BugReports),
		"3 1 3 1 2 5 1 1")
	expect(t, "correctness", vals(as.Correctness.Correct, as.Correctness.Incorrect), "3 2")
	expect(t, "difficulty order", vals(as.QuestionsByDifficulty), "[{easy 1} {unspecified 2}]")

	expect(t, "delete test", c.do("DELETE", "/api/tests/"+test.ID, adaTok, nil, nil), 204)
	expect(t, "deleted", c.do("GET", "/api/tests/"+test.ID, adaTok, nil, nil), 404)

	// --- logout ---
	expect(t, "logout", c.do("POST", "/api/auth/logout", adaTok, nil, nil), 204)
	expect(t, "token revoked", c.do("GET", "/api/auth/me", adaTok, nil, nil), 401)
}

func itoa(n int64) string { return strconv.FormatInt(n, 10) }
