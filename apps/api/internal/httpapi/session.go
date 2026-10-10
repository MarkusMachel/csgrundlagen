package httpapi

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// SessionCookie holds the session token for the web app. It is HttpOnly, so
// page scripts (and anything injected into them) can't read it.
const SessionCookie = "cft_session"

// TokenModeHeader asks login/sign-up to return the token in the body as well,
// for scripts and API clients that send it as "Authorization: Bearer …".
// The web app never asks: it relies on the cookie alone.
const TokenModeHeader = "X-Auth-Mode"

// sessionToken is the bearer token if one is sent, otherwise the cookie.
func sessionToken(r *http.Request) string {
	if t, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer "); ok {
		return strings.TrimSpace(t)
	}
	if c, err := r.Cookie(SessionCookie); err == nil {
		return c.Value
	}
	return ""
}

func secureRequest(r *http.Request) bool {
	return r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https"
}

func setSessionCookie(w http.ResponseWriter, r *http.Request, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookie,
		Value:    token,
		Path:     "/api",
		MaxAge:   int(store.SessionTTL / time.Second),
		HttpOnly: true,
		Secure:   secureRequest(r),
		SameSite: http.SameSiteLaxMode,
	})
}

func clearSessionCookie(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name: SessionCookie, Value: "", Path: "/api", MaxAge: -1,
		HttpOnly: true, Secure: secureRequest(r), SameSite: http.SameSiteLaxMode,
	})
}

// writeSession answers a successful login or sign-up: the cookie for the web
// app, and the token in the body only for clients that asked for it.
func (s *Server) writeSession(w http.ResponseWriter, r *http.Request, status int, token string, user store.User) {
	setSessionCookie(w, r, token)
	body := map[string]any{"user": user}
	if r.Header.Get(TokenModeHeader) == "token" {
		body["token"] = token
	}
	writeJSON(w, status, body)
}

// sameOrigin guards cookie-authenticated writes against cross-site requests
// (CSRF). SameSite=Lax already keeps the cookie off cross-site POSTs in
// current browsers; this also covers older ones. Requests carrying a bearer
// token aren't affected: another site can't add that header.
func sameOrigin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			next.ServeHTTP(w, r)
			return
		}
		if r.Header.Get("Authorization") != "" {
			next.ServeHTTP(w, r)
			return
		}
		if site := r.Header.Get("Sec-Fetch-Site"); site != "" && site != "same-origin" && site != "same-site" && site != "none" {
			writeError(w, http.StatusForbidden, "Cross-site request refused")
			return
		}
		if origin := r.Header.Get("Origin"); origin != "" {
			u, err := url.Parse(origin)
			host := r.Header.Get("X-Forwarded-Host")
			if host == "" {
				host = r.Host
			}
			if err != nil || !strings.EqualFold(u.Host, host) {
				writeError(w, http.StatusForbidden, "Cross-site request refused")
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
