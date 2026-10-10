package store

import "testing"

func TestGradeDesign(t *testing.T) {
	spec := DesignSpec{
		Requirements: []DesignRequirement{{ID: "r1", Text: "Fast reads"}},
		Rules: []DesignRule{
			{ID: "lb", Kind: "path", From: []string{"client"}, Via: []string{"load-balancer"}, To: []string{"service"}, Text: "t", Explanation: "e"},
			{ID: "cache", Kind: "edge", From: []string{"service"}, To: []string{"cache"}, Text: "t", Explanation: "e"},
			{ID: "two", Kind: "has", Of: []string{"service"}, Min: 2, Text: "t", Explanation: "e"},
			{ID: "nodb", Kind: "no-edge", From: []string{"client"}, To: []string{"sql", "nosql"}, Text: "t", Explanation: "e"},
			{ID: "cdn", Kind: "has", Of: []string{"cdn"}, Optional: true, Text: "t", Explanation: "e"},
		},
	}
	g := func(nodes map[string]string, edges ...[2]string) DesignGraph {
		var out DesignGraph
		for id, k := range nodes {
			out.Nodes = append(out.Nodes, DesignNode{ID: id, Kind: k})
		}
		for _, e := range edges {
			out.Edges = append(out.Edges, DesignEdge{From: e[0], To: e[1]})
		}
		return out
	}
	passed := func(r DesignResult) map[string]bool {
		m := map[string]bool{}
		for _, x := range r.Rules {
			m[x.ID] = x.Passed
		}
		return m
	}

	good := g(map[string]string{"c": "client", "lb": "load-balancer", "s1": "service", "s2": "service", "k": "cache", "db": "sql"},
		[2]string{"c", "lb"}, [2]string{"lb", "s1"}, [2]string{"lb", "s2"}, [2]string{"s1", "k"}, [2]string{"s1", "db"})
	res := GradeDesign(spec, good)
	if !res.Passed() || res.Score != 4 || res.Total != 4 || passed(res)["cdn"] {
		t.Fatalf("good design: %+v", res)
	}

	// client skips the load balancer, talks to the db, one service, no cache
	bad := g(map[string]string{"c": "client", "lb": "load-balancer", "s": "service", "db": "sql"},
		[2]string{"c", "s"}, [2]string{"s", "lb"}, [2]string{"c", "db"})
	res = GradeDesign(spec, bad)
	p := passed(res)
	if res.Passed() || res.Score != 0 || p["lb"] || p["cache"] || p["two"] || p["nodb"] {
		t.Fatalf("bad design: %+v", res)
	}

	// the path must go through the load balancer *to* a service
	backwards := g(map[string]string{"c": "client", "lb": "load-balancer", "s": "service"},
		[2]string{"c", "lb"}, [2]string{"s", "lb"})
	if passed(GradeDesign(spec, backwards))["lb"] {
		t.Fatal("arrows pointing into the load balancer from the service shouldn't count")
	}

	// edges to unknown nodes are ignored, not a crash
	dangling := g(map[string]string{"c": "client"}, [2]string{"c", "ghost"})
	if GradeDesign(spec, dangling).Passed() {
		t.Fatal("dangling edge design passed")
	}
}

func TestDesignSpecValidate(t *testing.T) {
	base := func() *DesignSpec {
		return &DesignSpec{
			Requirements: []DesignRequirement{{ID: "r1", Text: "Cache reads"}},
			Rules: []DesignRule{{ID: "a", Requirement: "r1", Kind: "edge", From: []string{"service"},
				To: []string{"cache"}, Text: "Service uses a cache", Explanation: "Reads are fast."}},
			Reference: DesignGraph{
				Nodes: []DesignNode{{ID: "s", Kind: "service"}, {ID: "k", Kind: "cache"}},
				Edges: []DesignEdge{{From: "s", To: "k"}},
			},
		}
	}
	if err := base().validate(); err != nil {
		t.Fatalf("valid spec: %v", err)
	}
	cases := map[string]func(*DesignSpec){
		"no rules":          func(d *DesignSpec) { d.Rules = nil },
		"unknown kind":      func(d *DesignSpec) { d.Rules[0].To = []string{"mainframe"} },
		"unknown req":       func(d *DesignSpec) { d.Rules[0].Requirement = "nope" },
		"bad rule kind":     func(d *DesignSpec) { d.Rules[0].Kind = "maybe" },
		"dangling edge":     func(d *DesignSpec) { d.Reference.Edges[0].To = "x" },
		"reference fails":   func(d *DesignSpec) { d.Reference.Edges = nil },
		"missing rule text": func(d *DesignSpec) { d.Rules[0].Explanation = " " },
	}
	for name, mutate := range cases {
		d := base()
		mutate(d)
		if d.validate() == nil {
			t.Errorf("%s: expected an error", name)
		}
	}
	var nilSpec *DesignSpec
	if nilSpec.validate() == nil {
		t.Error("nil spec: expected an error")
	}
}
