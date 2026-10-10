package httpapi_test

import (
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestQuestionTypes(t *testing.T) {
	c, admin, ada := newServer(t)
	create := func(body map[string]any) store.Question {
		t.Helper()
		body["tags"], body["explanation"] = []string{"JavaScript"}, "Because."
		var q store.Question
		expect(t, "create "+body["type"].(string), c.do("POST", "/api/questions", admin, body, &q), 201)
		return q
	}
	opts := func(labels ...string) []map[string]string {
		out := []map[string]string{}
		for i, l := range labels {
			out = append(out, map[string]string{"id": string(rune('A' + i)), "label": l})
		}
		return out
	}

	multi := create(map[string]any{"type": "multi-select", "prompt": "Which are falsy?",
		"options": opts("0", `""`, "[]", "NaN"), "correctOptionIds": []string{"A", "B", "D"}})
	order := create(map[string]any{"type": "ordering", "prompt": "Order the event loop steps",
		"options": opts("sync code", "microtasks", "next task")})
	output := create(map[string]any{"type": "output", "prompt": "What does this print?",
		"code": "console.log(1)\nconsole.log(2)", "codeLanguage": "js", "expectedOutput": "1\n2\n"})

	expect(t, "multi key", multi.CorrectOptionIDs, []string{"A", "B", "D"})
	expect(t, "ordering key keeps author order", order.CorrectOrder, []string{"A", "B", "C"})
	expect(t, "output fields", vals(*output.CodeLanguage, *output.ExpectedOutput == "1\n2\n"), "js true")

	submit := func(q store.Question, answer any) bool {
		t.Helper()
		var res store.SubmitAnswerResult
		expect(t, "submit "+q.Type, c.do("POST", "/api/questions/"+q.ID+"/submit", ada, map[string]any{"answer": answer}, &res), 200)
		return res.Correct
	}
	expect(t, "multi right, any order", submit(multi, []string{"D", "A", "B"}), true)
	expect(t, "multi partial is wrong", submit(multi, []string{"A", "B"}), false)
	expect(t, "ordering right", submit(order, []string{"A", "B", "C"}), true)
	expect(t, "ordering wrong", submit(order, []string{"B", "A", "C"}), false)
	expect(t, "output with trailing whitespace", submit(output, "1  \r\n2"), true)
	expect(t, "output wrong", submit(output, "2\n1"), false)
	expect(t, "bad answer shape", c.do("POST", "/api/questions/"+multi.ID+"/submit", ada,
		map[string]any{"answer": []any{1, 2}}, nil), 400)

	var st store.QuestionStats
	c.do("GET", "/api/questions/"+multi.ID+"/stats", "", nil, &st)
	expect(t, "multi stats count each picked option", vals(st.TotalResponses, st.Distribution[0].Count, st.Distribution[3].Count), "2 2 1")
	c.do("GET", "/api/questions/"+output.ID+"/stats", "", nil, &st)
	expect(t, "output stats are right vs wrong", vals(st.Distribution[0].OptionID, st.Distribution[0].Count, st.Distribution[1].Count), "correct 1 1")

	// --- invalid payloads ---
	for name, body := range map[string]map[string]any{
		"multi without key":     {"type": "multi-select", "options": opts("a", "b")},
		"multi unknown key":     {"type": "multi-select", "options": opts("a", "b"), "correctOptionIds": []string{"C"}},
		"ordering one option":   {"type": "ordering", "options": opts("only")},
		"output without code":   {"type": "output", "codeLanguage": "js", "expectedOutput": "x"},
		"output without output": {"type": "output", "code": "x", "codeLanguage": "js"},
		"unknown type":          {"type": "essay"},
	} {
		body["prompt"], body["tags"], body["explanation"] = "p", []string{"t"}, "e"
		expect(t, name, c.do("POST", "/api/questions", admin, body, nil), 400)
	}

	// --- tests grade the new types too, and ?ids keeps the given order ---
	var test struct{ ID string }
	expect(t, "create test", c.do("POST", "/api/tests", ada, map[string]any{
		"name": "Types", "questionIds": []string{output.ID, multi.ID, order.ID},
	}, &test), 201)
	var res store.TestSubmitResult
	expect(t, "submit test", c.do("POST", "/api/tests/"+test.ID+"/submit", ada, map[string]any{
		"mode": "practice", "answers": map[string]any{
			multi.ID: []string{"A", "B", "D"}, order.ID: []string{"C", "B", "A"}, output.ID: "1\n2",
		},
	}, &res), 200)
	expect(t, "test score", vals(res.Score, res.Total), "2 3")

	var page store.QuestionsPage
	expect(t, "ids filter", c.do("GET", "/api/questions?ids="+order.ID+","+multi.ID, "", nil, &page), 200)
	expect(t, "ids order kept", vals(page.Total, page.Items[0].ID == order.ID, page.Items[1].ID == multi.ID), "2 true true")
	expect(t, "bad ids", c.do("GET", "/api/questions?ids=nope", "", nil, nil), 400)
}
