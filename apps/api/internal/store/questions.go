package store

import (
	"context"
	"fmt"
	"hash/fnv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// questionSelect is the localized base projection. $1 must be the locale;
// English content lives on the row, other locales override via translations.
const questionSelect = `
SELECT q.id, q.type::text, COALESCE(tr.prompt, q.prompt), q.difficulty::text,
       COALESCE(tr.explanation, q.explanation), q.correct_answer,
       COALESCE((SELECT array_agg(t.name ORDER BY t.name)
                 FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
                 WHERE qt.question_id = q.id), '{}')
FROM questions q
LEFT JOIN question_translations tr ON tr.question_id = q.id AND tr.locale = $1::locale`

func scanQuestions(rows pgx.Rows) ([]Question, error) {
	defer rows.Close()
	var out []Question
	for rows.Next() {
		var q Question
		if err := rows.Scan(&q.ID, &q.Type, &q.Prompt, &q.Difficulty, &q.Explanation,
			&q.CorrectAnswer, &q.Tags); err != nil {
			return nil, err
		}
		out = append(out, q)
	}
	return out, rows.Err()
}

// attachOptions loads the (localized) options for every multiple-choice
// question in qs and sets Options / CorrectOptionID.
func (s *Store) attachOptions(ctx context.Context, locale string, qs []Question) error {
	if len(qs) == 0 {
		return nil
	}
	ids := make([]string, len(qs))
	byID := make(map[string]*Question, len(qs))
	for i := range qs {
		ids[i] = qs[i].ID
		byID[qs[i].ID] = &qs[i]
	}
	rows, err := s.pool.Query(ctx, `
		SELECT o.question_id, o.option_key, COALESCE(ot.label, o.label), o.is_correct
		FROM question_options o
		LEFT JOIN question_option_translations ot
		       ON ot.option_id = o.id AND ot.locale = $1::locale
		WHERE o.question_id = ANY($2::uuid[])
		ORDER BY o.question_id, o.option_key`, locale, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var qid, key, label string
		var correct bool
		if err := rows.Scan(&qid, &key, &label, &correct); err != nil {
			return err
		}
		q := byID[qid]
		q.Options = append(q.Options, Option{ID: key, Label: label})
		if correct {
			k := key
			q.CorrectOptionID = &k
		}
	}
	return rows.Err()
}

func (s *Store) queryQuestions(ctx context.Context, locale, sql string, args ...any) ([]Question, error) {
	rows, err := s.pool.Query(ctx, sql, append([]any{locale}, args...)...)
	if err != nil {
		return nil, err
	}
	qs, err := scanQuestions(rows)
	if err != nil {
		return nil, err
	}
	if err := s.attachOptions(ctx, locale, qs); err != nil {
		return nil, err
	}
	return nonNil(qs), nil
}

type QuestionFilter struct {
	Page         int
	PageSize     int
	Tags         []string // match any
	Difficulties []string // match any of easy, medium, hard
	Search       string
	Locale       string
	// Status is per user and needs UserID: "unanswered", "answered",
	// "wrong" (answered incorrectly at least once) or "bookmarked".
	Status string
	UserID string
	// Sort is "oldest" (default), "newest" or "random"; random is stable
	// for a given Seed so paging doesn't reshuffle.
	Sort string
	Seed string
}

func (s *Store) ListQuestions(ctx context.Context, f QuestionFilter) (QuestionsPage, error) {
	var where []string
	args := []any{} // $1 is reserved for the locale
	next := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args)+1)
	}
	if len(f.Tags) > 0 {
		where = append(where, `EXISTS (SELECT 1 FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
			WHERE qt.question_id = q.id AND t.name = ANY(`+next(f.Tags)+`::text[]))`)
	}
	if len(f.Difficulties) > 0 {
		where = append(where, `q.difficulty::text = ANY(`+next(f.Difficulties)+`::text[])`)
	}
	if f.Search != "" {
		p := next(likePattern(f.Search))
		where = append(where, `(COALESCE(tr.prompt, q.prompt) ILIKE `+p+` OR EXISTS (
			SELECT 1 FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
			WHERE qt.question_id = q.id AND t.name ILIKE `+p+`))`)
	}
	if f.UserID != "" {
		answered := func(extra string) string {
			return `EXISTS (SELECT 1 FROM question_answers a
				WHERE a.question_id = q.id AND a.user_id = ` + next(f.UserID) + `::uuid` + extra + `)`
		}
		switch f.Status {
		case "unanswered":
			where = append(where, "NOT "+answered(""))
		case "answered":
			where = append(where, answered(""))
		case "wrong":
			where = append(where, answered(" AND NOT a.is_correct"))
		case "bookmarked":
			where = append(where, `EXISTS (SELECT 1 FROM bookmarks b
				WHERE b.question_id = q.id AND b.user_id = `+next(f.UserID)+`::uuid)`)
		}
	}
	cond := ""
	if len(where) > 0 {
		cond = " WHERE " + strings.Join(where, " AND ")
	}

	var total int
	countSQL := `SELECT count(*) FROM questions q
		LEFT JOIN question_translations tr ON tr.question_id = q.id AND tr.locale = $1::locale` + cond
	if err := s.pool.QueryRow(ctx, countSQL, append([]any{f.Locale}, args...)...).Scan(&total); err != nil {
		return QuestionsPage{}, err
	}

	order := `q.created_at, q.id`
	switch f.Sort {
	case "newest":
		order = `q.created_at DESC, q.id DESC`
	case "random":
		order = `md5(q.id::text || ` + next(f.Seed) + `::text), q.id`
	}
	limit, offset := next(f.PageSize), next((f.Page-1)*f.PageSize)
	items, err := s.queryQuestions(ctx, f.Locale,
		questionSelect+cond+` ORDER BY `+order+` LIMIT `+limit+` OFFSET `+offset, args...)
	if err != nil {
		return QuestionsPage{}, err
	}

	totalPages := (total + f.PageSize - 1) / f.PageSize
	if totalPages < 1 {
		totalPages = 1
	}
	return QuestionsPage{Items: items, Page: f.Page, PageSize: f.PageSize, Total: total, TotalPages: totalPages}, nil
}

func (s *Store) GetQuestion(ctx context.Context, id, locale string) (Question, error) {
	qs, err := s.queryQuestions(ctx, locale, questionSelect+` WHERE q.id = $2`, id)
	if err != nil {
		return Question{}, err
	}
	if len(qs) == 0 {
		return Question{}, ErrNotFound
	}
	return qs[0], nil
}

// QuestionsByIDs returns the questions in the order of ids, skipping unknown ids.
func (s *Store) QuestionsByIDs(ctx context.Context, ids []string, locale string) ([]Question, error) {
	qs, err := s.queryQuestions(ctx, locale, questionSelect+` WHERE q.id = ANY($2::uuid[])`, ids)
	if err != nil {
		return nil, err
	}
	byID := make(map[string]Question, len(qs))
	for _, q := range qs {
		byID[q.ID] = q
	}
	out := make([]Question, 0, len(ids))
	for _, id := range ids {
		if q, ok := byID[id]; ok {
			out = append(out, q)
		}
	}
	return out, nil
}

// DailyQuestion picks a question deterministically from the calendar date,
// so it stays the same across refreshes for the whole day.
func (s *Store) DailyQuestion(ctx context.Context, day time.Time, locale string) (Question, error) {
	var count int
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM questions`).Scan(&count); err != nil {
		return Question{}, err
	}
	if count == 0 {
		return Question{}, ErrNotFound
	}
	h := fnv.New32a()
	_, _ = h.Write([]byte(day.UTC().Format("2006-01-02")))
	offset := int(h.Sum32() % uint32(count))

	qs, err := s.queryQuestions(ctx, locale, questionSelect+` ORDER BY q.created_at, q.id LIMIT 1 OFFSET $2`, offset)
	if err != nil {
		return Question{}, err
	}
	if len(qs) == 0 {
		return Question{}, ErrNotFound
	}
	return qs[0], nil
}

func (s *Store) WeakQuestions(ctx context.Context, userID, locale string) ([]Question, error) {
	return s.queryQuestions(ctx, locale, questionSelect+`
		JOIN weak_spots w ON w.question_id = q.id AND w.user_id = $2
		ORDER BY w.last_answered_at DESC`, userID)
}

func (s *Store) BookmarkedQuestions(ctx context.Context, userID, locale string) ([]Question, error) {
	return s.queryQuestions(ctx, locale, questionSelect+`
		JOIN bookmarks b ON b.question_id = q.id AND b.user_id = $2
		ORDER BY b.created_at DESC`, userID)
}

// AnswerKey encodes a submitted answer the way question_answers stores it:
// the option key for multiple choice, "true"/"false" for true/false.
func AnswerKey(v any) string {
	switch a := v.(type) {
	case bool:
		if a {
			return "true"
		}
		return "false"
	case string:
		return a
	default:
		return "unanswered"
	}
}

func isCorrect(q Question, given any) bool {
	if given == nil {
		return false
	}
	return given == q.Correct()
}

// SubmitAnswer records a standalone (feed) answer and reports correctness.
func (s *Store) SubmitAnswer(ctx context.Context, userID, questionID string, answer any) (SubmitAnswerResult, error) {
	q, err := s.GetQuestion(ctx, questionID, "en")
	if err != nil {
		return SubmitAnswerResult{}, err
	}
	correct := isCorrect(q, answer)
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO question_answers (user_id, question_id, answer_value, is_correct)
		VALUES ($1, $2, $3, $4)`, userID, questionID, AnswerKey(answer), correct); err != nil {
		return SubmitAnswerResult{}, err
	}
	return SubmitAnswerResult{QuestionID: q.ID, Correct: correct, CorrectAnswer: q.Correct()}, nil
}

func (s *Store) QuestionStats(ctx context.Context, questionID string) (QuestionStats, error) {
	q, err := s.GetQuestion(ctx, questionID, "en")
	if err != nil {
		return QuestionStats{}, err
	}
	counts := map[string]int{}
	rows, err := s.pool.Query(ctx, `
		SELECT answer_value, count(*) FROM question_answers
		WHERE question_id = $1 GROUP BY answer_value`, questionID)
	if err != nil {
		return QuestionStats{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var k string
		var n int
		if err := rows.Scan(&k, &n); err != nil {
			return QuestionStats{}, err
		}
		counts[k] = n
	}
	if err := rows.Err(); err != nil {
		return QuestionStats{}, err
	}

	var dist []AnswerStat
	if q.Type == "multiple-choice" {
		for _, o := range q.Options {
			dist = append(dist, AnswerStat{OptionID: o.ID, Label: o.ID, Count: counts[o.ID]})
		}
	} else {
		dist = []AnswerStat{
			{OptionID: "true", Label: "True", Count: counts["true"]},
			{OptionID: "false", Label: "False", Count: counts["false"]},
		}
	}
	total := 0
	for _, d := range dist {
		total += d.Count
	}
	for i := range dist {
		if total > 0 {
			dist[i].Percentage = float64(int(float64(dist[i].Count)/float64(total)*1000+0.5)) / 10
		}
	}
	return QuestionStats{QuestionID: q.ID, TotalResponses: total, Distribution: nonNil(dist)}, nil
}

func (s *Store) Tags(ctx context.Context) ([]string, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT t.name FROM tags t
		JOIN question_tags qt ON qt.tag_id = t.id
		ORDER BY t.name`)
	if err != nil {
		return nil, err
	}
	tags, err := pgx.CollectRows(rows, pgx.RowTo[string])
	return nonNil(tags), err
}

type NewQuestion struct {
	Type               string   `json:"type"`
	Prompt             string   `json:"prompt"`
	Tags               []string `json:"tags"`
	Difficulty         *string  `json:"difficulty"`
	Explanation        string   `json:"explanation"`
	Options            []Option `json:"options"`
	CorrectOptionID    *string  `json:"correctOptionId"`
	CorrectAnswer      *bool    `json:"correctAnswer"`
	RelatedMaterialIDs []string `json:"relatedMaterialIds"`
}

func (n NewQuestion) validate() error {
	if strings.TrimSpace(n.Prompt) == "" || strings.TrimSpace(n.Explanation) == "" {
		return ErrInvalid{"prompt and explanation are required"}
	}
	if len(n.Tags) == 0 {
		return ErrInvalid{"at least one tag is required"}
	}
	if n.Difficulty != nil {
		switch *n.Difficulty {
		case "easy", "medium", "hard":
		default:
			return ErrInvalid{"difficulty must be easy, medium or hard"}
		}
	}
	for _, id := range n.RelatedMaterialIDs {
		if !IsUUID(id) {
			return ErrInvalid{"relatedMaterialIds contains an invalid id"}
		}
	}
	switch n.Type {
	case "multiple-choice":
		if len(n.Options) < 2 || len(n.Options) > 5 {
			return ErrInvalid{"multiple-choice questions need 2 to 5 options"}
		}
		seen := map[string]bool{}
		for _, o := range n.Options {
			if len(o.ID) != 1 || o.ID < "A" || o.ID > "E" || seen[o.ID] {
				return ErrInvalid{"option ids must be unique letters A–E"}
			}
			if strings.TrimSpace(o.Label) == "" {
				return ErrInvalid{"option labels cannot be empty"}
			}
			seen[o.ID] = true
		}
		if n.CorrectOptionID == nil || !seen[*n.CorrectOptionID] {
			return ErrInvalid{"correctOptionId must match one of the options"}
		}
	case "true-false":
		if n.CorrectAnswer == nil {
			return ErrInvalid{"true-false questions need correctAnswer"}
		}
	default:
		return ErrInvalid{"type must be multiple-choice or true-false"}
	}
	return nil
}

// CreateQuestion inserts a question with its options and tags, and links it
// to any existing materials in RelatedMaterialIDs.
func (s *Store) CreateQuestion(ctx context.Context, createdBy string, n NewQuestion) (Question, error) {
	if err := n.validate(); err != nil {
		return Question{}, err
	}
	var id string
	err := s.withTx(ctx, func(tx pgx.Tx) error {
		var correctAnswer *bool
		if n.Type == "true-false" {
			correctAnswer = n.CorrectAnswer
		}
		if err := tx.QueryRow(ctx, `
			INSERT INTO questions (type, prompt, difficulty, explanation, correct_answer, created_by)
			VALUES ($1::question_type, $2, $3::question_difficulty, $4, $5, $6)
			RETURNING id`,
			n.Type, n.Prompt, n.Difficulty, n.Explanation, correctAnswer, nullIfEmpty(createdBy),
		).Scan(&id); err != nil {
			return err
		}
		if n.Type == "multiple-choice" {
			for _, o := range n.Options {
				if _, err := tx.Exec(ctx, `
					INSERT INTO question_options (question_id, option_key, label, is_correct)
					VALUES ($1, $2, $3, $4)`, id, o.ID, o.Label, o.ID == *n.CorrectOptionID); err != nil {
					return err
				}
			}
		}
		if err := ensureTags(ctx, tx, n.Tags); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO question_tags (question_id, tag_id)
			SELECT $1, id FROM tags WHERE name = ANY($2::text[])`, id, n.Tags); err != nil {
			return err
		}
		if len(n.RelatedMaterialIDs) > 0 {
			if _, err := tx.Exec(ctx, `
				INSERT INTO material_questions (material_id, question_id)
				SELECT m.id, $1 FROM materials m WHERE m.id = ANY($2::uuid[])
				ON CONFLICT DO NOTHING`, id, n.RelatedMaterialIDs); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return Question{}, err
	}
	return s.GetQuestion(ctx, id, "en")
}
