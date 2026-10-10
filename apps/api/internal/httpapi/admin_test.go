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

// newServer starts an API on a fresh database with an admin and a regular
// user, returning a client and both users' tokens.
func newServer(t *testing.T) (client, string, string) {
	t.Helper()
	st := store.New(newTestDB(t))
	ctx := context.Background()
	for _, u := range []struct{ email, role string }{{"admin@example.com", "admin"}, {"ada@example.com", "user"}} {
		if _, err := st.CreateUser(ctx, "Someone", u.email, "correct horse battery", u.role, "en"); err != nil {
			t.Fatalf("create user: %v", err)
		}
	}
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	t.Cleanup(srv.Close)
	c := client{t: t, srv: srv}
	return c, login(t, c, "admin@example.com"), login(t, c, "ada@example.com")
}

func TestAdminContent(t *testing.T) {
	c, admin, ada := newServer(t)

	var mat store.Material
	expect(t, "create material", c.do("POST", "/api/materials", admin, map[string]any{
		"type": "article", "title": "TCP", "url": "https://example.com/tcp", "tags": []string{"Networking"},
	}, &mat), 201)
	var q store.Question
	expect(t, "create question", c.do("POST", "/api/questions", admin, map[string]any{
		"type": "multiple-choice", "prompt": "Which layer?", "tags": []string{"Networking"},
		"explanation": "Transport.", "options": []map[string]string{{"id": "A", "label": "Network"}, {"id": "B", "label": "Transport"}},
		"correctOptionId": "B", "relatedMaterialIds": []string{mat.ID},
	}, &q), 201)

	// --- edit a question: content, options, tags, links, even the type ---
	edit := map[string]any{
		"type": "multiple-choice", "prompt": "Which OSI layer?", "tags": []string{"Networking", "OSI"},
		"difficulty": "easy", "explanation": "Layer 4.",
		"options":         []map[string]string{{"id": "A", "label": "Session"}, {"id": "B", "label": "Network"}, {"id": "C", "label": "Transport"}},
		"correctOptionId": "C", "relatedMaterialIds": []string{},
	}
	expect(t, "non-admin edit", c.do("PUT", "/api/questions/"+q.ID, ada, edit, nil), 403)
	var edited store.Question
	expect(t, "edit question", c.do("PUT", "/api/questions/"+q.ID, admin, edit, &edited), 200)
	expect(t, "edited fields", vals(edited.Prompt, len(edited.Options), *edited.CorrectOptionID, edited.Tags), "Which OSI layer? 3 C [Networking OSI]")
	var links []store.Material
	c.do("GET", "/api/questions/"+q.ID+"/materials", "", nil, &links)
	expect(t, "links replaced", len(links), 0)

	var ans store.SubmitAnswerResult
	expect(t, "answer the edited question", c.do("POST", "/api/questions/"+q.ID+"/submit", ada, map[string]any{"answer": "C"}, &ans), 200)
	expect(t, "graded against new key", ans.Correct, true)

	var tf store.Question // fresh: JSON omits empty options, so reusing edited would keep the old ones
	expect(t, "edit to true-false", c.do("PUT", "/api/questions/"+q.ID, admin, map[string]any{
		"type": "true-false", "prompt": "TCP is reliable.", "tags": []string{"Networking"},
		"explanation": "Yes.", "correctAnswer": true,
	}, &tf), 200)
	expect(t, "now true-false", vals(tf.Type, len(tf.Options), *tf.CorrectAnswer), "true-false 0 true")
	expect(t, "invalid edit", c.do("PUT", "/api/questions/"+q.ID, admin, map[string]any{"type": "multiple-choice"}, nil), 400)
	expect(t, "edit unknown", c.do("PUT", "/api/questions/00000000-0000-0000-0000-000000000000", admin, edit, nil), 404)

	// --- bug report queue ---
	var bug store.BugReport
	expect(t, "file report", c.do("POST", "/api/questions/"+q.ID+"/bug-reports", ada,
		map[string]string{"message": "Typo in the prompt"}, &bug), 201)
	expect(t, "non-admin queue", c.do("GET", "/api/admin/bug-reports", ada, nil, nil), 403)
	var queue []store.AdminBugReport
	expect(t, "open queue", c.do("GET", "/api/admin/bug-reports?status=open", admin, nil, &queue), 200)
	expect(t, "queue entry", vals(len(queue), queue[0].QuestionPrompt, queue[0].Message), "1 TCP is reliable. Typo in the prompt")
	var updated store.AdminBugReport
	expect(t, "close report", c.do("PATCH", "/api/admin/bug-reports/"+bug.ID, admin, map[string]string{"status": "closed"}, &updated), 200)
	expect(t, "closed", updated.Status, "closed")
	c.do("GET", "/api/admin/bug-reports?status=open", admin, nil, &queue)
	expect(t, "open queue empty", len(queue), 0)
	expect(t, "bad status", c.do("PATCH", "/api/admin/bug-reports/"+bug.ID, admin, map[string]string{"status": "done"}, nil), 400)

	// --- edit and delete a material ---
	var em store.Material
	expect(t, "edit material", c.do("PUT", "/api/materials/"+mat.ID, admin, map[string]any{
		"type": "video", "title": "TCP explained", "url": "https://example.com/tcp-video", "tags": []string{"Video"},
		"relatedQuestionIds": []string{q.ID},
	}, &em), 200)
	expect(t, "material edited", vals(em.Type, em.Title, em.Tags, len(em.RelatedQuestionIDs)), "video TCP explained [Video] 1")
	expect(t, "non-admin delete material", c.do("DELETE", "/api/materials/"+mat.ID, ada, nil, nil), 403)
	expect(t, "delete material", c.do("DELETE", "/api/materials/"+mat.ID, admin, nil, nil), 204)
	expect(t, "material gone", c.do("DELETE", "/api/materials/"+mat.ID, admin, nil, nil), 404)

	// --- delete the question: answers and reports go with it ---
	expect(t, "non-admin delete", c.do("DELETE", "/api/questions/"+q.ID, ada, nil, nil), 403)
	expect(t, "delete question", c.do("DELETE", "/api/questions/"+q.ID, admin, nil, nil), 204)
	expect(t, "question gone", c.do("GET", "/api/questions/"+q.ID, "", nil, nil), 404)
	c.do("GET", "/api/admin/bug-reports", admin, nil, &queue)
	expect(t, "reports cascade", len(queue), 0)
}
