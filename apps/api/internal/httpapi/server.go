// Package httpapi exposes the store over the JSON /api contract the web app
// uses (the same one apps/web/src/mocks/handlers implements with MSW).
package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

type Server struct {
	store       *store.Store
	log         *slog.Logger
	opts        Options
	authLimiter *rateLimiter
	httpClient  *http.Client
}

// Options configures the parts of the server that differ between
// environments. Zero values get sensible defaults.
type Options struct {
	// BaseURL is the web app's public origin, used to build links in emails
	// (default http://localhost:3000).
	BaseURL string
	// Mailer sends password reset links (default: LogMailer).
	Mailer Mailer
	// AuthRatePerMinute caps login, sign-up, reset and code-run requests per
	// client IP and endpoint (default 20; negative disables the limit).
	AuthRatePerMinute int
	// GoPlaygroundURL is where Go snippets are run (default: the official Go
	// Playground); "off" disables running Go.
	GoPlaygroundURL string
}

func New(st *store.Store, log *slog.Logger, opts Options) http.Handler {
	if opts.BaseURL == "" {
		opts.BaseURL = "http://localhost:3000"
	}
	opts.BaseURL = strings.TrimRight(opts.BaseURL, "/")
	if opts.Mailer == nil {
		opts.Mailer = LogMailer{Log: log}
	}
	if opts.AuthRatePerMinute == 0 {
		opts.AuthRatePerMinute = 20
	}
	if opts.GoPlaygroundURL == "" {
		opts.GoPlaygroundURL = DefaultGoPlaygroundURL
	}
	s := &Server{
		store: st, log: log, opts: opts,
		authLimiter: newRateLimiter(opts.AuthRatePerMinute),
		httpClient:  &http.Client{Timeout: runCallTimeout},
	}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", s.health)

	mux.HandleFunc("POST /api/auth/login", s.limited(s.login))
	mux.HandleFunc("POST /api/auth/signup", s.limited(s.signup))
	mux.HandleFunc("POST /api/auth/logout", s.logout)
	mux.HandleFunc("POST /api/auth/cookie", s.authed(s.tokenToCookie))
	mux.HandleFunc("GET /api/auth/me", s.authed(s.me))
	mux.HandleFunc("POST /api/auth/password", s.limited(s.authed(s.changePassword)))
	mux.HandleFunc("POST /api/auth/password-reset", s.limited(s.requestPasswordReset))
	mux.HandleFunc("POST /api/auth/password-reset/confirm", s.limited(s.confirmPasswordReset))

	mux.HandleFunc("GET /api/questions", s.listQuestions)
	mux.HandleFunc("POST /api/questions", s.admin(s.createQuestion))
	mux.HandleFunc("GET /api/questions/daily", s.dailyQuestion)
	mux.HandleFunc("GET /api/questions/weak", s.authed(s.weakQuestions))
	mux.HandleFunc("GET /api/questions/{id}", s.getQuestion)
	mux.HandleFunc("PUT /api/questions/{id}", s.admin(s.updateQuestion))
	mux.HandleFunc("DELETE /api/questions/{id}", s.admin(s.deleteQuestion))
	mux.HandleFunc("GET /api/questions/{id}/revisions", s.admin(s.questionRevisions))
	mux.HandleFunc("GET /api/questions/{id}/authoring", s.admin(s.questionAuthoring))
	mux.HandleFunc("POST /api/questions/{id}/revisions/{rid}/restore", s.admin(s.restoreRevision))
	mux.HandleFunc("POST /api/questions/{id}/submit", s.authed(s.submitAnswer))
	mux.HandleFunc("GET /api/questions/{id}/comments", s.listComments)
	mux.HandleFunc("POST /api/questions/{id}/comments", s.authed(s.addComment))
	mux.HandleFunc("GET /api/questions/{id}/notes", s.authed(s.getNote))
	mux.HandleFunc("PUT /api/questions/{id}/notes", s.authed(s.saveNote))
	mux.HandleFunc("GET /api/questions/{id}/stats", s.questionStats)
	mux.HandleFunc("GET /api/questions/{id}/materials", s.questionMaterials)
	mux.HandleFunc("POST /api/questions/{id}/bug-reports", s.authed(s.addBugReport))
	mux.HandleFunc("POST /api/questions/{id}/bookmark", s.authed(s.toggleBookmark))

	mux.HandleFunc("GET /api/bookmarks", s.authed(s.bookmarks))
	mux.HandleFunc("GET /api/review/queue", s.authed(s.reviewQueue))
	mux.HandleFunc("GET /api/me/progress", s.authed(s.progress))
	mux.HandleFunc("GET /api/me/sessions", s.authed(s.mySessions))
	mux.HandleFunc("DELETE /api/me/sessions/{id}", s.authed(s.revokeMySession))
	mux.HandleFunc("POST /api/me/device", s.authed(s.saveDevice))
	mux.HandleFunc("POST /api/me/consent", s.authed(s.recordConsent))
	mux.HandleFunc("POST /api/me/privacy", s.authed(s.acceptPrivacy))
	mux.HandleFunc("GET /api/me/export", s.authed(s.exportMyData))
	mux.HandleFunc("DELETE /api/me", s.limited(s.authed(s.deleteMyAccount)))
	mux.HandleFunc("PATCH /api/me", s.authed(s.updateProfile))
	mux.HandleFunc("POST /api/me/email", s.limited(s.authed(s.requestEmailChange)))
	mux.HandleFunc("POST /api/me/email/confirm", s.limited(s.confirmEmailChange))
	mux.HandleFunc("POST /api/run", s.limited(s.authed(s.run)))
	mux.HandleFunc("GET /api/tags", s.tags)
	mux.HandleFunc("GET /api/search", s.search)

	mux.HandleFunc("GET /api/tests", s.authed(s.listTests))
	mux.HandleFunc("POST /api/tests", s.authed(s.createTest))
	mux.HandleFunc("GET /api/tests/{id}", s.authed(s.getTest))
	mux.HandleFunc("DELETE /api/tests/{id}", s.authed(s.deleteTest))
	mux.HandleFunc("GET /api/tests/{id}/attempts", s.authed(s.listAttempts))
	mux.HandleFunc("POST /api/tests/{id}/submit", s.authed(s.submitTest))
	mux.HandleFunc("GET /api/tests/{id}/draft", s.authed(s.getDraft))
	mux.HandleFunc("PUT /api/tests/{id}/draft", s.authed(s.saveDraft))
	mux.HandleFunc("DELETE /api/tests/{id}/draft", s.authed(s.deleteDraft))

	mux.HandleFunc("GET /api/materials", s.listMaterials)
	mux.HandleFunc("POST /api/materials", s.admin(s.createMaterial))
	mux.HandleFunc("PUT /api/materials/{id}", s.admin(s.updateMaterial))
	mux.HandleFunc("DELETE /api/materials/{id}", s.admin(s.deleteMaterial))

	mux.HandleFunc("GET /api/admin/stats", s.admin(s.adminStats))
	mux.HandleFunc("GET /api/admin/quality", s.admin(s.qualityReport))
	mux.HandleFunc("POST /api/admin/import/flashcards", s.admin(s.importFlashcards))
	mux.HandleFunc("GET /api/export/anki", s.authed(s.exportAnki))
	mux.HandleFunc("GET /api/admin/bug-reports", s.admin(s.listBugReports))
	mux.HandleFunc("PATCH /api/admin/bug-reports/{id}", s.admin(s.setBugReportStatus))
	mux.HandleFunc("GET /api/admin/comments", s.admin(s.moderationQueue))
	mux.HandleFunc("PATCH /api/admin/comments/{id}", s.admin(s.moderateComment))
	mux.HandleFunc("POST /api/comments/{id}/report", s.limited(s.authed(s.reportComment)))
	mux.HandleFunc("DELETE /api/comments/{id}", s.authed(s.deleteComment))
	mux.HandleFunc("GET /api/admin/users", s.admin(s.adminUsers))
	mux.HandleFunc("GET /api/admin/users/{id}", s.admin(s.adminUserDetail))
	mux.HandleFunc("PATCH /api/admin/users/{id}", s.admin(s.adminChangeUser))
	mux.HandleFunc("DELETE /api/admin/users/{id}", s.admin(s.adminDeleteUser))
	mux.HandleFunc("DELETE /api/admin/users/{id}/sessions", s.admin(s.adminRevokeAllSessions))
	mux.HandleFunc("DELETE /api/admin/users/{id}/sessions/{sid}", s.admin(s.adminRevokeSession))

	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "Not found")
	})

	return s.recoverer(s.logRequests(sameOrigin(mux)))
}

// --- middleware -------------------------------------------------------------

type ctxKey int

const userKey ctxKey = iota

// optionalUser resolves the bearer token if one is present; nil otherwise.
func (s *Server) optionalUser(r *http.Request) *store.User {
	token := sessionToken(r)
	if token == "" {
		return nil
	}
	u, err := s.store.UserForToken(r.Context(), token, clientIP(r))
	if err != nil {
		return nil
	}
	return &u
}

func currentUser(r *http.Request) store.User {
	return r.Context().Value(userKey).(store.User)
}

// authed requires a valid session; handlers can then call currentUser(r).
func (s *Server) authed(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := s.optionalUser(r)
		if u == nil {
			writeError(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), userKey, *u)))
	}
}

// admin requires a valid session belonging to an admin.
func (s *Server) admin(next http.HandlerFunc) http.HandlerFunc {
	return s.authed(func(w http.ResponseWriter, r *http.Request) {
		if !currentUser(r).IsAdmin() {
			writeError(w, http.StatusForbidden, "Admin access required")
			return
		}
		next(w, r)
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (rec *statusRecorder) WriteHeader(code int) {
	rec.status = code
	rec.ResponseWriter.WriteHeader(code)
}

func (s *Server) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		s.log.Info("request", "method", r.Method, "path", r.URL.Path,
			"status", rec.status, "duration", time.Since(start).Round(time.Microsecond))
	})
}

func (s *Server) recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				s.log.Error("panic", "value", v, "stack", string(debug.Stack()))
				writeError(w, http.StatusInternalServerError, "Internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// --- JSON helpers -------------------------------------------------------------

const maxBody = 1 << 20

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError uses the {message} shape apps/web/src/shared/api/client.ts reads.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"message": msg})
}

func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	return decodeN(w, r, v, maxBody)
}

// decodeLarge is decode for the few endpoints that take big bodies (imports);
// the caller bounds the body itself.
func decodeLarge(w http.ResponseWriter, r *http.Request, v any) bool {
	return decodeN(w, r, v, 8<<20)
}

func decodeN(w http.ResponseWriter, r *http.Request, v any, limit int64) bool {
	dec := json.NewDecoder(io.LimitReader(r.Body, limit))
	if err := dec.Decode(v); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return false
	}
	return true
}

// fail maps store errors to HTTP responses; anything unexpected is logged
// and reported as a 500 without leaking details.
func (s *Server) fail(w http.ResponseWriter, r *http.Request, err error) {
	var invalid store.ErrInvalid
	var conflict store.ErrConflict
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeError(w, http.StatusNotFound, "Not found")
	case errors.As(err, &invalid):
		writeError(w, http.StatusBadRequest, invalid.Msg)
	case errors.As(err, &conflict):
		writeError(w, http.StatusConflict, conflict.Msg)
	case errors.Is(err, store.ErrBlocked):
		writeError(w, http.StatusForbidden, "This account is blocked. Contact the site operator.")
	case errors.Is(err, store.ErrBadCredentials):
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
	default:
		s.log.Error("request failed", "method", r.Method, "path", r.URL.Path, "err", err)
		writeError(w, http.StatusInternalServerError, "Internal server error")
	}
}

// pathID returns the {id} path value, answering 404 itself when it can't be
// a valid id.
func pathID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := r.PathValue("id")
	if !store.IsUUID(id) {
		writeError(w, http.StatusNotFound, "Not found")
		return "", false
	}
	return id, true
}

func locale(r *http.Request) string {
	return store.NormalizeLocale(r.URL.Query().Get("locale"))
}
