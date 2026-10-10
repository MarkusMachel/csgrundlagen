package httpapi

import (
	"net/http"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// getDraft answers with the unfinished attempt, or null if there is none.
func (s *Server) getDraft(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	d, err := s.store.Draft(r.Context(), id, currentUser(r).ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func (s *Server) saveDraft(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body store.TestDraft
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.SaveDraft(r.Context(), id, currentUser(r).ID, body); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteDraft(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.DeleteDraft(r.Context(), id, currentUser(r).ID); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
