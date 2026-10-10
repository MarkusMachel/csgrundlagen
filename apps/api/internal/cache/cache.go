// Package cache keeps recently built API responses in memory. Entries are
// dropped when they get old, when the cache is over its size budget (least
// recently used first) and all at once when the content they were built from
// changes (Clear).
package cache

import (
	"container/list"
	"sync"
	"time"
)

type entry struct {
	key     string
	value   []byte
	expires time.Time
}

// Cache is safe for concurrent use. The zero value is not usable; call New.
type Cache struct {
	mu       sync.Mutex
	maxBytes int
	ttl      time.Duration
	bytes    int
	items    map[string]*list.Element
	order    *list.List // front = most recently used
	// gen counts Clears, so a value computed before one isn't stored after it.
	gen uint64
	now func() time.Time
}

// New makes a cache holding at most maxBytes of values, each for at most ttl.
func New(maxBytes int, ttl time.Duration) *Cache {
	return &Cache{maxBytes: maxBytes, ttl: ttl, items: map[string]*list.Element{}, order: list.New(), now: time.Now}
}

// Get returns the value stored under key, if it's there and fresh.
func (c *Cache) Get(key string) ([]byte, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	el, ok := c.items[key]
	if !ok {
		return nil, false
	}
	e := el.Value.(*entry)
	if c.now().After(e.expires) {
		c.remove(el)
		return nil, false
	}
	c.order.MoveToFront(el)
	return e.value, true
}

// Generation identifies the cache's current content. Pass it to SetIfCurrent
// so a value built from data read before a Clear isn't cached after it.
func (c *Cache) Generation() uint64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.gen
}

// SetIfCurrent stores value under key unless the cache was cleared since gen
// was read. Values bigger than an eighth of the budget aren't kept.
func (c *Cache) SetIfCurrent(gen uint64, key string, value []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if gen != c.gen || len(value) > c.maxBytes/8 {
		return
	}
	if el, ok := c.items[key]; ok {
		c.remove(el)
	}
	c.items[key] = c.order.PushFront(&entry{key: key, value: value, expires: c.now().Add(c.ttl)})
	c.bytes += len(value)
	for c.bytes > c.maxBytes {
		c.remove(c.order.Back())
	}
}

// Clear drops everything, e.g. because questions were edited.
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = map[string]*list.Element{}
	c.order.Init()
	c.bytes = 0
	c.gen++
}

// Len is how many entries are cached (for tests and metrics).
func (c *Cache) Len() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.items)
}

func (c *Cache) remove(el *list.Element) {
	e := c.order.Remove(el).(*entry)
	delete(c.items, e.key)
	c.bytes -= len(e.value)
}
