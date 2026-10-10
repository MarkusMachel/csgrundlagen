package httpapi_test

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/httpapi"
	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestRunGo(t *testing.T) {
	// A fake Go Playground: checks the form and answers like /compile does.
	var gotBody string
	playground := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		gotBody = r.Form.Get("body")
		if r.Form.Get("version") != "2" {
			http.Error(w, "bad version", 400)
			return
		}
		if gotBody == "broken" {
			_ = json.NewEncoder(w).Encode(map[string]any{"Errors": "prog.go:1:1: expected 'package'"})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"Status": 0,
			"Events": []map[string]any{{"Message": "hello\n", "Kind": "stdout"}, {"Message": "warn\n", "Kind": "stderr"}},
		})
	}))
	defer playground.Close()

	st := store.New(newTestDB(t))
	if _, err := st.CreateUser(context.Background(), "Ada", "ada@example.com", "correct horse battery", "user", "en"); err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1, GoPlaygroundURL: playground.URL}))
	defer srv.Close()
	c := client{t: t, srv: srv}
	ada := login(t, c, "ada@example.com")

	var res httpapi.RunResult
	expect(t, "run go", c.do("POST", "/api/run", ada, map[string]string{"language": "go", "code": "package main"}, &res), 200)
	expect(t, "output interleaved", res.Output, "hello\nwarn\n")
	expect(t, "code forwarded", gotBody, "package main")
	expect(t, "compile error", c.do("POST", "/api/run", ada, map[string]string{"language": "go", "code": "broken"}, &res), 200)
	expect(t, "errors reported", res.Errors, "prog.go:1:1: expected 'package'")
	expect(t, "js is not run on the server", c.do("POST", "/api/run", ada, map[string]string{"language": "js", "code": "1"}, nil), 400)
	expect(t, "empty code", c.do("POST", "/api/run", ada, map[string]string{"language": "go", "code": " "}, nil), 400)
	expect(t, "needs login", c.do("POST", "/api/run", "", map[string]string{"language": "go", "code": "x"}, nil), 401)

	off := httptest.NewServer(httpapi.New(st, slog.New(slog.NewTextHandler(io.Discard, nil)),
		httpapi.Options{AuthRatePerMinute: -1, GoPlaygroundURL: "off"}))
	defer off.Close()
	expect(t, "disabled", client{t: t, srv: off}.do("POST", "/api/run", ada,
		map[string]string{"language": "go", "code": "package main"}, nil), 503)
}
