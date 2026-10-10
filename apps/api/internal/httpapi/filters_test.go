package httpapi_test

import (
	"fmt"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestSavedFilters(t *testing.T) {
	c, admin, ada := newServer(t)
	spec := map[string]any{"search": " tcp ", "tags": []string{"Networking"}, "difficulties": []string{"hard"},
		"status": "wrong", "sort": "random", "seed": "abc123"}

	expect(t, "anonymous", c.do("GET", "/api/me/filters", "", nil, nil), 401)

	var f store.SavedFilter
	expect(t, "save", c.do("POST", "/api/me/filters", ada, map[string]any{"name": " Hard networking ", "filters": spec}, &f), 201)
	expect(t, "saved", vals(f.Name, f.Filters.Search, f.Filters.Tags, f.Filters.Status, f.Filters.Seed),
		"Hard networking tcp [Networking] wrong abc123")

	expect(t, "same name, any case", c.do("POST", "/api/me/filters", ada,
		map[string]any{"name": "hard NETWORKING", "filters": spec}, nil), 409)
	expect(t, "no name", c.do("POST", "/api/me/filters", ada, map[string]any{"name": " ", "filters": spec}, nil), 400)
	expect(t, "bad status", c.do("POST", "/api/me/filters", ada,
		map[string]any{"name": "x", "filters": map[string]any{"status": "nope"}}, nil), 400)
	expect(t, "bad difficulty", c.do("POST", "/api/me/filters", ada,
		map[string]any{"name": "x", "filters": map[string]any{"difficulties": []string{"insane"}}}, nil), 400)

	var minimal store.SavedFilter
	expect(t, "empty filter defaults", c.do("POST", "/api/me/filters", ada,
		map[string]any{"name": "All", "filters": map[string]any{}}, &minimal), 201)
	expect(t, "defaults", vals(minimal.Filters.Sort, len(minimal.Filters.Tags), minimal.Filters.Tags != nil), "oldest 0 true")

	var list []store.SavedFilter
	expect(t, "list", c.do("GET", "/api/me/filters", ada, nil, &list), 200)
	expect(t, "listed by name", vals(len(list), list[0].Name, list[1].Name), "2 All Hard networking")
	expect(t, "others don't see them", c.do("GET", "/api/me/filters", admin, nil, &list), 200)
	expect(t, "admin list empty", len(list), 0)

	// rename only, then change only the filter
	expect(t, "rename", c.do("PATCH", "/api/me/filters/"+f.ID, ada, map[string]any{"name": "Hard nets"}, &f), 200)
	expect(t, "renamed, filter kept", vals(f.Name, f.Filters.Status), "Hard nets wrong")
	expect(t, "change filter", c.do("PATCH", "/api/me/filters/"+f.ID, ada,
		map[string]any{"filters": map[string]any{"tags": []string{"Go"}}}, &f), 200)
	expect(t, "filter replaced, name kept", vals(f.Name, f.Filters.Tags, f.Filters.Status == ""), "Hard nets [Go] true")
	expect(t, "rename into a clash", c.do("PATCH", "/api/me/filters/"+f.ID, ada, map[string]any{"name": "all"}, nil), 409)
	expect(t, "someone else's", c.do("PATCH", "/api/me/filters/"+f.ID, admin, map[string]any{"name": "mine"}, nil), 404)
	expect(t, "delete someone else's", c.do("DELETE", "/api/me/filters/"+f.ID, admin, nil, nil), 404)

	// limit
	for i := len(list) + 2; i < store.MaxSavedFilters; i++ {
		expect(t, "fill", c.do("POST", "/api/me/filters", ada, map[string]any{"name": fmt.Sprint("f", i), "filters": spec}, nil), 201)
	}
	expect(t, "over the limit", c.do("POST", "/api/me/filters", ada, map[string]any{"name": "one too many", "filters": spec}, nil), 409)

	// in the data export, and gone with the filter
	var export struct {
		SavedFilters []map[string]any `json:"savedFilters"`
	}
	expect(t, "export", c.do("GET", "/api/me/export", ada, nil, &export), 200)
	expect(t, "exported", len(export.SavedFilters), store.MaxSavedFilters)
	expect(t, "delete", c.do("DELETE", "/api/me/filters/"+f.ID, ada, nil, nil), 204)
	expect(t, "deleted", c.do("DELETE", "/api/me/filters/"+f.ID, ada, nil, nil), 404)
}
