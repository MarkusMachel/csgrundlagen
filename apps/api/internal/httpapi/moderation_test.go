package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestCommentModeration(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	for _, u := range []struct{ email, role string }{
		{"root@example.com", "admin"}, {"ada@example.com", "user"}, {"grace@example.com", "user"},
	} {
		if _, err := st.CreateUser(ctx, "Someone", u.email, "correct horse battery", u.role, "en"); err != nil {
			t.Fatal(err)
		}
	}
	login := func(email string) string {
		var body struct{ Token string }
		c.do("POST", "/api/auth/login", "", map[string]string{"email": email, "password": "correct horse battery"}, &body)
		return body.Token
	}
	root, ada, grace := login("root@example.com"), login("ada@example.com"), login("grace@example.com")

	var q store.Question
	expect(t, "question", c.do("POST", "/api/questions", root, map[string]any{
		"type": "true-false", "prompt": "TCP is connection-oriented.", "explanation": "It is.",
		"correctAnswer": true, "tags": []string{"Networking"},
	}, &q), 201)
	var spam, fine store.Comment
	c.do("POST", "/api/questions/"+q.ID+"/comments", ada, map[string]string{"body": "buy cheap pills"}, &spam)
	c.do("POST", "/api/questions/"+q.ID+"/comments", ada, map[string]string{"body": "nice one"}, &fine)

	// --- reporting ---
	var errBody struct{ Message string }
	expect(t, "own comment", c.do("POST", "/api/comments/"+spam.ID+"/report", ada, map[string]string{"reason": "spam"}, &errBody), 400)
	expect(t, "bad reason", c.do("POST", "/api/comments/"+spam.ID+"/report", grace, map[string]string{"reason": "boring"}, &errBody), 400)
	expect(t, "needs login", c.do("POST", "/api/comments/"+spam.ID+"/report", "", map[string]string{"reason": "spam"}, nil), 401)
	for range 2 {
		expect(t, "report", c.do("POST", "/api/comments/"+spam.ID+"/report", grace, map[string]string{"reason": "spam", "note": "ad"}, nil), 204)
	}
	var list []store.Comment
	c.do("GET", "/api/questions/"+q.ID+"/comments", grace, nil, &list)
	expect(t, "reportedByMe", vals(list[0].ReportedByMe, list[1].ReportedByMe), "true false")

	// --- queue ---
	var queue struct {
		Items       []store.ModeratedComment
		OpenReports int
	}
	expect(t, "members can't moderate", c.do("GET", "/api/admin/comments", grace, nil, nil), 403)
	expect(t, "queue", c.do("GET", "/api/admin/comments", root, nil, &queue), 200)
	expect(t, "one reported, reported once", vals(len(queue.Items), queue.OpenReports, len(queue.Items[0].OpenReports)), "1 1 1")
	expect(t, "report details", vals(queue.Items[0].OpenReports[0].Reason, *queue.Items[0].OpenReports[0].Note, queue.Items[0].QuestionPrompt),
		"spam ad TCP is connection-oriented.")

	// --- hiding: gone for readers, visible to admins, reports resolved ---
	expect(t, "hide", c.do("PATCH", "/api/admin/comments/"+spam.ID, root, map[string]any{"hidden": true}, nil), 204)
	c.do("GET", "/api/questions/"+q.ID+"/comments", "", nil, &list)
	expect(t, "hidden for anonymous", len(list), 1)
	c.do("GET", "/api/questions/"+q.ID+"/comments", grace, nil, &list)
	expect(t, "hidden for members", len(list), 1)
	c.do("GET", "/api/questions/"+q.ID+"/comments", root, nil, &list)
	expect(t, "admins see it, flagged", vals(len(list), list[0].Hidden), "2 true")
	c.do("GET", "/api/admin/comments", root, nil, &queue)
	expect(t, "reports resolved", vals(len(queue.Items), queue.OpenReports), "0 0")
	c.do("GET", "/api/admin/comments?filter=hidden", root, nil, &queue)
	expect(t, "hidden filter", len(queue.Items), 1)
	expect(t, "can't report hidden", c.do("POST", "/api/comments/"+spam.ID+"/report", root, map[string]string{"reason": "spam"}, nil), 404)
	expect(t, "unhide", c.do("PATCH", "/api/admin/comments/"+spam.ID, root, map[string]any{"hidden": false}, nil), 204)

	// --- dismissing ---
	c.do("POST", "/api/comments/"+fine.ID+"/report", grace, map[string]string{"reason": "other"}, nil)
	expect(t, "dismiss", c.do("PATCH", "/api/admin/comments/"+fine.ID, root, map[string]any{}, nil), 204)
	c.do("GET", "/api/admin/comments", root, nil, &queue)
	expect(t, "dismissed", len(queue.Items), 0)
	c.do("GET", "/api/questions/"+q.ID+"/comments", grace, nil, &list)
	expect(t, "still visible", len(list), 2)

	// --- deleting: authors and admins only ---
	expect(t, "others can't delete", c.do("DELETE", "/api/comments/"+fine.ID, grace, nil, nil), 404)
	expect(t, "author deletes", c.do("DELETE", "/api/comments/"+fine.ID, ada, nil, nil), 204)
	expect(t, "admin deletes", c.do("DELETE", "/api/comments/"+spam.ID, root, nil, nil), 204)
	c.do("GET", "/api/questions/"+q.ID+"/comments", root, nil, &list)
	expect(t, "all gone", len(list), 0)
}
