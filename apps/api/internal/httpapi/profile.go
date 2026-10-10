package httpapi

import (
	"net/http"
	"net/url"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func (s *Server) updateProfile(w http.ResponseWriter, r *http.Request) {
	var body store.ProfileUpdate
	if !decode(w, r, &body) {
		return
	}
	u, err := s.store.UpdateProfile(r.Context(), currentUser(r).ID, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// requestEmailChange sends a confirmation link to the new address; the email
// changes only when that link is opened.
func (s *Server) requestEmailChange(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	user := currentUser(r)
	token, email, err := s.store.RequestEmailChange(r.Context(), user.ID, body.Email, body.Password)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	link := s.opts.BaseURL + "/confirm-email?token=" + url.QueryEscape(token)
	msg := "Hi " + user.Name + ",\n\nOpen this link within 24 hours to use this address for your account:\n" + link +
		"\n\nIf you didn't ask for this, ignore this email; nothing changes."
	if err := s.opts.Mailer.Send(r.Context(), email, "Confirm your new email address", msg); err != nil {
		s.log.Error("send email change", "err", err)
	}
	writeJSON(w, http.StatusAccepted, map[string]string{"email": email})
}

// confirmEmailChange needs no session: the token is the proof. The old
// address is told about the change, so a hijacked account doesn't go unnoticed.
func (s *Server) confirmEmailChange(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
	}
	if !decode(w, r, &body) {
		return
	}
	u, oldEmail, err := s.store.ConfirmEmailChange(r.Context(), body.Token)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	msg := "Hi " + u.Name + ",\n\nThe email address of your account was changed to " + u.Email +
		".\n\nIf this wasn't you, reset your password right away and contact the site operator."
	if err := s.opts.Mailer.Send(r.Context(), oldEmail, "Your email address was changed", msg); err != nil {
		s.log.Error("send email changed notice", "err", err)
	}
	writeJSON(w, http.StatusOK, u)
}
