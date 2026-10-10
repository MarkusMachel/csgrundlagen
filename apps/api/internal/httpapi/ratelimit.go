package httpapi

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// rateLimiter allows up to limit requests per key in each fixed one-minute
// window. It guards the auth endpoints against password guessing and sign-up
// or reset-mail spam; limit <= 0 disables it.
type rateLimiter struct {
	limit int
	mu    sync.Mutex
	hits  map[string]*window
}

type window struct {
	start time.Time
	count int
}

func newRateLimiter(limit int) *rateLimiter {
	return &rateLimiter{limit: limit, hits: map[string]*window{}}
}

func (l *rateLimiter) allow(key string, now time.Time) bool {
	if l.limit <= 0 {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	w := l.hits[key]
	if w == nil || now.Sub(w.start) >= time.Minute {
		if len(l.hits) > 10_000 { // drop stale windows so the map can't grow forever
			for k, old := range l.hits {
				if now.Sub(old.start) >= time.Minute {
					delete(l.hits, k)
				}
			}
		}
		l.hits[key] = &window{start: now, count: 1}
		return true
	}
	w.count++
	return w.count <= l.limit
}

// limited wraps a handler so each client IP gets limit requests per minute.
func (s *Server) limited(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.authLimiter.allow(r.URL.Path+" "+clientIP(r), time.Now()) {
			w.Header().Set("Retry-After", "60")
			writeError(w, http.StatusTooManyRequests, "Too many attempts, try again in a minute")
			return
		}
		next(w, r)
	}
}

// clientIP is the last X-Forwarded-For hop (the one our nginx appends, so a
// client can't forge it) or the socket address when there is no proxy.
func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		parts := strings.Split(fwd, ",")
		return strings.TrimSpace(parts[len(parts)-1])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
