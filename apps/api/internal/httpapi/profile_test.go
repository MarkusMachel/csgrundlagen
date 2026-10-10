package httpapi_test

import (
	"io"
	"log/slog"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

var emailTokenRe = regexp.MustCompile(`/confirm-email\?token=([A-Za-z0-9_-]+)`)

func TestProfile(t *testing.T) {
	st := store.New(newTestDB(t))
	mail := &captureMailer{}
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{BaseURL: "https://app.example", Mailer: mail, AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	var errBody struct{ Message string }

	signup := func(name, email string) string {
		var s struct{ Token string }
		expect(t, "signup "+email, c.do("POST", "/api/auth/signup", "", map[string]any{
			"name": name, "email": email, "password": "long enough pw", "acceptPrivacy": true}, &s), 201)
		return s.Token
	}
	tok := signup("Ada", "ada@example.com")
	signup("Grace", "grace@example.com")

	// --- name and language ---
	var me store.User
	expect(t, "update", c.do("PATCH", "/api/me", tok, map[string]string{"name": "  Ada L.  ", "locale": "de"}, &me), 200)
	expect(t, "updated", vals(me.Name, me.Locale), "Ada L. de")
	expect(t, "partial update", c.do("PATCH", "/api/me", tok, map[string]string{"locale": "klingon"}, &me), 200)
	expect(t, "unknown locale falls back, name kept", vals(me.Name, me.Locale), "Ada L. en")
	expect(t, "blank name", c.do("PATCH", "/api/me", tok, map[string]string{"name": " "}, &errBody), 400)
	expect(t, "needs login", c.do("PATCH", "/api/me", "", map[string]string{"name": "x"}, nil), 401)

	// --- email change needs the password and a confirmed link ---
	expect(t, "wrong password", c.do("POST", "/api/me/email", tok, map[string]string{
		"email": "new@example.com", "password": "nope"}, &errBody), 400)
	expect(t, "taken", c.do("POST", "/api/me/email", tok, map[string]string{
		"email": "GRACE@example.com", "password": "long enough pw"}, &errBody), 409)
	expect(t, "same as current", c.do("POST", "/api/me/email", tok, map[string]string{
		"email": "ada@example.com", "password": "long enough pw"}, &errBody), 400)
	expect(t, "request", c.do("POST", "/api/me/email", tok, map[string]string{
		"email": " New@Example.com ", "password": "long enough pw"}, nil), 202)
	sent := mail.last()
	expect(t, "link sent to the new address", strings.HasPrefix(sent, "new@example.com\n"), true)
	c.do("GET", "/api/auth/me", tok, nil, &me)
	expect(t, "unchanged until confirmed", me.Email, "ada@example.com")

	token := emailTokenRe.FindStringSubmatch(sent)[1]
	expect(t, "bad token", c.do("POST", "/api/me/email/confirm", "", map[string]string{"token": "nope"}, &errBody), 400)
	expect(t, "confirm", c.do("POST", "/api/me/email/confirm", "", map[string]string{"token": token}, &me), 200)
	expect(t, "changed", me.Email, "new@example.com")
	expect(t, "old address told", strings.HasPrefix(mail.last(), "ada@example.com\n"), true)
	expect(t, "single use", c.do("POST", "/api/me/email/confirm", "", map[string]string{"token": token}, &errBody), 400)
	expect(t, "login with new email", c.do("POST", "/api/auth/login", "", map[string]string{
		"email": "new@example.com", "password": "long enough pw"}, nil), 200)
}
