package httpapi

import (
	"net/http"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// clientOf is the device a request came from, recorded on sessions and in
// the sign-in history.
func clientOf(r *http.Request) store.Client {
	return store.Client{IP: clientIP(r), UserAgent: r.UserAgent()}
}

// --- the signed-in user's own devices ------------------------------------------

func (s *Server) mySessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := s.store.ListSessions(r.Context(), currentUser(r).ID, sessionToken(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, sessions)
}

// revokeMySession signs one of the user's devices out; revoking the current
// session is the same as logging out.
func (s *Server) revokeMySession(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.RevokeSession(r.Context(), currentUser(r).ID, id); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// saveDevice stores what the browser reports about itself on the current
// session (time zone, screen, languages, ...).
func (s *Server) saveDevice(w http.ResponseWriter, r *http.Request) {
	var body store.ClientInfo
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.SaveClientInfo(r.Context(), sessionToken(r), body); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- admin: every user's devices and sign-in history ---------------------------

func (s *Server) adminUsers(w http.ResponseWriter, r *http.Request) {
	users, err := s.store.AdminUsers(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, users)
}

func (s *Server) adminUserDetail(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	detail, err := s.store.AdminUserDetail(r.Context(), id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (s *Server) adminRevokeSession(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	sid := r.PathValue("sid")
	if !store.IsUUID(sid) {
		writeError(w, http.StatusNotFound, "Not found")
		return
	}
	if err := s.store.RevokeSession(r.Context(), id, sid); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) adminRevokeAllSessions(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	n, err := s.store.RevokeAllSessions(r.Context(), id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int64{"revoked": n})
}

// adminChangeUser changes another account's role or blocks/unblocks it.
func (s *Server) adminChangeUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body store.UserChange
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.ChangeUser(r.Context(), currentUser(r).ID, id, body); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) adminDeleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.AdminDeleteUser(r.Context(), currentUser(r).ID, id); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
