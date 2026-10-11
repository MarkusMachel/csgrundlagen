package httpapi_test

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func fetch(t *testing.T, c client, path string) (string, string) {
	t.Helper()
	res, err := http.Get(c.srv.URL + path)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		t.Fatalf("GET %s: %d %s", path, res.StatusCode, b)
	}
	return string(b), res.Header.Get("Content-Type")
}

func TestSEOPages(t *testing.T) {
	c, admin, _ := newServer(t)
	var mc, order store.Question
	expect(t, "create mc", c.do("POST", "/api/questions", admin, map[string]any{
		"type": "multiple-choice", "prompt": "Which `<script>` tag runs first?\n```html\n<script src=a.js></script>\n```",
		"tags": []string{"JavaScript"}, "difficulty": "easy", "explanation": "SECRET-EXPLANATION",
		"options":         []map[string]string{{"id": "A", "label": "Zebra"}, {"id": "B", "label": "Apple & pear"}},
		"correctOptionId": "B"}, &mc), 201)
	expect(t, "create ordering", c.do("POST", "/api/questions", admin, map[string]any{
		"type": "ordering", "prompt": "Order the TCP handshake", "tags": []string{"JavaScript"},
		"explanation": "SYN first.", "options": []map[string]string{
			{"id": "A", "label": "SYN"}, {"id": "B", "label": "SYN-ACK"}, {"id": "C", "label": "ACK"}}}, &order), 201)

	head, ctype := fetch(t, c, "/api/seo/head?path=/questions/"+mc.ID)
	expect(t, "head is html", strings.HasPrefix(ctype, "text/html"), true)
	for _, want := range []string{
		"<title>Which &lt;script&gt; tag runs first? · CS Fundamentals Trainer</title>",
		`<meta name="description" content="Practice question on JavaScript: Which &lt;script&gt; tag runs first?" />`,
		`<link rel="canonical" href="http://localhost:3000/questions/` + mc.ID + `" />`,
		`<meta property="og:type" content="article" />`,
		`"@type":"LearningResource"`,
	} {
		if !strings.Contains(head, want) {
			t.Errorf("head missing %q in:\n%s", want, head)
		}
	}

	body, _ := fetch(t, c, "/api/seo/body?path=/questions/"+mc.ID+"?utm=x")
	for _, want := range []string{"<h1>Which &lt;script&gt; tag runs first?</h1>",
		"<pre><code>&lt;script src=a.js&gt;&lt;/script&gt;</code></pre>", "<li>Apple &amp; pear</li>", "Difficulty: easy",
		`<a href="/questions/` + order.ID + `">Order the TCP handshake</a>`} {
		if !strings.Contains(body, want) {
			t.Errorf("body missing %q in:\n%s", want, body)
		}
	}
	for _, leak := range []string{"SECRET-EXPLANATION", "<script src", "correct"} {
		if strings.Contains(body+head, leak) {
			t.Errorf("page leaks %q", leak)
		}
	}

	// an ordering question's options are stored in the right order: not shown that way
	body, _ = fetch(t, c, "/api/seo/body?path=/questions/"+order.ID)
	if !strings.Contains(body, "<li>ACK</li><li>SYN</li><li>SYN-ACK</li>") {
		t.Errorf("ordering options not sorted A–Z:\n%s", body)
	}

	// home lists questions; private and unknown pages stay out of the index
	body, _ = fetch(t, c, "/api/seo/body?path=/")
	expect(t, "home links questions", strings.Contains(body, `/questions/`+mc.ID), true)
	for _, p := range []string{"/account", "/tests/123/take", "/questions/not-a-uuid",
		"/questions/00000000-0000-0000-0000-000000000000", "/some/client/route"} {
		head, _ := fetch(t, c, "/api/seo/head?path="+p)
		expect(t, p+" noindex", strings.Contains(head, `content="noindex"`), true)
		expect(t, p+" default title", strings.Contains(head, "<title>CS Fundamentals Trainer</title>"), true)
	}
	head, _ = fetch(t, c, "/api/seo/head?path=/materials")
	expect(t, "materials title", strings.Contains(head, "<title>Reading list · CS Fundamentals Trainer</title>"), true)

	// sitemap and robots
	sm, ctype := fetch(t, c, "/api/seo/sitemap.xml")
	expect(t, "sitemap is xml", strings.HasPrefix(ctype, "application/xml"), true)
	for _, want := range []string{"<loc>http://localhost:3000/</loc>", "<loc>http://localhost:3000/questions/" + mc.ID + "</loc>",
		"<lastmod>"} {
		expect(t, "sitemap has "+want, strings.Contains(sm, want), true)
	}
	robots, _ := fetch(t, c, "/api/seo/robots.txt")
	expect(t, "robots", strings.Contains(robots, "Disallow: /account\n") &&
		strings.Contains(robots, "Sitemap: http://localhost:3000/sitemap.xml"), true)

	// pages follow edits (the response cache is cleared)
	expect(t, "edit", c.do("PUT", "/api/questions/"+order.ID, admin, map[string]any{
		"type": "ordering", "prompt": "Order the TLS handshake", "tags": []string{"JavaScript"},
		"explanation": "ClientHello first.", "options": []map[string]string{
			{"id": "A", "label": "ClientHello"}, {"id": "B", "label": "ServerHello"}}}, nil), 200)
	head, _ = fetch(t, c, "/api/seo/head?path=/questions/"+order.ID)
	expect(t, "title follows the edit", strings.Contains(head, "<title>Order the TLS handshake"), true)
}

func TestSEODesignPages(t *testing.T) {
	c, admin, _ := newServer(t)
	var d store.Question
	expect(t, "create design", c.do("POST", "/api/questions", admin, map[string]any{
		"type": "design", "prompt": "Design a URL shortener", "tags": []string{"System Design"},
		"explanation": "Load balancer, cache, database.", "design": map[string]any{
			"requirements": []map[string]string{{"id": "r", "text": "Redirects are fast"}},
			"rules": []map[string]any{{"id": "c", "requirement": "r", "kind": "edge", "from": []string{"service"},
				"to": []string{"cache"}, "text": "A cache", "explanation": "Fast reads."}},
			"reference": map[string]any{"nodes": []map[string]string{{"id": "s", "kind": "service"}, {"id": "k", "kind": "cache"}},
				"edges": []map[string]string{{"from": "s", "to": "k"}}},
		}}, &d), 201)

	// the same challenge under /questions points at its /design page
	head, _ := fetch(t, c, "/api/seo/head?path=/questions/"+d.ID)
	expect(t, "canonical under /design", strings.Contains(head, `href="http://localhost:3000/design/`+d.ID+`"`), true)
	body, _ := fetch(t, c, "/api/seo/body?path=/design/"+d.ID)
	expect(t, "requirements listed", strings.Contains(body, "<li>Redirects are fast</li>"), true)
	expect(t, "no rules or reference", strings.Contains(body, "A cache") || strings.Contains(body, "Fast reads"), false)
	body, _ = fetch(t, c, "/api/seo/body?path=/design")
	expect(t, "design list links it", strings.Contains(body, `href="/design/`+d.ID+`"`), true)
	sm, _ := fetch(t, c, "/api/seo/sitemap.xml")
	expect(t, "sitemap uses /design", strings.Contains(sm, "/design/"+d.ID+"</loc>"), true)
}
