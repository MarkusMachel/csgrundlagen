package httpapi

import (
	"net/http"
	"strings"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// exportAnki answers with an Anki import file for bookmarks, a test, or the
// questions matching the feed filters (at most 2000).
func (s *Server) exportAnki(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	user := currentUser(r)
	var questions []store.Question
	var err error
	switch q.Get("source") {
	case "bookmarks":
		questions, err = s.store.BookmarkedQuestions(r.Context(), user.ID, locale(r))
	case "test":
		id := q.Get("id")
		if !store.IsUUID(id) {
			writeError(w, http.StatusNotFound, "Not found")
			return
		}
		var test store.CustomTest
		if test, err = s.store.Test(r.Context(), id, user.ID); err == nil {
			questions, err = s.store.QuestionsByIDs(r.Context(), test.QuestionIDs, locale(r))
		}
	default: // the feed's filters
		f := store.QuestionFilter{Page: 1, PageSize: 2000, Locale: locale(r), Search: strings.TrimSpace(q.Get("search"))}
		for _, t := range q["tags"] {
			if t = strings.TrimSpace(t); t != "" {
				f.Tags = append(f.Tags, t)
			}
		}
		for _, d := range q["difficulty"] {
			if d == "easy" || d == "medium" || d == "hard" {
				f.Difficulties = append(f.Difficulties, d)
			}
		}
		switch status := q.Get("status"); status {
		case "unanswered", "answered", "wrong", "bookmarked":
			f.Status, f.UserID = status, user.ID
		}
		var page store.QuestionsPage
		if page, err = s.store.ListQuestions(r.Context(), f); err == nil {
			questions = page.Items
		}
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition",
		`attachment; filename="cs-trainer-anki-`+time.Now().UTC().Format("2006-01-02")+`.txt"`)
	_, _ = w.Write([]byte(store.AnkiExport(questions)))
}

func (s *Server) importFlashcards(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Cards       []store.FlashcardInput `json:"cards"`
		DefaultTags []string               `json:"defaultTags"`
	}
	// imports are bigger than other requests: allow up to 8 MB
	r.Body = http.MaxBytesReader(w, r.Body, 8<<20)
	if !decodeLarge(w, r, &body) {
		return
	}
	res, err := s.store.ImportFlashcards(r.Context(), currentUser(r).ID, body.Cards, body.DefaultTags)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}
