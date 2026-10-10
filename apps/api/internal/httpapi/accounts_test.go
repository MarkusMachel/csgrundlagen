package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http/httptest"
	"regexp"
	"sync"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// captureMailer records sent mail so tests can follow reset links.
type captureMailer struct {
	mu   sync.Mutex
	sent []string
}

func (m *captureMailer) Send(_ context.Context, to, _, body string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sent = append(m.sent, to+"\n"+body)
	return nil
}

func (m *captureMailer) last() string {
	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.sent) == 0 {
		return ""
	}
	return m.sent[len(m.sent)-1]
}

var resetTokenRe = regexp.MustCompile(`/reset-password\?token=([A-Za-z0-9_-]+)`)

func TestAccounts(t *testing.T) {
	st := store.New(newTestDB(t))
	mail := &captureMailer{}
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{BaseURL: "https://app.example", Mailer: mail, AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}

	type session struct {
		Token string     `json:"token"`
		User  store.User `json:"user"`
	}
	var errBody struct{ Message string }

	// --- sign-up ---
	var sess session
	expect(t, "signup", c.do("POST", "/api/auth/signup", "", map[string]string{
		"name": "Linus", "email": " Linus@Example.com ", "password": "first password",
	}, &sess), 201)
	expect(t, "signup user", vals(sess.User.Email, sess.User.Role), "linus@example.com user")
	var me store.User
	expect(t, "signed-up session works", c.do("GET", "/api/auth/me", sess.Token, nil, &me), 200)

	expect(t, "duplicate email", c.do("POST", "/api/auth/signup", "", map[string]string{
		"name": "Other", "email": "LINUS@example.com", "password": "another password",
	}, &errBody), 409)
	expect(t, "short password", c.do("POST", "/api/auth/signup", "", map[string]string{
		"name": "Short", "email": "short@example.com", "password": "1234567",
	}, &errBody), 400)
	expect(t, "bad email", c.do("POST", "/api/auth/signup", "", map[string]string{
		"name": "Bad", "email": "not-an-email", "password": "long enough pw",
	}, nil), 400)
	expect(t, "cannot sign up as admin", c.do("POST", "/api/auth/signup", "", map[string]any{
		"name": "Sneaky", "email": "sneaky@example.com", "password": "long enough pw", "role": "admin",
	}, &sess), 201)
	expect(t, "role ignored", sess.User.Role, "user")

	// --- change password ---
	var first session
	c.do("POST", "/api/auth/login", "", map[string]string{"email": "linus@example.com", "password": "first password"}, &first)
	var second session
	c.do("POST", "/api/auth/login", "", map[string]string{"email": "linus@example.com", "password": "first password"}, &second)
	expect(t, "wrong current password", c.do("POST", "/api/auth/password", first.Token, map[string]string{
		"currentPassword": "nope", "newPassword": "second password",
	}, &errBody), 400)
	expect(t, "change password", c.do("POST", "/api/auth/password", first.Token, map[string]string{
		"currentPassword": "first password", "newPassword": "second password",
	}, nil), 204)
	expect(t, "current session survives", c.do("GET", "/api/auth/me", first.Token, nil, nil), 200)
	expect(t, "other sessions end", c.do("GET", "/api/auth/me", second.Token, nil, nil), 401)
	expect(t, "old password rejected", c.do("POST", "/api/auth/login", "", map[string]string{
		"email": "linus@example.com", "password": "first password"}, nil), 401)
	expect(t, "change needs auth", c.do("POST", "/api/auth/password", "", map[string]string{}, nil), 401)

	// --- password reset ---
	var msg struct{ Message string }
	expect(t, "reset unknown email", c.do("POST", "/api/auth/password-reset", "",
		map[string]string{"email": "nobody@example.com"}, &msg), 202)
	expect(t, "no mail for unknown email", mail.last(), "")
	expect(t, "reset known email", c.do("POST", "/api/auth/password-reset", "",
		map[string]string{"email": "LINUS@example.com"}, &msg), 202)
	m := resetTokenRe.FindStringSubmatch(mail.last())
	if m == nil {
		t.Fatalf("reset mail has no link: %q", mail.last())
	}
	if !regexp.MustCompile(`^linus@example.com\n`).MatchString(mail.last()) ||
		!regexp.MustCompile(`https://app\.example/reset-password`).MatchString(mail.last()) {
		t.Fatalf("reset mail addressed or linked wrongly: %q", mail.last())
	}
	expect(t, "bad token", c.do("POST", "/api/auth/password-reset/confirm", "",
		map[string]string{"token": "bogus", "password": "third password"}, &errBody), 400)
	expect(t, "short new password", c.do("POST", "/api/auth/password-reset/confirm", "",
		map[string]string{"token": m[1], "password": "short"}, &errBody), 400)
	expect(t, "reset", c.do("POST", "/api/auth/password-reset/confirm", "",
		map[string]string{"token": m[1], "password": "third password"}, nil), 204)
	expect(t, "reset ends all sessions", c.do("GET", "/api/auth/me", first.Token, nil, nil), 401)
	expect(t, "token is single use", c.do("POST", "/api/auth/password-reset/confirm", "",
		map[string]string{"token": m[1], "password": "fourth password"}, &errBody), 400)
	expect(t, "login with reset password", c.do("POST", "/api/auth/login", "", map[string]string{
		"email": "linus@example.com", "password": "third password"}, nil), 200)
}

func TestAuthRateLimit(t *testing.T) {
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: 3}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	bad := map[string]string{"email": "x@example.com", "password": "wrong password"}
	for i := 0; i < 3; i++ {
		expect(t, "within limit", c.do("POST", "/api/auth/login", "", bad, nil), 401)
	}
	expect(t, "over limit", c.do("POST", "/api/auth/login", "", bad, nil), 429)
	// Limits are per endpoint: sign-up still works.
	expect(t, "other endpoint unaffected", c.do("POST", "/api/auth/signup", "", map[string]string{
		"name": "Rate", "email": "rate@example.com", "password": "long enough pw",
	}, nil), 201)
}
