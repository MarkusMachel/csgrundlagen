package store

import (
	"strings"
	"testing"
)


func TestAnkiExport(t *testing.T) {
	out := AnkiExport([]Question{
		{
			ID: "q1", Type: "multiple-choice", Prompt: "Which `x` is <reliable>?\n\n```go\nfor {\n\tretry()\n}\n```",
			Options:         []Option{{ID: "A", Label: "TCP"}, {ID: "B", Label: "UDP"}},
			CorrectOptionID: ptr("A"), Explanation: "TCP acks.\nUDP doesn't.",
			Tags: []string{"Networking", "APIs & HTTP"}, Difficulty: ptr("easy"),
		},
		{ID: "q2", Type: "flashcard", Prompt: "What is a goroutine?", Explanation: "A lightweight thread.", Tags: []string{"Go"}},
	})
	lines := strings.Split(strings.TrimRight(out, "\n"), "\n")
	if lines[0] != "#separator:tab" || !strings.Contains(out, "#guid column:4") || !strings.Contains(out, "#deck:CS Trainer") {
		t.Fatalf("header: %q", out)
	}
	notes := lines[6:]
	if len(notes) != 2 {
		t.Fatalf("want 2 notes, got %d: %q", len(notes), notes)
	}
	fields := strings.Split(notes[0], "\t")
	if len(fields) != 4 {
		t.Fatalf("want 4 fields (no stray tabs/newlines), got %d: %q", len(fields), fields)
	}
	front, back, tags, guid := fields[0], fields[1], fields[2], fields[3]
	for _, want := range []string{"<code>x</code>", "&lt;reliable&gt;", `<pre><code class="language-go">for {<br>    retry()<br>}</code></pre>`, `<ol type="A"><li>TCP</li><li>UDP</li></ol>`} {
		if !strings.Contains(front, want) {
			t.Errorf("front missing %q:\n%s", want, front)
		}
	}
	if !strings.Contains(back, "<b>A.</b> TCP<hr>TCP acks.<br>UDP doesn&#39;t.") {
		t.Errorf("back: %s", back)
	}
	if tags != "cs::Networking cs::APIs_&_HTTP cs::difficulty::easy" || guid != "cs-trainer-q1" {
		t.Errorf("tags/guid: %q %q", tags, guid)
	}
	card := strings.Split(notes[1], "\t")
	if card[0] != "What is a goroutine?" || card[1] != "A lightweight thread." {
		t.Errorf("flashcard: %q", card)
	}
}

func TestFlashcardGrading(t *testing.T) {
	q := Question{Type: "flashcard"}
	if !isCorrect(q, true) || isCorrect(q, false) || isCorrect(q, "yes") {
		t.Error("flashcards: true (knew it) is right, anything else wrong")
	}
}
