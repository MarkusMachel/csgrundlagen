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

func TestQuestionHistoryAndQuality(t *testing.T) {
	ctx := context.Background()
	pool := newTestDB(t)
	st := store.New(pool)
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	_, err := st.CreateUser(ctx, "Root", "root@example.com", "correct horse battery", "admin", "en")
	if err != nil {
		t.Fatal(err)
	}
	learner, _ := st.CreateUser(ctx, "Ada", "ada@example.com", "correct horse battery", "user", "en")
	var login struct{ Token string }
	c.do("POST", "/api/auth/login", "", map[string]string{"email": "root@example.com", "password": "correct horse battery"}, &login)
	tok := login.Token

	mc := func(prompt string) map[string]any {
		return map[string]any{
			"type": "multiple-choice", "prompt": prompt, "explanation": "e", "tags": []string{"Networking"},
			"options":         []map[string]string{{"id": "A", "label": "TCP"}, {"id": "B", "label": "UDP"}, {"id": "C", "label": "ICMP"}},
			"correctOptionId": "A",
		}
	}

	// --- history: created, edited, restored ---
	var q store.Question
	expect(t, "create", c.do("POST", "/api/questions", tok, mc("Which is reliable?"), &q), 201)
	edit := mc("Which protocol is reliable?")
	edit["correctOptionId"] = "B" // a mistake
	expect(t, "edit", c.do("PUT", "/api/questions/"+q.ID, tok, edit, nil), 200)
	var revs []store.Revision
	expect(t, "members can't see history", c.do("GET", "/api/questions/"+q.ID+"/revisions", "", nil, nil), 401)
	expect(t, "history", c.do("GET", "/api/questions/"+q.ID+"/revisions", tok, nil, &revs), 200)
	expect(t, "two versions, newest first", vals(len(revs), revs[0].Kind, revs[1].Kind), "2 edited created")
	expect(t, "editor named", *revs[0].EditorName, "Root")
	expect(t, "snapshot", vals(revs[0].Snapshot.Prompt, *revs[0].Snapshot.CorrectOptionID), "Which protocol is reliable? B")

	var restored store.Question
	expect(t, "restore", c.do("POST", "/api/questions/"+q.ID+"/revisions/"+itoa(revs[1].ID)+"/restore", tok, nil, &restored), 200)
	expect(t, "content back", vals(restored.Prompt, *restored.CorrectOptionID), "Which is reliable? A")
	c.do("GET", "/api/questions/"+q.ID+"/revisions", tok, nil, &revs)
	expect(t, "restore recorded", vals(len(revs), revs[0].Kind, *revs[0].RestoredFrom == revs[2].ID), "3 restored true")
	expect(t, "unknown revision", c.do("POST", "/api/questions/"+q.ID+"/revisions/999999/restore", tok, nil, nil), 404)

	// a question from before history (seeded straight into the database)
	var legacyID string
	if err := pool.QueryRow(ctx, `INSERT INTO questions (type, prompt, explanation, correct_answer)
		VALUES ('true-false', 'Old prompt', 'e', true) RETURNING id`).Scan(&legacyID); err != nil {
		t.Fatal(err)
	}
	pool.Exec(ctx, `INSERT INTO question_tags (question_id, tag_id) SELECT $1, id FROM tags WHERE name = 'Networking'`, legacyID)
	expect(t, "edit legacy", c.do("PUT", "/api/questions/"+legacyID, tok, map[string]any{
		"type": "true-false", "prompt": "New prompt", "explanation": "e", "tags": []string{"Networking"}, "correctAnswer": true,
	}, nil), 200)
	c.do("GET", "/api/questions/"+legacyID+"/revisions", tok, nil, &revs)
	expect(t, "original kept", vals(len(revs), revs[1].Kind, revs[1].Snapshot.Prompt), "2 original Old prompt")

	// --- quality ---
	answer := func(qid, value string, correct bool, n int) {
		for range n {
			if _, err := pool.Exec(ctx, `INSERT INTO question_answers (user_id, question_id, answer_value, is_correct)
				VALUES ($1, $2, $3, $4)`, learner.ID, qid, value, correct); err != nil {
				t.Fatal(err)
			}
		}
	}
	var easy, keyed, fresh store.Question
	c.do("POST", "/api/questions", tok, mc("Easy one"), &easy)
	c.do("POST", "/api/questions", tok, mc("Bad key"), &keyed)
	c.do("POST", "/api/questions", tok, mc("Barely answered"), &fresh)
	answer(easy.ID, "A", true, 24) // 24 of 25 right; C never picked
	answer(easy.ID, "B", false, 1)
	answer(keyed.ID, "A", true, 4) // most people pick B: the key is probably wrong
	answer(keyed.ID, "B", false, 12)
	answer(keyed.ID, "C", false, 4)
	answer(fresh.ID, "B", false, 3)

	var rep store.QualityReport
	expect(t, "members can't", c.do("GET", "/api/admin/quality", "", nil, nil), 401)
	expect(t, "report", c.do("GET", "/api/admin/quality", tok, nil, &rep), 200)
	byID := map[string]store.QualityItem{}
	for _, it := range rep.Items {
		byID[it.QuestionID] = it
	}
	expect(t, "bad key first", rep.Items[0].QuestionID, keyed.ID)
	expect(t, "bad key flags", vals(byID[keyed.ID].Flags), "[too_hard wrong_key]")
	expect(t, "easy flags", vals(byID[easy.ID].Flags), "[too_easy dead_distractor]")
	expect(t, "easy picks", vals(byID[easy.ID].Options[0].Picks, byID[easy.ID].Options[2].Picks), "24 0")
	expect(t, "too few answers: no verdict", len(byID[fresh.ID].Flags), 0)
	expect(t, "counts", vals(rep.Analysed, rep.FlagCounts["wrong_key"]), "2 1")
	expect(t, "fresh counted as too few", rep.TooFew >= 1, true)
}
