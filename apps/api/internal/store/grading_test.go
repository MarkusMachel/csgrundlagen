package store

import "testing"

func ptr[T any](v T) *T { return &v }

func TestIsCorrect(t *testing.T) {
	multi := Question{Type: "multi-select", CorrectOptionIDs: []string{"A", "C"}}
	order := Question{Type: "ordering", CorrectOrder: []string{"C", "A", "B"}}
	out := Question{Type: "output", ExpectedOutput: ptr("A\nB\npromise\ntimeout")}
	cases := []struct {
		name  string
		q     Question
		given any
		want  bool
	}{
		{"mc right", Question{Type: "multiple-choice", CorrectOptionID: ptr("B")}, "B", true},
		{"mc wrong type", Question{Type: "multiple-choice", CorrectOptionID: ptr("B")}, true, false},
		{"tf", Question{Type: "true-false", CorrectAnswer: ptr(false)}, false, true},
		{"multi any order", multi, []any{"C", "A"}, true},
		{"multi missing one", multi, []any{"A"}, false},
		{"multi extra", multi, []any{"A", "B", "C"}, false},
		{"multi duplicate", multi, []any{"A", "A"}, false},
		{"ordering exact", order, []any{"C", "A", "B"}, true},
		{"ordering swapped", order, []any{"A", "C", "B"}, false},
		{"output exact", out, "A\nB\npromise\ntimeout", true},
		{"output crlf and trailing space", out, "A  \r\nB\r\npromise\r\ntimeout\r\n\r\n", true},
		{"output order matters", out, "A\nB\ntimeout\npromise", false},
		{"output case matters", out, "a\nb\npromise\ntimeout", false},
		{"unanswered", out, nil, false},
	}
	for _, c := range cases {
		if got := isCorrect(c.q, c.given); got != c.want {
			t.Errorf("%s: isCorrect = %v, want %v", c.name, got, c.want)
		}
	}
	if AnswerKey([]any{"A", "C"}) != "A,C" || AnswerKey(true) != "true" || AnswerKey(nil) != "unanswered" {
		t.Errorf("AnswerKey encodings changed")
	}
}
