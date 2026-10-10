package httpapi

import (
	"net/http"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// recordConsent logs the user's choice from the consent dialog.
func (s *Server) recordConsent(w http.ResponseWriter, r *http.Request) {
	var body store.Consent
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.RecordConsent(r.Context(), currentUser(r).ID, body, clientOf(r)); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// acceptPrivacy records that the user read the current privacy policy.
func (s *Server) acceptPrivacy(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Version string `json:"version"`
	}
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.AcceptPrivacyPolicy(r.Context(), currentUser(r).ID, body.Version); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// exportMyData answers with everything stored about the user as a JSON download.
func (s *Server) exportMyData(w http.ResponseWriter, r *http.Request) {
	data, err := s.store.ExportUserData(r.Context(), currentUser(r).ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition",
		`attachment; filename="csgrundlagen-data-`+time.Now().UTC().Format("2006-01-02")+`.json"`)
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

// deleteMyAccount permanently deletes the signed-in user after a password check.
func (s *Server) deleteMyAccount(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.DeleteAccount(r.Context(), currentUser(r).ID, body.Password); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
