package httpapi_test

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestPrivacy(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv, ua: macChrome}
	var errBody struct{ Message string }

	// --- sign-up requires accepting the privacy policy, and records it ---
	expect(t, "signup without consent", c.do("POST", "/api/auth/signup", "", map[string]any{
		"name": "Eve", "email": "eve@example.com", "password": "long enough pw"}, &errBody), 400)
	var sess struct {
		Token string
		User  store.User
	}
	expect(t, "signup", c.do("POST", "/api/auth/signup", "", map[string]any{
		"name": "Eve", "email": "eve@example.com", "password": "long enough pw", "acceptPrivacy": true}, &sess), 201)
	expect(t, "policy accepted", *sess.User.PrivacyVersion, store.PrivacyPolicyVersion)
	tok := sess.Token

	// an account created by an admin hasn't accepted yet, and can do so later
	if _, err := st.CreateUser(ctx, "Root", "root@example.com", "correct horse battery", "admin", "en"); err != nil {
		t.Fatal(err)
	}
	var login struct {
		Token string
		User  store.User
	}
	c.do("POST", "/api/auth/login", "", map[string]string{"email": "root@example.com", "password": "correct horse battery"}, &login)
	expect(t, "admin-created user not accepted", login.User.PrivacyVersion == nil, true)
	expect(t, "old version refused", c.do("POST", "/api/me/privacy", login.Token, map[string]string{"version": "2020-01-01"}, nil), 400)
	expect(t, "accept current", c.do("POST", "/api/me/privacy", login.Token, map[string]string{"version": store.PrivacyPolicyVersion}, nil), 204)
	var me store.User
	c.do("GET", "/api/auth/me", login.Token, nil, &me)
	expect(t, "me shows version", *me.PrivacyVersion, store.PrivacyPolicyVersion)

	// --- consent log: identical choices aren't logged twice; withdrawal erases device details ---
	for _, consent := range []map[string]any{
		{"preferences": true, "deviceDetails": true},
		{"preferences": true, "deviceDetails": true},
	} {
		expect(t, "consent", c.do("POST", "/api/me/consent", tok, consent, nil), 204)
	}
	// the same choice sent concurrently is still logged once (the browser sends
	// it from every tab, and twice per load in React's development mode)
	for round, prefs := range []bool{false, true, false, true, false} {
		var wg sync.WaitGroup
		for range 30 {
			wg.Add(1)
			go func() {
				defer wg.Done()
				c.do("POST", "/api/me/consent", tok, map[string]any{"preferences": prefs, "deviceDetails": true}, nil)
			}()
		}
		wg.Wait()
		var export struct{ Consents []json.RawMessage }
		c.do("GET", "/api/me/export", tok, nil, &export)
		expect(t, fmt.Sprintf("round %d logged once", round), len(export.Consents), 2+round)
	}
	expect(t, "device info", c.do("POST", "/api/me/device", tok, map[string]any{"timezone": "Europe/Lisbon"}, nil), 204)
	expect(t, "withdraw", c.do("POST", "/api/me/consent", tok, map[string]any{"preferences": true, "deviceDetails": false}, nil), 204)
	var sessions []store.Session
	c.do("GET", "/api/me/sessions", tok, nil, &sessions)
	expect(t, "device details erased", len(sessions[0].ClientInfo), 0)
	expect(t, "no device info now", c.do("POST", "/api/me/device", tok, map[string]any{"timezone": "Europe/Lisbon"}, nil), 409)

	var detail store.AdminUserDetail
	expect(t, "admin sees consent", c.do("GET", "/api/admin/users/"+sess.User.ID, login.Token, nil, &detail), 200)
	expect(t, "latest consent", vals(detail.Consent.Preferences, detail.Consent.DeviceDetails, detail.Consent.PolicyVersion),
		"true false "+store.PrivacyPolicyVersion)
	expect(t, "accepted at", detail.PrivacyAcceptedAt != nil, true)

	// --- data export ---
	req, _ := http.NewRequest("GET", srv.URL+"/api/me/export", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	expect(t, "export status", res.StatusCode, 200)
	expect(t, "export is a download", strings.HasPrefix(res.Header.Get("Content-Disposition"), "attachment;"), true)
	raw, _ := io.ReadAll(res.Body)
	var export struct {
		Profile struct {
			Email          string `json:"email"`
			PrivacyVersion string `json:"privacyVersion"`
		} `json:"profile"`
		Sessions      []json.RawMessage `json:"sessions"`
		SignInHistory []struct {
			Kind string `json:"kind"`
		} `json:"signInHistory"`
		Consents []json.RawMessage `json:"consents"`
		Answers  []json.RawMessage `json:"answers"`
	}
	if err := json.Unmarshal(raw, &export); err != nil {
		t.Fatalf("export JSON: %v", err)
	}
	expect(t, "export profile", vals(export.Profile.Email, export.Profile.PrivacyVersion), "eve@example.com "+store.PrivacyPolicyVersion)
	expect(t, "export counts", vals(len(export.Sessions), len(export.SignInHistory), len(export.Consents), len(export.Answers)), "1 1 7 0")
	expect(t, "no secrets", strings.Contains(string(raw), "password_hash") || strings.Contains(string(raw), "token_hash"), false)

	// --- account deletion ---
	expect(t, "wrong password", c.do("DELETE", "/api/me", tok, map[string]string{"password": "nope"}, &errBody), 400)
	expect(t, "last admin can't leave", c.do("DELETE", "/api/me", login.Token, map[string]string{"password": "correct horse battery"}, &errBody), 409)
	expect(t, "delete", c.do("DELETE", "/api/me", tok, map[string]string{"password": "long enough pw"}, nil), 204)
	expect(t, "session gone", c.do("GET", "/api/auth/me", tok, nil, nil), 401)
	expect(t, "can't log in", c.do("POST", "/api/auth/login", "", map[string]string{"email": "eve@example.com", "password": "long enough pw"}, nil), 401)
	expect(t, "admin: user gone", c.do("GET", "/api/admin/users/"+sess.User.ID, login.Token, nil, nil), 404)
}
