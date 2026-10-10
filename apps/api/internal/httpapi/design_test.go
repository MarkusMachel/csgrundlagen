package httpapi_test

import (
	"testing"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func TestDesignQuestions(t *testing.T) {
	c, admin, ada := newServer(t)
	design := map[string]any{
		"requirements": []map[string]string{{"id": "scale", "text": "Survive a server failure"}},
		"rules": []map[string]any{
			{"id": "lb", "requirement": "scale", "kind": "path", "from": []string{"client"},
				"via": []string{"load-balancer"}, "to": []string{"service"},
				"text": "Requests go through a load balancer", "explanation": "It spreads load."},
			{"id": "two", "requirement": "scale", "kind": "has", "of": []string{"service"}, "min": 2,
				"text": "Two or more service instances", "explanation": "One can fail."},
			{"id": "cdn", "kind": "has", "of": []string{"cdn"}, "optional": true,
				"text": "A CDN", "explanation": "Static files load faster."},
		},
		"reference": map[string]any{
			"nodes": []map[string]string{{"id": "c", "kind": "client"}, {"id": "lb", "kind": "load-balancer"},
				{"id": "s1", "kind": "service"}, {"id": "s2", "kind": "service"}, {"id": "cdn", "kind": "cdn"}},
			"edges": []map[string]string{{"from": "c", "to": "lb"}, {"from": "lb", "to": "s1"},
				{"from": "lb", "to": "s2"}, {"from": "c", "to": "cdn"}},
		},
	}
	body := map[string]any{"type": "design", "prompt": "Design a resilient web app", "tags": []string{"System Design"},
		"explanation": "Put a load balancer in front of several instances.", "design": design}

	// the reference has to pass its own rules
	broken := map[string]any{}
	for k, v := range body {
		broken[k] = v
	}
	brokenDesign := map[string]any{}
	for k, v := range design {
		brokenDesign[k] = v
	}
	brokenDesign["reference"] = map[string]any{"nodes": []map[string]string{{"id": "c", "kind": "client"}}, "edges": []any{}}
	broken["design"] = brokenDesign
	expect(t, "reference failing its rules", c.do("POST", "/api/questions", admin, broken, nil), 400)

	var q store.Question
	expect(t, "create design", c.do("POST", "/api/questions", admin, body, &q), 201)
	expect(t, "design round trip", vals(q.Type, len(q.Design.Rules), len(q.Design.Reference.Nodes)), "design 3 5")

	// it has its own list; the regular feed and the daily question leave it out
	var mc store.Question
	expect(t, "create mc", c.do("POST", "/api/questions", admin, map[string]any{"type": "true-false",
		"prompt": "UDP is reliable", "tags": []string{"Networking"}, "explanation": "No.", "correctAnswer": false}, &mc), 201)
	var page store.QuestionsPage
	expect(t, "design list", c.do("GET", "/api/questions?type=design", "", nil, &page), 200)
	expect(t, "design list holds the challenge", vals(page.Total, page.Items[0].ID == q.ID), "1 true")
	expect(t, "feed", c.do("GET", "/api/questions", "", nil, &page), 200)
	expect(t, "feed leaves design out", vals(page.Total, page.Items[0].ID == mc.ID), "1 true")
	var daily store.Question
	for range 3 {
		expect(t, "daily", c.do("GET", "/api/questions/daily", "", nil, &daily), 200)
		expect(t, "daily is never a design", daily.Type, "true-false")
	}

	submit := func(nodes []map[string]string, edges []map[string]string) store.SubmitAnswerResult {
		t.Helper()
		var res store.SubmitAnswerResult
		expect(t, "submit design", c.do("POST", "/api/questions/"+q.ID+"/submit", ada,
			map[string]any{"answer": map[string]any{"nodes": nodes, "edges": edges}}, &res), 200)
		return res
	}
	res := submit(
		[]map[string]string{{"id": "a", "kind": "client"}, {"id": "b", "kind": "load-balancer"},
			{"id": "x", "kind": "service", "label": "api-1"}, {"id": "y", "kind": "service"}},
		[]map[string]string{{"from": "a", "to": "b"}, {"from": "b", "to": "x"}, {"from": "b", "to": "y"}})
	expect(t, "good design passes without the optional CDN", vals(res.Correct, res.Design.Score, res.Design.Total), "true 2 2")
	expect(t, "optional rule reported", vals(res.Design.Rules[2].ID, res.Design.Rules[2].Passed), "cdn false")

	res = submit([]map[string]string{{"id": "a", "kind": "client"}, {"id": "x", "kind": "service"}},
		[]map[string]string{{"from": "a", "to": "x"}})
	expect(t, "weak design fails", vals(res.Correct, res.Design.Score, res.Design.Total), "false 0 2")

	expect(t, "oversized design", c.do("POST", "/api/questions/"+q.ID+"/submit", ada,
		map[string]any{"answer": map[string]any{"nodes": make([]map[string]string, 61), "edges": []any{}}}, nil), 400)

	var stats store.QuestionStats
	expect(t, "stats", c.do("GET", "/api/questions/"+q.ID+"/stats", "", nil, &stats), 200)
	expect(t, "stats count right and wrong", vals(stats.TotalResponses, stats.Distribution[0].Count), "2 1")

	// editing keeps the design (and records it in the history)
	body["prompt"] = "Design a resilient web application"
	expect(t, "update design", c.do("PUT", "/api/questions/"+q.ID, admin, body, &q), 200)
	expect(t, "design kept", len(q.Design.Rules), 3)
}
