package httpapi_test

import (
	"context"
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestUserManagement(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	ids := map[string]string{}
	for _, u := range []struct{ email, role string }{{"root@example.com", "admin"}, {"ada@example.com", "user"}} {
		created, err := st.CreateUser(ctx, "Someone", u.email, "correct horse battery", u.role, "en")
		if err != nil {
			t.Fatal(err)
		}
		ids[u.email] = created.ID
	}
	login := func(email string) (string, int) {
		var body struct{ Token string }
		code := c.do("POST", "/api/auth/login", "", map[string]string{"email": email, "password": "correct horse battery"}, &body)
		return body.Token, code
	}
	root, _ := login("root@example.com")
	ada, _ := login("ada@example.com")
	adaID, rootID := ids["ada@example.com"], ids["root@example.com"]
	var errBody struct{ Message string }

	expect(t, "members can't", c.do("PATCH", "/api/admin/users/"+rootID, ada, map[string]string{"role": "user"}, nil), 403)
	expect(t, "not yourself", c.do("PATCH", "/api/admin/users/"+rootID, root, map[string]string{"role": "user"}, &errBody), 400)
	expect(t, "bad role", c.do("PATCH", "/api/admin/users/"+adaID, root, map[string]string{"role": "owner"}, &errBody), 400)

	// --- promote, then the former sole admin may be demoted ---
	expect(t, "promote", c.do("PATCH", "/api/admin/users/"+adaID, root, map[string]string{"role": "admin"}, nil), 204)
	var me store.User
	c.do("GET", "/api/auth/me", ada, nil, &me)
	expect(t, "now admin", me.Role, "admin")
	expect(t, "demote root", c.do("PATCH", "/api/admin/users/"+rootID, ada, map[string]string{"role": "user"}, nil), 204)
	expect(t, "last admin can't be blocked", c.do("PATCH", "/api/admin/users/"+adaID, root, map[string]any{"blocked": true}, nil), 403) // root is no admin now
	expect(t, "re-promote", c.do("PATCH", "/api/admin/users/"+rootID, ada, map[string]string{"role": "admin"}, nil), 204)

	// --- block: signed out, can't sign in, unblock restores ---
	expect(t, "block", c.do("PATCH", "/api/admin/users/"+adaID, root, map[string]any{"blocked": true}, nil), 204)
	expect(t, "session ended", c.do("GET", "/api/auth/me", ada, nil, nil), 401)
	_, code := login("ada@example.com")
	expect(t, "blocked login", code, 403)
	var users []store.AdminUser
	c.do("GET", "/api/admin/users", root, nil, &users)
	for _, u := range users {
		if u.ID == adaID {
			expect(t, "shows blocked", u.BlockedAt != nil, true)
		}
	}
	expect(t, "unblock", c.do("PATCH", "/api/admin/users/"+adaID, root, map[string]any{"blocked": false}, nil), 204)
	ada, code = login("ada@example.com")
	expect(t, "login again", code, 200)

	// --- the last admin is protected ---
	expect(t, "demote ada", c.do("PATCH", "/api/admin/users/"+adaID, root, map[string]string{"role": "user"}, nil), 204)
	// root is the only admin now; ada (a member) can't act, and root can't remove itself
	expect(t, "delete self refused", c.do("DELETE", "/api/admin/users/"+rootID, root, nil, &errBody), 400)

	// --- delete ---
	expect(t, "delete ada", c.do("DELETE", "/api/admin/users/"+adaID, root, nil, nil), 204)
	expect(t, "gone", c.do("GET", "/api/admin/users/"+adaID, root, nil, nil), 404)
	expect(t, "session gone", c.do("GET", "/api/auth/me", ada, nil, nil), 401)
	expect(t, "unknown user", c.do("DELETE", "/api/admin/users/"+adaID, root, nil, nil), 404)
}

// The sole-admin rule, checked straight against the store.
func TestLastAdminProtected(t *testing.T) {
	ctx := context.Background()
	st := store.New(newTestDB(t))
	a, _ := st.CreateUser(ctx, "A", "a@example.com", "correct horse battery", "admin", "en")
	b, _ := st.CreateUser(ctx, "B", "b@example.com", "correct horse battery", "admin", "en")
	user := "user"
	if err := st.ChangeUser(ctx, a.ID, b.ID, store.UserChange{Role: &user}); err != nil {
		t.Fatal(err)
	}
	blocked := true
	// b is a member now and can't demote a; but a store-level call from b
	// (as if the handler check were bypassed) must still keep one admin.
	if err := st.ChangeUser(ctx, b.ID, a.ID, store.UserChange{Blocked: &blocked}); err == nil {
		t.Fatal("blocking the last admin should fail")
	}
	if err := st.AdminDeleteUser(ctx, b.ID, a.ID); err == nil {
		t.Fatal("deleting the last admin should fail")
	}
}
