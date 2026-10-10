package cache

import (
	"testing"
	"time"
)

func TestCache(t *testing.T) {
	c := New(100, time.Minute)
	now := time.Now()
	c.now = func() time.Time { return now }

	c.SetIfCurrent(c.Generation(), "a", []byte("1234567890"))
	if v, ok := c.Get("a"); !ok || string(v) != "1234567890" {
		t.Fatalf("get a: %q %v", v, ok)
	}

	// expiry
	now = now.Add(2 * time.Minute)
	if _, ok := c.Get("a"); ok {
		t.Fatal("expired entry returned")
	}

	// size budget: least recently used goes first
	for _, k := range []string{"k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9", "k10"} {
		c.SetIfCurrent(c.Generation(), k, []byte("0123456789"))
	}
	c.Get("k1") // k1 is now the most recent
	c.SetIfCurrent(c.Generation(), "k11", []byte("0123456789"))
	if _, ok := c.Get("k2"); ok {
		t.Fatal("least recently used entry kept over budget")
	}
	if _, ok := c.Get("k1"); !ok {
		t.Fatal("recently used entry evicted")
	}

	// too big to keep
	c.SetIfCurrent(c.Generation(), "big", make([]byte, 50))
	if _, ok := c.Get("big"); ok {
		t.Fatal("oversized value cached")
	}
}

func TestClearBeatsSlowCompute(t *testing.T) {
	c := New(1000, time.Minute)
	gen := c.Generation() // a request starts building a response...
	c.Clear()             // ...the content changes meanwhile...
	c.SetIfCurrent(gen, "page", []byte("stale"))
	if _, ok := c.Get("page"); ok {
		t.Fatal("a response built before Clear was cached after it")
	}
	c.SetIfCurrent(c.Generation(), "page", []byte("fresh"))
	if v, _ := c.Get("page"); string(v) != "fresh" {
		t.Fatalf("got %q", v)
	}
	if c.Len() != 1 {
		t.Fatalf("len %d", c.Len())
	}
}
