package httpapi

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"html/template"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

// Search engines and link previews get each public page's title, description
// and content as plain HTML: nginx inserts /api/seo/head and /api/seo/body
// into index.html (server-side includes, see apps/web/nginx.conf), and the
// React app replaces them once it loads. Only what the app shows before
// answering is included, never answers or explanations.

const siteName = "CS Fundamentals Trainer"
const siteDescription = "Practise computer science fundamentals with interview questions, " +
	"spaced repetition, timed tests and system design challenges you draw and get checked."

// privatePaths are about one user's data or signing in: not for search engines.
var privatePaths = []string{"/review", "/progress", "/weak-spots", "/bookmarks", "/build",
	"/my-tests", "/tests/", "/account", "/admin", "/login", "/signup", "/forgot-password",
	"/reset-password", "/confirm-email"}

type seoPage struct {
	Title       string
	Description string
	Canonical   string
	Image       string
	Type        string // og:type
	NoIndex     bool
	JSONLD      template.JS
	Body        template.HTML
}

var headTmpl = template.Must(template.New("head").Parse(`<title>{{.Title}}</title>
<meta name="description" content="{{.Description}}" />
{{if .NoIndex}}<meta name="robots" content="noindex" />
{{else}}<link rel="canonical" href="{{.Canonical}}" />
{{end}}<meta property="og:site_name" content="` + siteName + `" />
<meta property="og:type" content="{{.Type}}" />
<meta property="og:title" content="{{.Title}}" />
<meta property="og:description" content="{{.Description}}" />
<meta property="og:url" content="{{.Canonical}}" />
<meta property="og:image" content="{{.Image}}" />
<meta name="twitter:card" content="summary" />
{{if .JSONLD}}<script type="application/ld+json">{{.JSONLD}}</script>
{{end}}`))

// The plain-HTML content; seo-fallback is styled in index.html.
var bodyTmpls = template.Must(template.New("question").Parse(`<article class="seo-fallback">
<p><a href="/">` + siteName + `</a>{{range .Q.Tags}} · {{.}}{{end}}</p>
<h1>{{.Title}}</h1>
{{range .Prompt}}{{if .Code}}<pre><code>{{.Text}}</code></pre>{{else}}<p>{{.Text}}</p>{{end}}
{{end}}{{if .Q.Code}}<pre><code>{{.Q.Code}}</code></pre>
{{end}}{{if .Q.Options}}<ol type="A">{{range .Q.Options}}<li>{{.Label}}</li>{{end}}</ol>
{{end}}{{if .Q.Difficulty}}<p>Difficulty: {{.Q.Difficulty}}</p>
{{end}}<p><a href="{{.Path}}">Answer this question</a></p>
{{if .Related}}<h2>Related questions</h2>
<ul>{{range .Related}}<li><a href="/questions/{{.ID}}">{{.Prompt}}</a></li>{{end}}</ul>
{{end}}</article>`))

var _ = template.Must(bodyTmpls.New("design").Parse(`<article class="seo-fallback">
<p><a href="/">` + siteName + `</a> · <a href="/design">System design challenges</a></p>
<h1>{{.Q.Prompt}}</h1>
{{if .Q.Difficulty}}<p>Difficulty: {{.Q.Difficulty}}</p>
{{end}}<h2>Requirements</h2>
<ul>{{range .Q.Design.Requirements}}<li>{{.Text}}</li>{{end}}</ul>
<p>Draw the architecture from components such as load balancers, caches, queues and databases, then check it against the requirements.</p>
<p><a href="{{.Path}}">Open the drawing board</a></p>
</article>`))

var _ = template.Must(bodyTmpls.New("list").Parse(`<main class="seo-fallback">
<h1>{{.Heading}}</h1>
<p>{{.Intro}}</p>
{{if .Design}}<h2>System design challenges</h2>
<ul>{{range .Design}}<li><a href="/design/{{.ID}}">{{.Prompt}}</a></li>{{end}}</ul>
{{end}}{{if .Questions}}<h2>Questions</h2>
<ul>{{range .Questions}}<li><a href="/questions/{{.ID}}">{{.Prompt}}</a></li>{{end}}</ul>
{{end}}{{if .Materials}}<ul>{{range .Materials}}<li><a href="{{.URL}}" rel="noopener">{{.Title}}</a>{{if .Author}} ({{.Author}}){{end}}{{if .Description}}: {{.Description}}{{end}}</li>{{end}}</ul>
{{end}}<p><a href="/">Questions</a> · <a href="/design">System design</a> · <a href="/materials">Reading list</a></p>
</main>`))

type promptPart struct {
	Text string
	Code bool
}

// promptParts splits a prompt into prose and ``` fenced code blocks.
func promptParts(p string) []promptPart {
	var out []promptPart
	for i, chunk := range strings.Split(p, "```") {
		chunk = strings.Trim(chunk, "\n")
		if i%2 == 1 {
			// drop the fence's language tag ("```go")
			if nl := strings.IndexByte(chunk, '\n'); nl >= 0 && !strings.ContainsAny(chunk[:nl], " \t") {
				chunk = chunk[nl+1:]
			}
			out = append(out, promptPart{Text: chunk, Code: true})
		} else if strings.TrimSpace(chunk) != "" {
			out = append(out, promptPart{Text: strings.TrimSpace(chunk)})
		}
	}
	return out
}

// plain turns a prompt into one line of text: code blocks and backticks out.
func plain(p string) string {
	var parts []string
	for _, part := range promptParts(p) {
		if !part.Code {
			parts = append(parts, part.Text)
		}
	}
	s := strings.Join(strings.Fields(strings.ReplaceAll(strings.Join(parts, " "), "`", "")), " ")
	if s == "" {
		s = strings.Join(strings.Fields(strings.ReplaceAll(p, "`", "")), " ")
	}
	return s
}

func clip(s string, max int) string {
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	r := []rune(s)[:max-1]
	if i := strings.LastIndexByte(string(r), ' '); i > max/2 {
		return string(r)[:i] + "…"
	}
	return string(r) + "…"
}

// seoPath is the page path from ?path= (the browser's request URI).
func seoPath(r *http.Request) string {
	p := r.URL.Query().Get("path")
	if i := strings.IndexAny(p, "?#"); i >= 0 {
		p = p[:i]
	}
	if u, err := url.PathUnescape(p); err == nil {
		p = u
	}
	if p == "" || p[0] != '/' {
		p = "/"
	}
	if len(p) > 1 {
		p = strings.TrimRight(p, "/")
	}
	return p
}

func (s *Server) seoHead(w http.ResponseWriter, r *http.Request) {
	path := seoPath(r)
	s.cachedPage(w, r, "seo-head|"+path, "text/html; charset=utf-8", func() ([]byte, error) {
		p, err := s.seoPageFor(r, path)
		if err != nil {
			return nil, err
		}
		var b bytes.Buffer
		err = headTmpl.Execute(&b, p)
		return b.Bytes(), err
	})
}

func (s *Server) seoBody(w http.ResponseWriter, r *http.Request) {
	path := seoPath(r)
	s.cachedPage(w, r, "seo-body|"+path, "text/html; charset=utf-8", func() ([]byte, error) {
		p, err := s.seoPageFor(r, path)
		if err != nil {
			return nil, err
		}
		return []byte(p.Body), nil
	})
}

// seoPageFor builds the page's metadata and content. Unknown and private
// pages get the site defaults (and noindex).
func (s *Server) seoPageFor(r *http.Request, path string) (seoPage, error) {
	ctx := r.Context()
	page := seoPage{
		Title: siteName, Description: siteDescription, Canonical: s.opts.BaseURL + path,
		Image: s.opts.BaseURL + "/icons/icon-512.png", Type: "website",
	}
	for _, private := range privatePaths {
		if path == strings.TrimSuffix(private, "/") || strings.HasPrefix(path, private) {
			page.NoIndex = true
			return page, nil
		}
	}
	render := func(name string, data any) error {
		var b bytes.Buffer
		if err := bodyTmpls.ExecuteTemplate(&b, name, data); err != nil {
			return err
		}
		page.Body = template.HTML(b.String())
		return nil
	}

	switch {
	case path == "/" || path == "/design":
		entries, err := s.store.PublicPages(ctx)
		if err != nil {
			return page, err
		}
		var questions, design []map[string]string
		for _, e := range entries {
			item := map[string]string{"ID": e.ID, "Prompt": clip(plain(e.Prompt), 110)}
			if e.Type == "design" {
				design = append(design, item)
			} else {
				questions = append(questions, item)
			}
		}
		// The home page's plain HTML comes before the app loads, so keep it
		// light: the newest questions (the sitemap lists them all).
		const homeQuestions = 60
		if len(questions) > homeQuestions {
			questions = questions[len(questions)-homeQuestions:]
		}
		data := map[string]any{"Heading": siteName, "Intro": siteDescription, "Design": design, "Questions": questions}
		if path == "/design" {
			page.Title = "System design challenges · " + siteName
			page.Description = "Draw the architecture of real systems (URL shortener, chat, news feed, video streaming…) " +
				"from load balancers, caches, queues and databases, and get it checked against the requirements."
			data = map[string]any{"Heading": "System design challenges", "Intro": page.Description, "Design": design}
		}
		return page, render("list", data)

	case path == "/materials":
		mats, err := s.store.Materials(ctx, "", nil)
		if err != nil {
			return page, err
		}
		page.Title = "Reading list · " + siteName
		page.Description = "Hand-picked books, articles and videos on networking, operating systems, " +
			"databases, distributed systems and system design."
		return page, render("list", map[string]any{"Heading": "Reading list", "Intro": page.Description, "Materials": mats})

	case strings.HasPrefix(path, "/questions/"), strings.HasPrefix(path, "/design/"):
		id := path[strings.LastIndexByte(path, '/')+1:]
		if !store.IsUUID(id) {
			page.NoIndex = true
			return page, nil
		}
		q, err := s.store.GetQuestion(ctx, id, "en")
		if err != nil {
			// gone or never existed: keep it out of the index
			page.NoIndex = true
			return page, nil
		}
		// one canonical URL per question: design challenges live under /design
		canonicalPath := "/questions/" + q.ID
		if q.Type == "design" {
			canonicalPath = "/design/" + q.ID
		}
		page.Canonical = s.opts.BaseURL + canonicalPath
		page.Type = "article"
		text := plain(q.Prompt)
		page.Title = clip(text, 60) + " · " + siteName
		topic := strings.Join(q.Tags, ", ")
		if q.Type == "design" {
			page.Description = clip("System design challenge: "+text, 155)
		} else {
			page.Description = clip("Practice question on "+topic+": "+text, 155)
		}
		ld, _ := json.Marshal(map[string]any{
			"@context": "https://schema.org", "@type": "LearningResource",
			"name": clip(text, 110), "description": page.Description, "url": page.Canonical,
			"keywords": topic, "learningResourceType": "practice question", "inLanguage": "en",
			"isPartOf": map[string]string{"@type": "WebSite", "name": siteName, "url": s.opts.BaseURL + "/"},
		})
		page.JSONLD = template.JS(ld)

		if q.Type == "design" {
			return page, render("design", map[string]any{"Q": q, "Path": canonicalPath})
		}
		var related []map[string]string
		if len(q.Tags) > 0 {
			list, err := s.store.ListQuestions(ctx, store.QuestionFilter{
				Page: 1, PageSize: 6, Tags: q.Tags[:1], Locale: "en"})
			if err == nil {
				for _, o := range list.Items {
					if o.ID != q.ID && len(related) < 5 {
						related = append(related, map[string]string{"ID": o.ID, "Prompt": clip(plain(o.Prompt), 110)})
					}
				}
			}
		}
		if q.Type == "ordering" {
			// stored in the right order, which is the answer: list them A–Z
			q.Options = slices.Clone(q.Options)
			slices.SortFunc(q.Options, func(a, b store.Option) int { return strings.Compare(a.Label, b.Label) })
		}
		title := clip(text, 140)
		// a one-line prompt is the heading already; don't repeat it below
		var parts []promptPart
		for _, part := range promptParts(q.Prompt) {
			if part.Code || part.Text != title {
				parts = append(parts, part)
			}
		}
		return page, render("question", map[string]any{
			"Q": q, "Title": title, "Prompt": parts, "Path": canonicalPath, "Related": related})
	}

	// any other path: a client-side route that's not a public page
	page.NoIndex = true
	return page, nil
}

type sitemapURL struct {
	Loc     string `xml:"loc"`
	LastMod string `xml:"lastmod,omitempty"`
}

func (s *Server) sitemap(w http.ResponseWriter, r *http.Request) {
	s.cachedPage(w, r, "seo-sitemap", "application/xml; charset=utf-8", func() ([]byte, error) {
		entries, err := s.store.PublicPages(r.Context())
		if err != nil {
			return nil, err
		}
		urls := []sitemapURL{{Loc: s.opts.BaseURL + "/"}, {Loc: s.opts.BaseURL + "/design"},
			{Loc: s.opts.BaseURL + "/materials"}}
		for _, e := range entries {
			section := "/questions/"
			if e.Type == "design" {
				section = "/design/"
			}
			urls = append(urls, sitemapURL{Loc: s.opts.BaseURL + section + e.ID,
				LastMod: e.Modified.UTC().Format(time.DateOnly)})
		}
		out, err := xml.MarshalIndent(struct {
			XMLName xml.Name     `xml:"urlset"`
			NS      string       `xml:"xmlns,attr"`
			URLs    []sitemapURL `xml:"url"`
		}{NS: "http://www.sitemaps.org/schemas/sitemap/0.9", URLs: urls}, "", "  ")
		return append([]byte(xml.Header), out...), err
	})
}

func (s *Server) robots(w http.ResponseWriter, r *http.Request) {
	var b strings.Builder
	b.WriteString("User-agent: *\n")
	for _, p := range privatePaths {
		b.WriteString("Disallow: " + p + "\n")
	}
	b.WriteString("Disallow: /api/\n\nSitemap: " + s.opts.BaseURL + "/sitemap.xml\n")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte(b.String()))
}
