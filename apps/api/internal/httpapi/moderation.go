package httpapi

import (
	"net/http"
)

func (s *Server) reportComment(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Reason string `json:"reason"`
		Note   string `json:"note"`
	}
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.ReportComment(r.Context(), currentUser(r).ID, id, body.Reason, body.Note); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteComment(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.DeleteComment(r.Context(), currentUser(r), id); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) moderationQueue(w http.ResponseWriter, r *http.Request) {
	items, err := s.store.ModerationQueue(r.Context(), r.URL.Query().Get("filter"))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	open, err := s.store.OpenCommentReports(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "openReports": open})
}

// moderateComment hides/unhides a comment ({"hidden": bool}) or, with an
// empty body, dismisses its open reports.
func (s *Server) moderateComment(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Hidden *bool `json:"hidden"`
	}
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.ModerateComment(r.Context(), currentUser(r).ID, id, body.Hidden); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
