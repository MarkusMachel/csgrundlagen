package httpapi_test

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

const (
	macChrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
	iPhone    = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
)

func TestDevices(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	for _, u := range []struct{ email, role string }{{"ada@example.com", "user"}, {"root@example.com", "admin"}} {
		if _, err := st.CreateUser(ctx, "Someone", u.email, "correct horse battery", u.role, "en"); err != nil {
			t.Fatal(err)
		}
	}
	login := func(c client, email, password string) (string, int) {
		var body struct{ Token string }
		code := c.do("POST", "/api/auth/login", "", map[string]string{"email": email, "password": password}, &body)
		return body.Token, code
	}
	laptop := client{t: t, srv: srv, ua: macChrome}
	phone := client{t: t, srv: srv, ua: iPhone}

	_, code := login(phone, "ada@example.com", "wrong password")
	expect(t, "failed login", code, 401)
	laptopTok, _ := login(laptop, "ada@example.com", "correct horse battery")
	phoneTok, _ := login(phone, "ada@example.com", "correct horse battery")
	adminTok, _ := login(laptop, "root@example.com", "correct horse battery")

	// --- the browser's self-report lands on the right session ---
	expect(t, "device info", laptop.do("POST", "/api/me/device", laptopTok, map[string]any{
		"timezone": "Europe/Berlin", "language": "de-DE", "screen": "2560x1440", "pixelRatio": 2,
		"languages": []string{"de-DE", "en", "a", "b", "c", "d", "e", "f", "g", "h"},
	}, nil), 204)
	expect(t, "device needs login", laptop.do("POST", "/api/me/device", "", map[string]any{}, nil), 401)

	var mine []store.Session
	expect(t, "my sessions", laptop.do("GET", "/api/me/sessions", laptopTok, nil, &mine), 200)
	expect(t, "two devices", len(mine), 2)
	byDevice := map[string]store.Session{}
	for _, se := range mine {
		byDevice[se.Device] = se
	}
	desk, mob := byDevice["desktop"], byDevice["mobile"]
	expect(t, "desktop parsed", vals(desk.Browser, desk.OS, desk.Current), "Chrome 129 macOS 10.15 true")
	expect(t, "mobile parsed", vals(mob.Browser, mob.OS, mob.Current), "Safari 18.0 iOS 18.0 false")
	expect(t, "ip recorded", desk.IP != nil && *desk.IP == "127.0.0.1", true)
	var info store.ClientInfo
	_ = json.Unmarshal(desk.ClientInfo, &info)
	expect(t, "client info", vals(info.Timezone, info.Screen, info.PixelRatio, len(info.Languages)),
		"Europe/Berlin 2560x1440 2 8")
	expect(t, "no info from phone", len(mob.ClientInfo), 0)

	// --- admin view ---
	expect(t, "users need admin", laptop.do("GET", "/api/admin/users", laptopTok, nil, nil), 403)
	var users []store.AdminUser
	expect(t, "admin users", laptop.do("GET", "/api/admin/users", adminTok, nil, &users), 200)
	expect(t, "two users", len(users), 2)
	var ada store.AdminUser
	for _, u := range users {
		if u.Email == "ada@example.com" {
			ada = u
		}
	}
	expect(t, "ada summary", vals(ada.ActiveSessions, ada.Devices, ada.FailedLogins24h), "2 [desktop mobile] 1")

	var detail store.AdminUserDetail
	expect(t, "admin detail", laptop.do("GET", "/api/admin/users/"+ada.ID, adminTok, nil, &detail), 200)
	expect(t, "detail sessions", len(detail.Sessions), 2)
	kinds := []string{}
	for _, e := range detail.Events {
		kinds = append(kinds, e.Kind)
	}
	expect(t, "history, newest first", vals(kinds), "[login login login_failed]")
	expect(t, "unknown user", laptop.do("GET", "/api/admin/users/00000000-0000-0000-0000-000000000000", adminTok, nil, nil), 404)

	// --- revoking ---
	expect(t, "cannot revoke someone else's", phone.do("DELETE", "/api/me/sessions/"+mine[0].ID, adminTok, nil, nil), 404)
	expect(t, "revoke phone", laptop.do("DELETE", "/api/me/sessions/"+mob.ID, laptopTok, nil, nil), 204)
	expect(t, "phone signed out", phone.do("GET", "/api/auth/me", phoneTok, nil, nil), 401)
	expect(t, "laptop still in", laptop.do("GET", "/api/auth/me", laptopTok, nil, nil), 200)

	phoneTok, _ = login(phone, "ada@example.com", "correct horse battery")
	var revoked struct{ Revoked int }
	expect(t, "admin signs ada out", laptop.do("DELETE", "/api/admin/users/"+ada.ID+"/sessions", adminTok, nil, &revoked), 200)
	expect(t, "both revoked", revoked.Revoked, 2)
	expect(t, "laptop out", laptop.do("GET", "/api/auth/me", laptopTok, nil, nil), 401)
	expect(t, "phone out", phone.do("GET", "/api/auth/me", phoneTok, nil, nil), 401)

	// --- retention ---
	if err := st.PurgeExpired(ctx); err != nil {
		t.Fatal(err)
	}
	expect(t, "recent history kept", laptop.do("GET", "/api/admin/users/"+ada.ID, adminTok, nil, &detail), 200)
	expect(t, "events kept", len(detail.Events), 4)
}
