package httpapi

import (
	"net/http"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func (s *Server) savedFilters(w http.ResponseWriter, r *http.Request) {
	fs, err := s.store.SavedFilters(r.Context(), currentUser(r).ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, fs)
}

func (s *Server) saveFilter(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name    string           `json:"name"`
		Filters store.FilterSpec `json:"filters"`
	}
	if !decode(w, r, &body) {
		return
	}
	f, err := s.store.SaveFilter(r.Context(), currentUser(r).ID, body.Name, body.Filters)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, f)
}

func (s *Server) changeFilter(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body store.FilterChange
	if !decode(w, r, &body) {
		return
	}
	f, err := s.store.ChangeFilter(r.Context(), currentUser(r).ID, id, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, f)
}

func (s *Server) deleteFilter(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.DeleteFilter(r.Context(), currentUser(r).ID, id); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
