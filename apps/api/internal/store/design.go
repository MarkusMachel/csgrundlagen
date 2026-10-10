package store

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"
)

// DesignKinds are the components a design can be built from. Keep in sync
// with apps/web/src/features/questions/design.ts.
var DesignKinds = []string{
	"client", "dns", "cdn", "load-balancer", "api-gateway", "service", "worker",
	"cache", "sql", "nosql", "replica", "queue", "object-storage", "search",
	"rate-limiter", "auth", "websocket", "scheduler",
}

// DesignSpec is a system design challenge: what the system must do, the
// rules a design is checked against, and a reference design that passes them.
type DesignSpec struct {
	Requirements []DesignRequirement `json:"requirements"`
	Rules        []DesignRule        `json:"rules"`
	Reference    DesignGraph         `json:"reference"`
}

type DesignRequirement struct {
	ID   string `json:"id"`
	Text string `json:"text"`
}

// DesignRule is one check on a submitted design. Kinds:
//
//	has      at least Min (default 1) components of a kind in Of
//	edge     a component of a kind in From connects directly to one in To
//	path     From reaches To following the arrows, through a Via kind if set
//	no-edge  no component of a kind in From connects directly to one in To
//
// Optional rules are good practice: shown in the result, not needed to pass.
type DesignRule struct {
	ID          string   `json:"id"`
	Requirement string   `json:"requirement,omitempty"`
	Kind        string   `json:"kind"`
	Of          []string `json:"of,omitempty"`
	Min         int      `json:"min,omitempty"`
	From        []string `json:"from,omitempty"`
	To          []string `json:"to,omitempty"`
	Via         []string `json:"via,omitempty"`
	Optional    bool     `json:"optional,omitempty"`
	// Text says what is checked ("A cache in front of the database"),
	// Explanation why it matters.
	Text        string  `json:"text"`
	Explanation string  `json:"explanation"`
	MaterialID  *string `json:"materialId,omitempty"`
}

// DesignGraph is a design: components and the arrows between them, pointing
// the way requests and data flow.
type DesignGraph struct {
	Nodes []DesignNode `json:"nodes"`
	Edges []DesignEdge `json:"edges"`
}

type DesignNode struct {
	ID    string `json:"id"`
	Kind  string `json:"kind"`
	Label string `json:"label,omitempty"`
}

type DesignEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// DesignResult is how a submitted design did, rule by rule. Score and Total
// count the required rules only.
type DesignResult struct {
	Score int                `json:"score"`
	Total int                `json:"total"`
	Rules []DesignRuleResult `json:"rules"`
}

type DesignRuleResult struct {
	ID     string `json:"id"`
	Passed bool   `json:"passed"`
}

const (
	maxDesignNodes = 60
	maxDesignEdges = 150
)

// designGraphOf reads a submitted answer as a design, if it is one.
func designGraphOf(v any) (DesignGraph, bool) {
	if g, ok := v.(DesignGraph); ok {
		return g, true
	}
	m, ok := v.(map[string]any)
	if !ok {
		return DesignGraph{}, false
	}
	if _, ok := m["nodes"].([]any); !ok {
		return DesignGraph{}, false
	}
	raw, err := json.Marshal(m)
	if err != nil {
		return DesignGraph{}, false
	}
	var g DesignGraph
	if json.Unmarshal(raw, &g) != nil || len(g.Nodes) > maxDesignNodes || len(g.Edges) > maxDesignEdges {
		return DesignGraph{}, false
	}
	return g, true
}

// GradeDesign checks a design against every rule of the challenge.
// Keep in sync with gradeDesign in apps/web/src/features/questions/design.ts.
func GradeDesign(spec DesignSpec, g DesignGraph) DesignResult {
	kind := map[string]string{}
	for _, n := range g.Nodes {
		kind[n.ID] = n.Kind
	}
	out := map[string][]string{}
	for _, e := range g.Edges {
		if _, ok := kind[e.From]; ok {
			if _, ok := kind[e.To]; ok {
				out[e.From] = append(out[e.From], e.To)
			}
		}
	}
	ofKind := func(kinds []string) []string {
		var ids []string
		for _, n := range g.Nodes {
			if slices.Contains(kinds, n.Kind) {
				ids = append(ids, n.ID)
			}
		}
		return ids
	}
	directEdge := func(from, to []string) bool {
		for _, e := range g.Edges {
			if slices.Contains(from, kind[e.From]) && slices.Contains(to, kind[e.To]) {
				return true
			}
		}
		return false
	}

	res := DesignResult{Rules: make([]DesignRuleResult, 0, len(spec.Rules))}
	for _, r := range spec.Rules {
		var passed bool
		switch r.Kind {
		case "has":
			passed = len(ofKind(r.Of)) >= max(r.Min, 1)
		case "edge":
			passed = directEdge(r.From, r.To)
		case "no-edge":
			passed = !directEdge(r.From, r.To)
		case "path":
			starts := ofKind(r.From)
			if len(r.Via) == 0 {
				passed = reachesKind(out, kind, starts, r.To)
				break
			}
			// From reaches a Via component that itself reaches To
			for _, v := range ofKind(r.Via) {
				if reachesNode(out, starts, v) && reachesKind(out, kind, []string{v}, r.To) {
					passed = true
					break
				}
			}
		}
		res.Rules = append(res.Rules, DesignRuleResult{ID: r.ID, Passed: passed})
		if !r.Optional {
			res.Total++
			if passed {
				res.Score++
			}
		}
	}
	return res
}

// reachesNode reports whether some start reaches the node target.
func reachesNode(out map[string][]string, starts []string, target string) bool {
	seen := map[string]bool{}
	var queue []string
	for _, s := range starts {
		queue = append(queue, out[s]...)
	}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if id == target {
			return true
		}
		if seen[id] {
			continue
		}
		seen[id] = true
		queue = append(queue, out[id]...)
	}
	return false
}

// reachesKind reports whether a path of at least one arrow leads from any
// of starts to a node whose kind is in targets.
func reachesKind(out map[string][]string, kind map[string]string, starts, targets []string) bool {
	seen := map[string]bool{}
	var queue []string
	for _, s := range starts {
		queue = append(queue, out[s]...)
	}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if seen[id] {
			continue
		}
		seen[id] = true
		if slices.Contains(targets, kind[id]) {
			return true
		}
		queue = append(queue, out[id]...)
	}
	return false
}

// Passed reports whether every required rule passed.
func (r DesignResult) Passed() bool { return r.Score == r.Total }

func (d *DesignSpec) validate() error {
	if d == nil {
		return ErrInvalid{"design questions need a design (requirements, rules and a reference)"}
	}
	if len(d.Requirements) == 0 || len(d.Rules) == 0 {
		return ErrInvalid{"a design needs at least one requirement and one rule"}
	}
	reqs := map[string]bool{}
	for _, q := range d.Requirements {
		if q.ID == "" || strings.TrimSpace(q.Text) == "" || reqs[q.ID] {
			return ErrInvalid{"requirements need unique ids and text"}
		}
		reqs[q.ID] = true
	}
	known := func(kinds []string) bool {
		for _, k := range kinds {
			if !slices.Contains(DesignKinds, k) {
				return false
			}
		}
		return true
	}
	ids := map[string]bool{}
	for _, r := range d.Rules {
		if r.ID == "" || ids[r.ID] {
			return ErrInvalid{"rules need unique ids"}
		}
		ids[r.ID] = true
		if r.Requirement != "" && !reqs[r.Requirement] {
			return ErrInvalid{fmt.Sprintf("rule %s names an unknown requirement", r.ID)}
		}
		if strings.TrimSpace(r.Text) == "" || strings.TrimSpace(r.Explanation) == "" {
			return ErrInvalid{fmt.Sprintf("rule %s needs text and an explanation", r.ID)}
		}
		if !known(r.Of) || !known(r.From) || !known(r.To) || !known(r.Via) {
			return ErrInvalid{fmt.Sprintf("rule %s uses an unknown component kind", r.ID)}
		}
		switch r.Kind {
		case "has":
			if len(r.Of) == 0 {
				return ErrInvalid{fmt.Sprintf("rule %s: has needs of", r.ID)}
			}
		case "edge", "no-edge", "path":
			if len(r.From) == 0 || len(r.To) == 0 {
				return ErrInvalid{fmt.Sprintf("rule %s: %s needs from and to", r.ID, r.Kind)}
			}
		default:
			return ErrInvalid{fmt.Sprintf("rule %s: kind must be has, edge, path or no-edge", r.ID)}
		}
	}
	nodes := map[string]bool{}
	for _, n := range d.Reference.Nodes {
		if n.ID == "" || nodes[n.ID] || !known([]string{n.Kind}) {
			return ErrInvalid{"reference components need unique ids and known kinds"}
		}
		nodes[n.ID] = true
	}
	for _, e := range d.Reference.Edges {
		if !nodes[e.From] || !nodes[e.To] {
			return ErrInvalid{"reference arrows must connect reference components"}
		}
	}
	// The reference design is the model answer, so it must pass every rule.
	res := GradeDesign(*d, d.Reference)
	for i, r := range res.Rules {
		if !r.Passed {
			return ErrInvalid{fmt.Sprintf("the reference design fails rule %s (%s)", r.ID, d.Rules[i].Text)}
		}
	}
	return nil
}
