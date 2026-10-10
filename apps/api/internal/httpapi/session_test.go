package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// browser behaves like the web app: no Authorization header, cookies only.
type browser struct {
	t   *testing.T
	srv *httptest.Server
	hc  *http.Client
}

func newBrowser(t *testing.T, srv *httptest.Server) browser {
	jar, _ := cookiejar.New(nil)
	return browser{t: t, srv: srv, hc: &http.Client{Jar: jar}}
}

func (b browser) do(method, path, body string, headers map[string]string) (*http.Response, string) {
	b.t.Helper()
	req, _ := http.NewRequest(method, b.srv.URL+path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := b.hc.Do(req)
	if err != nil {
		b.t.Fatal(err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	return res, string(raw)
}

func TestCookieSessions(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	if _, err := st.CreateUser(ctx, "Ada", "ada@example.com", "correct horse battery", "user", "en"); err != nil {
		t.Fatal(err)
	}
	b := newBrowser(t, srv)

	res, body := b.do("POST", "/api/auth/login", `{"email":"ada@example.com","password":"correct horse battery"}`, nil)
	expect(t, "login", res.StatusCode, 200)
	expect(t, "no token in the body for the web app", strings.Contains(body, `"token"`), false)
	var cookie *http.Cookie
	for _, c := range res.Cookies() {
		if c.Name == httpapi.SessionCookie {
			cookie = c
		}
	}
	expect(t, "cookie set", cookie != nil, true)
	expect(t, "cookie flags", vals(cookie.HttpOnly, cookie.Path, cookie.SameSite == http.SameSiteLaxMode, cookie.MaxAge > 0), "true /api true true")

	res, body = b.do("GET", "/api/auth/me", "", nil)
	expect(t, "me via cookie", vals(res.StatusCode, strings.Contains(body, "ada@example.com")), "200 true")

	// cross-site writes with the cookie are refused; same-origin ones pass
	res, _ = b.do("POST", "/api/me/consent", `{"preferences":true,"deviceDetails":false}`,
		map[string]string{"Origin": "https://evil.example"})
	expect(t, "foreign origin refused", res.StatusCode, 403)
	res, _ = b.do("POST", "/api/me/consent", `{"preferences":true,"deviceDetails":false}`,
		map[string]string{"Sec-Fetch-Site": "cross-site"})
	expect(t, "cross-site fetch refused", res.StatusCode, 403)
	res, _ = b.do("POST", "/api/me/consent", `{"preferences":true,"deviceDetails":false}`,
		map[string]string{"Origin": srv.URL, "Sec-Fetch-Site": "same-origin"})
	expect(t, "same origin allowed", res.StatusCode, 204)

	// logout clears the cookie and ends the session
	res, _ = b.do("POST", "/api/auth/logout", "", map[string]string{"Origin": srv.URL})
	expect(t, "logout", res.StatusCode, 204)
	res, _ = b.do("GET", "/api/auth/me", "", nil)
	expect(t, "signed out", res.StatusCode, 401)

	// a session from before cookies (bearer token) moves into the cookie
	var login struct{ Token string }
	c := client{t: t, srv: srv}
	c.do("POST", "/api/auth/login", "", map[string]string{"email": "ada@example.com", "password": "correct horse battery"}, &login)
	expect(t, "token for API clients", login.Token != "", true)
	res, _ = b.do("POST", "/api/auth/cookie", "", map[string]string{"Authorization": "Bearer " + login.Token})
	expect(t, "migrated", res.StatusCode, 204)
	res, _ = b.do("GET", "/api/auth/me", "", nil)
	expect(t, "cookie now works", res.StatusCode, 200)

	// bearer requests skip the origin check (another site can't set that header)
	res, _ = b.do("POST", "/api/me/consent", `{"preferences":false,"deviceDetails":false}`,
		map[string]string{"Origin": "https://evil.example", "Authorization": "Bearer " + login.Token})
	expect(t, "bearer unaffected", res.StatusCode, 204)
}
