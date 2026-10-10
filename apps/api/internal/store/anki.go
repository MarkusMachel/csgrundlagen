package store

import (
	"context"
	"html"
	"regexp"
	"strconv"
	"strings"
)

// AnkiDeckName is the deck exported notes land in.
const AnkiDeckName = "CS Trainer"

// AnkiExport renders questions in Anki's "Notes in Plain Text" format:
// tab-separated front, back, tags and a GUID (the question id), so importing
// a newer export updates the notes instead of duplicating them.
// Fields are HTML; line breaks become <br> because a field can't contain a
// raw newline or tab.
func AnkiExport(questions []Question) string {
	var b strings.Builder
	b.WriteString("#separator:tab\n#html:true\n#notetype:Basic\n#deck:" + AnkiDeckName + "\n#tags column:3\n#guid column:4\n")
	for _, q := range questions {
		b.WriteString(ankiFront(q))
		b.WriteByte('\t')
		b.WriteString(ankiBack(q))
		b.WriteByte('\t')
		b.WriteString(ankiTags(q))
		b.WriteByte('\t')
		b.WriteString("cs-trainer-" + q.ID)
		b.WriteByte('\n')
	}
	return b.String()
}

func ankiFront(q Question) string {
	front := richHTML(q.Prompt)
	switch q.Type {
	case "multiple-choice", "multi-select":
		front += `<ol type="A">`
		for _, o := range q.Options {
			front += "<li>" + richHTML(o.Label) + "</li>"
		}
		front += "</ol>"
		if q.Type == "multi-select" {
			front += "<i>(pick all that apply)</i>"
		}
	case "true-false":
		front += "<br><i>(true or false?)</i>"
	case "ordering":
		front += "<br><i>Put in order:</i><ul>"
		for _, o := range q.Options {
			front += "<li>" + richHTML(o.Label) + "</li>"
		}
		front += "</ul>"
	case "output":
		if q.Code != nil {
			front += codeHTML(*q.Code, deref(q.CodeLanguage)) + "<i>What does it print?</i>"
		}
	}
	return front
}

func ankiBack(q Question) string {
	label := func(id string) string {
		for _, o := range q.Options {
			if o.ID == id {
				return "<b>" + id + ".</b> " + richHTML(o.Label)
			}
		}
		return id
	}
	var answer string
	switch q.Type {
	case "multiple-choice":
		if q.CorrectOptionID != nil {
			answer = label(*q.CorrectOptionID)
		}
	case "multi-select":
		parts := []string{}
		for _, id := range q.CorrectOptionIDs {
			parts = append(parts, label(id))
		}
		answer = strings.Join(parts, "<br>")
	case "true-false":
		if q.CorrectAnswer != nil && *q.CorrectAnswer {
			answer = "<b>True</b>"
		} else {
			answer = "<b>False</b>"
		}
	case "ordering":
		answer = "<ol>"
		for _, id := range q.CorrectOrder {
			for _, o := range q.Options {
				if o.ID == id {
					answer += "<li>" + richHTML(o.Label) + "</li>"
				}
			}
		}
		answer += "</ol>"
	case "output":
		answer = codeHTML(deref(q.ExpectedOutput), "")
	case "flashcard":
		return richHTML(q.Explanation)
	}
	return answer + "<hr>" + richHTML(q.Explanation)
}

// ankiTags turns topics into Anki tags (no spaces allowed), under "cs::" so
// they group together in Anki's browser.
func ankiTags(q Question) string {
	tags := []string{}
	for _, t := range q.Tags {
		tags = append(tags, "cs::"+strings.Join(strings.Fields(t), "_"))
	}
	if q.Difficulty != nil {
		tags = append(tags, "cs::difficulty::"+*q.Difficulty)
	}
	return strings.Join(tags, " ")
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

var (
	fenceRe  = regexp.MustCompile("(?s)```([A-Za-z0-9#+_-]*)[ \\t]*\\n(.*?)\\n?```")
	inlineRe = regexp.MustCompile("`([^`\\n]+)`")
)

// richHTML converts the app's rich text (```lang fences and `inline code`)
// to single-line HTML.
func richHTML(s string) string {
	var out strings.Builder
	last := 0
	for _, m := range fenceRe.FindAllStringSubmatchIndex(s, -1) {
		out.WriteString(proseHTML(s[last:m[0]]))
		out.WriteString(codeHTML(s[m[4]:m[5]], s[m[2]:m[3]]))
		last = m[1]
	}
	out.WriteString(proseHTML(s[last:]))
	return out.String()
}

func proseHTML(s string) string {
	s = html.EscapeString(strings.Trim(s, "\n"))
	s = inlineRe.ReplaceAllString(s, "<code>$1</code>")
	return strings.NewReplacer("\r", "", "\n", "<br>", "\t", "    ").Replace(s)
}

func codeHTML(code, lang string) string {
	body := strings.NewReplacer("\r", "", "\n", "<br>", "\t", "    ").Replace(html.EscapeString(code))
	class := ""
	if lang != "" {
		class = ` class="language-` + html.EscapeString(lang) + `"`
	}
	return "<pre><code" + class + ">" + body + "</code></pre>"
}

// FlashcardInput is one card to import.
type FlashcardInput struct {
	Front string   `json:"front"`
	Back  string   `json:"back"`
	Tags  []string `json:"tags"`
}

// ImportResult says how an import went.
type ImportResult struct {
	Created int `json:"created"`
	// Skipped counts cards whose front matches an existing flashcard, so
	// importing the same deck twice doesn't duplicate it.
	Skipped int      `json:"skipped"`
	Errors  []string `json:"errors"`
}

// MaxImportCards bounds one import request.
const MaxImportCards = 2000

// ImportFlashcards creates flashcard questions, tagged with each card's own
// tags or defaultTags when a card has none.
func (s *Store) ImportFlashcards(ctx context.Context, adminID string, cards []FlashcardInput, defaultTags []string) (ImportResult, error) {
	res := ImportResult{Errors: []string{}}
	if len(cards) > MaxImportCards {
		return res, ErrInvalid{"at most 2000 cards per import"}
	}
	for i, c := range cards {
		front, back := strings.TrimSpace(c.Front), strings.TrimSpace(c.Back)
		if front == "" || back == "" {
			res.Errors = append(res.Errors, "card "+strconv.Itoa(i+1)+": front and back are required")
			continue
		}
		var exists bool
		if err := s.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM questions WHERE type = 'flashcard' AND prompt = $1)`, front).Scan(&exists); err != nil {
			return res, err
		}
		if exists {
			res.Skipped++
			continue
		}
		tags := c.Tags
		if len(tags) == 0 {
			tags = defaultTags
		}
		if len(tags) == 0 {
			tags = []string{"Imported"}
		}
		if _, err := s.CreateQuestion(ctx, adminID, NewQuestion{Type: "flashcard", Prompt: front, Explanation: back, Tags: tags}); err != nil {
			res.Errors = append(res.Errors, "card "+strconv.Itoa(i+1)+": "+err.Error())
			continue
		}
		res.Created++
	}
	return res, nil
}
