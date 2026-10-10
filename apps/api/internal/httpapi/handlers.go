package httpapi

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/markusmachel/csgrundlagen/apps/api/internal/store"
)

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if err := s.store.Ping(r.Context()); err != nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- auth ---------------------------------------------------------------------

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	token, user, err := s.store.Login(r.Context(), body.Email, body.Password, clientOf(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": user})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if token := bearerToken(r); token != "" {
		if err := s.store.Logout(r.Context(), token); err != nil {
			s.fail(w, r, err)
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, currentUser(r))
}

// signup creates a regular account and logs it in (same response as login).
func (s *Server) signup(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Locale   string `json:"locale"`
	}
	if !decode(w, r, &body) {
		return
	}
	token, user, err := s.store.SignUp(r.Context(), body.Name, body.Email, body.Password, body.Locale, clientOf(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"token": token, "user": user})
}

func (s *Server) changePassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.ChangePassword(r.Context(), currentUser(r).ID, bearerToken(r),
		body.CurrentPassword, body.NewPassword); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// requestPasswordReset always answers 202, whether or not the email has an
// account, so the endpoint can't be used to find out who is registered.
func (s *Server) requestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if !decode(w, r, &body) {
		return
	}
	token, user, err := s.store.CreatePasswordReset(r.Context(), body.Email)
	switch {
	case errors.Is(err, store.ErrNotFound):
		// fall through to the same response
	case err != nil:
		s.fail(w, r, err)
		return
	default:
		link := s.opts.BaseURL + "/reset-password?token=" + url.QueryEscape(token)
		msg := "Hi " + user.Name + ",\n\nOpen this link within an hour to choose a new password:\n" + link +
			"\n\nIf you didn't ask for this, ignore this email; your password stays the same."
		if err := s.opts.Mailer.Send(r.Context(), user.Email, "Reset your password", msg); err != nil {
			s.log.Error("send password reset", "err", err)
		}
	}
	writeJSON(w, http.StatusAccepted, map[string]string{
		"message": "If an account exists for that email, a reset link is on its way.",
	})
}

func (s *Server) confirmPasswordReset(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	if err := s.store.ResetPassword(r.Context(), body.Token, body.Password, clientOf(r)); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- questions ----------------------------------------------------------------

// intParam reads an integer query param, clamped to [lo, hi].
func intParam(r *http.Request, name string, def, lo, hi int) int {
	n, err := strconv.Atoi(r.URL.Query().Get(name))
	if err != nil {
		return def
	}
	return min(hi, max(lo, n))
}

func (s *Server) listQuestions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var tags []string
	for _, t := range q["tags"] {
		if t = strings.TrimSpace(t); t != "" {
			tags = append(tags, t)
		}
	}
	// ?ids=a,b,c fetches specific questions (e.g. a test's), in that order.
	var ids []string
	for _, part := range strings.Split(q.Get("ids"), ",") {
		if part = strings.TrimSpace(part); part != "" {
			if !store.IsUUID(part) {
				writeError(w, http.StatusBadRequest, "ids must be question ids")
				return
			}
			ids = append(ids, part)
		}
	}
	if len(ids) > 200 {
		writeError(w, http.StatusBadRequest, "at most 200 ids")
		return
	}
	var difficulties []string
	for _, d := range q["difficulty"] {
		if d == "easy" || d == "medium" || d == "hard" {
			difficulties = append(difficulties, d)
		}
	}
	f := store.QuestionFilter{
		Page:         intParam(r, "page", 1, 1, 1<<20),
		PageSize:     intParam(r, "pageSize", 10, 1, max(50, len(ids))),
		Tags:         tags,
		Difficulties: difficulties,
		Search:       strings.TrimSpace(q.Get("search")),
		IDs:          ids,
		Locale:       locale(r),
		Seed:         q.Get("seed"),
	}
	if sort := q.Get("sort"); sort == "newest" || sort == "random" {
		f.Sort = sort
	}
	// Status filters are per user; anonymous callers just get them ignored.
	switch status := q.Get("status"); status {
	case "unanswered", "answered", "wrong", "bookmarked":
		if u := s.optionalUser(r); u != nil {
			f.Status, f.UserID = status, u.ID
		}
	}
	page, err := s.store.ListQuestions(r.Context(), f)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (s *Server) getQuestion(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	q, err := s.store.GetQuestion(r.Context(), id, locale(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, q)
}

func (s *Server) dailyQuestion(w http.ResponseWriter, r *http.Request) {
	q, err := s.store.DailyQuestion(r.Context(), time.Now(), locale(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, q)
}

func (s *Server) weakQuestions(w http.ResponseWriter, r *http.Request) {
	qs, err := s.store.WeakQuestions(r.Context(), currentUser(r).ID, locale(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, qs)
}

func (s *Server) createQuestion(w http.ResponseWriter, r *http.Request) {
	var body store.NewQuestion
	if !decode(w, r, &body) {
		return
	}
	q, err := s.store.CreateQuestion(r.Context(), currentUser(r).ID, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, q)
}

func (s *Server) updateQuestion(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body store.NewQuestion
	if !decode(w, r, &body) {
		return
	}
	q, err := s.store.UpdateQuestion(r.Context(), id, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, q)
}

func (s *Server) deleteQuestion(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.DeleteQuestion(r.Context(), id); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) submitAnswer(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Answer any `json:"answer"`
	}
	if !decode(w, r, &body) {
		return
	}
	if !store.ValidAnswerShape(body.Answer) {
		writeError(w, http.StatusBadRequest, "answer must be an option id, a boolean, a list of option ids or text")
		return
	}
	res, err := s.store.SubmitAnswer(r.Context(), currentUser(r).ID, id, body.Answer)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (s *Server) questionStats(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	st, err := s.store.QuestionStats(r.Context(), id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func (s *Server) questionMaterials(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	ms, err := s.store.MaterialsForQuestion(r.Context(), id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ms)
}

// --- comments, notes, bookmarks, bug reports ------------------------------------

func (s *Server) listComments(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	cs, err := s.store.Comments(r.Context(), id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, cs)
}

func (s *Server) addComment(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Body string `json:"body"`
	}
	if !decode(w, r, &body) {
		return
	}
	c, err := s.store.AddComment(r.Context(), currentUser(r), id, body.Body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (s *Server) getNote(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	n, err := s.store.Note(r.Context(), currentUser(r).ID, id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, n) // null when the user has no note
}

func (s *Server) saveNote(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Body string `json:"body"`
	}
	if !decode(w, r, &body) {
		return
	}
	n, err := s.store.SaveNote(r.Context(), currentUser(r).ID, id, body.Body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, n)
}

func (s *Server) toggleBookmark(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	on, err := s.store.ToggleBookmark(r.Context(), currentUser(r).ID, id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"bookmarked": on})
}

func (s *Server) bookmarks(w http.ResponseWriter, r *http.Request) {
	qs, err := s.store.BookmarkedQuestions(r.Context(), currentUser(r).ID, locale(r))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, qs)
}

// reviewQueue returns the user's due spaced-repetition reviews, plus up to
// ?new=N unseen questions to start learning.
func (s *Server) reviewQueue(w http.ResponseWriter, r *http.Request) {
	q, err := s.store.ReviewQueue(r.Context(), currentUser(r).ID, locale(r),
		intParam(r, "limit", 20, 1, 100), intParam(r, "new", 0, 0, 50))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, q)
}

// progress takes ?tz= (an IANA zone like Europe/Berlin) so days follow the
// user's calendar; anything unknown falls back to UTC.
func (s *Server) progress(w http.ResponseWriter, r *http.Request) {
	loc, err := time.LoadLocation(r.URL.Query().Get("tz"))
	if err != nil {
		loc = time.UTC
	}
	p, err := s.store.UserProgress(r.Context(), currentUser(r).ID, loc)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (s *Server) addBugReport(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Message string `json:"message"`
	}
	if !decode(w, r, &body) {
		return
	}
	b, err := s.store.AddBugReport(r.Context(), currentUser(r).ID, id, body.Message)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, b)
}

// --- tags, search, materials, admin ---------------------------------------------

func (s *Server) tags(w http.ResponseWriter, r *http.Request) {
	tags, err := s.store.Tags(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, tags)
}

func (s *Server) search(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		writeJSON(w, http.StatusOK, store.SearchResults{
			Questions: []store.SearchResultItem{}, Materials: []store.SearchResultItem{}, Tests: []store.SearchResultItem{},
		})
		return
	}
	userID := ""
	if u := s.optionalUser(r); u != nil {
		userID = u.ID
	}
	res, err := s.store.Search(r.Context(), q, locale(r), userID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (s *Server) listMaterials(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	ms, err := s.store.Materials(r.Context(), q.Get("type"), q["tags"])
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ms)
}

func (s *Server) createMaterial(w http.ResponseWriter, r *http.Request) {
	var body store.NewMaterial
	if !decode(w, r, &body) {
		return
	}
	m, err := s.store.CreateMaterial(r.Context(), currentUser(r).ID, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, m)
}

func (s *Server) updateMaterial(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body store.NewMaterial
	if !decode(w, r, &body) {
		return
	}
	m, err := s.store.UpdateMaterial(r.Context(), id, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (s *Server) deleteMaterial(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.DeleteMaterial(r.Context(), id); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) listBugReports(w http.ResponseWriter, r *http.Request) {
	rs, err := s.store.BugReports(r.Context(), r.URL.Query().Get("status"))
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, rs)
}

func (s *Server) setBugReportStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if !decode(w, r, &body) {
		return
	}
	rep, err := s.store.SetBugReportStatus(r.Context(), id, body.Status)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, rep)
}

func (s *Server) adminStats(w http.ResponseWriter, r *http.Request) {
	st, err := s.store.AdminStats(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, st)
}

// --- custom tests ---------------------------------------------------------------

func (s *Server) listTests(w http.ResponseWriter, r *http.Request) {
	ts, err := s.store.Tests(r.Context(), currentUser(r).ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ts)
}

func (s *Server) createTest(w http.ResponseWriter, r *http.Request) {
	var body store.NewTest
	if !decode(w, r, &body) {
		return
	}
	t, err := s.store.CreateTest(r.Context(), currentUser(r).ID, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (s *Server) getTest(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	t, err := s.store.Test(r.Context(), id, currentUser(r).ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) deleteTest(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.DeleteTest(r.Context(), id, currentUser(r).ID); err != nil {
		s.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) listAttempts(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	as, err := s.store.Attempts(r.Context(), id, currentUser(r).ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, as)
}

func (s *Server) submitTest(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var body store.SubmitTest
	if !decode(w, r, &body) {
		return
	}
	res, err := s.store.SubmitTest(r.Context(), id, currentUser(r).ID, body)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}
