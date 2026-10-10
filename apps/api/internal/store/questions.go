package store

import (
	"context"
	"fmt"
	"hash/fnv"
	"slices"
	"sort"
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
                 WHERE qt.question_id = q.id), '{}'),
       q.code, q.code_language, q.expected_output, q.design
FROM questions q
LEFT JOIN question_translations tr ON tr.question_id = q.id AND tr.locale = $1::locale`

func scanQuestions(rows pgx.Rows) ([]Question, error) {
	defer rows.Close()
	var out []Question
	for rows.Next() {
		var q Question
		if err := rows.Scan(&q.ID, &q.Type, &q.Prompt, &q.Difficulty, &q.Explanation,
			&q.CorrectAnswer, &q.Tags, &q.Code, &q.CodeLanguage, &q.ExpectedOutput, &q.Design); err != nil {
			return nil, err
		}
		out = append(out, q)
	}
	return out, rows.Err()
}

// attachOptions loads the (localized) options for every question in qs that
// has them, and sets the type's answer key: CorrectOptionID (multiple
// choice), CorrectOptionIDs (multi-select) or CorrectOrder (ordering).
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
		SELECT o.question_id, o.option_key, COALESCE(ot.label, o.label), o.is_correct, o.correct_position
		FROM question_options o
		LEFT JOIN question_option_translations ot
		       ON ot.option_id = o.id AND ot.locale = $1::locale
		WHERE o.question_id = ANY($2::uuid[])
		ORDER BY o.question_id, o.option_key`, locale, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	positions := map[string]map[string]int{} // question -> option key -> correct position
	for rows.Next() {
		var qid, key, label string
		var correct bool
		var pos *int
		if err := rows.Scan(&qid, &key, &label, &correct, &pos); err != nil {
			return err
		}
		q := byID[qid]
		q.Options = append(q.Options, Option{ID: key, Label: label})
		switch {
		case q.Type == "multiple-choice" && correct:
			k := key
			q.CorrectOptionID = &k
		case q.Type == "multi-select" && correct:
			q.CorrectOptionIDs = append(q.CorrectOptionIDs, key)
		case q.Type == "ordering" && pos != nil:
			if positions[qid] == nil {
				positions[qid] = map[string]int{}
			}
			positions[qid][key] = *pos
			q.CorrectOrder = append(q.CorrectOrder, key)
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for qid, pos := range positions {
		order := byID[qid].CorrectOrder
		sort.Slice(order, func(i, j int) bool { return pos[order[i]] < pos[order[j]] })
	}
	return nil
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
	Page     int
	PageSize int
	// IDs restricts the list to these questions, returned in this order.
	IDs          []string
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
	// Type "design" lists only system design challenges; otherwise they are
	// left out (they have their own section).
	Type string
}

func (s *Store) ListQuestions(ctx context.Context, f QuestionFilter) (QuestionsPage, error) {
	var where []string
	args := []any{} // $1 is reserved for the locale
	next := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args)+1)
	}
	if f.Type == "design" {
		where = append(where, `q.type = 'design'`)
	} else if len(f.IDs) == 0 {
		where = append(where, `q.type <> 'design'`)
	}
	idsParam := ""
	if len(f.IDs) > 0 {
		idsParam = next(f.IDs)
		where = append(where, `q.id = ANY(`+idsParam+`::uuid[])`)
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
	if idsParam != "" {
		order = `array_position(` + idsParam + `::uuid[], q.id)`
	}
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
	// design challenges need the drawing board, so they're never the daily question
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM questions WHERE type <> 'design'`).Scan(&count); err != nil {
		return Question{}, err
	}
	if count == 0 {
		return Question{}, ErrNotFound
	}
	h := fnv.New32a()
	_, _ = h.Write([]byte(day.UTC().Format("2006-01-02")))
	offset := int(h.Sum32() % uint32(count))

	qs, err := s.queryQuestions(ctx, locale, questionSelect+` WHERE q.type <> 'design' ORDER BY q.created_at, q.id LIMIT 1 OFFSET $2`, offset)
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

// SubmitAnswer records a standalone (feed) answer and reports correctness.
// MaxOfflineAge is how far back an answer synced after being given offline
// may be dated; anything older is recorded as given now.
const MaxOfflineAge = 30 * 24 * time.Hour

// answerTime is when an answer counts as given: the client's time for an
// offline answer if plausible, otherwise now.
func answerTime(at *time.Time, now time.Time) time.Time {
	if at == nil || at.After(now) || now.Sub(*at) > MaxOfflineAge {
		return now
	}
	return *at
}

func (s *Store) SubmitAnswer(ctx context.Context, userID, questionID string, answer any, answeredAt *time.Time) (SubmitAnswerResult, error) {
	q, err := s.GetQuestion(ctx, questionID, "en")
	if err != nil {
		return SubmitAnswerResult{}, err
	}
	correct := isCorrect(q, answer)
	at := answerTime(answeredAt, time.Now())
	var next time.Time
	err = s.withTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `
			INSERT INTO question_answers (user_id, question_id, answer_value, is_correct, answered_at)
			VALUES ($1, $2, $3, $4, $5)`, userID, questionID, AnswerKey(answer), correct, at); err != nil {
			return err
		}
		next, err = recordReview(ctx, tx, userID, questionID, correct, at)
		return err
	})
	if err != nil {
		return SubmitAnswerResult{}, err
	}
	feedback, err := s.feedbackFor(ctx, q, answer)
	if err != nil {
		return SubmitAnswerResult{}, err
	}
	result := SubmitAnswerResult{QuestionID: q.ID, Correct: correct, CorrectAnswer: q.Correct(), NextReviewAt: &next,
		Feedback: feedback}
	if g, ok := designGraphOf(answer); ok && q.Design != nil {
		d := GradeDesign(*q.Design, g)
		result.Design = &d
	}
	return result, nil
}

// QuestionStats summarizes everyone's answers to a question: how often each
// option was picked (multiple choice, multi-select, true/false) or how many
// answers were right (ordering, output).
func (s *Store) QuestionStats(ctx context.Context, questionID string) (QuestionStats, error) {
	q, err := s.GetQuestion(ctx, questionID, "en")
	if err != nil {
		return QuestionStats{}, err
	}
	counts := map[string]int{}
	var total, right int
	rows, err := s.pool.Query(ctx, `
		SELECT answer_value, is_correct, count(*) FROM question_answers
		WHERE question_id = $1 GROUP BY answer_value, is_correct`, questionID)
	if err != nil {
		return QuestionStats{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var k string
		var ok bool
		var n int
		if err := rows.Scan(&k, &ok, &n); err != nil {
			return QuestionStats{}, err
		}
		total += n
		if ok {
			right += n
		}
		if q.Type == "multi-select" {
			for _, id := range strings.Split(k, ",") { // "A,C" counts for A and for C
				counts[id] += n
			}
		} else {
			counts[k] += n
		}
	}
	if err := rows.Err(); err != nil {
		return QuestionStats{}, err
	}

	var dist []AnswerStat
	switch q.Type {
	case "multiple-choice", "multi-select":
		for _, o := range q.Options {
			dist = append(dist, AnswerStat{OptionID: o.ID, Label: o.ID, Count: counts[o.ID]})
		}
	case "true-false":
		dist = []AnswerStat{
			{OptionID: "true", Label: "True", Count: counts["true"]},
			{OptionID: "false", Label: "False", Count: counts["false"]},
		}
	case "flashcard":
		dist = []AnswerStat{
			{OptionID: "true", Label: "Knew it", Count: counts["true"]},
			{OptionID: "false", Label: "Didn't", Count: counts["false"]},
		}
	default: // ordering, output: answers are too varied to list, so right vs wrong
		dist = []AnswerStat{
			{OptionID: "correct", Label: "Correct", Count: right},
			{OptionID: "incorrect", Label: "Incorrect", Count: total - right},
		}
	}
	// Percent of answers that picked each option. For multi-select one answer
	// picks several options, so these add up to more than 100.
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

// NewQuestion is the create/update payload. Which answer fields apply depends
// on Type; for ordering, Options are given in the correct order.
type NewQuestion struct {
	Type               string      `json:"type"`
	Prompt             string      `json:"prompt"`
	Tags               []string    `json:"tags"`
	Difficulty         *string     `json:"difficulty"`
	Explanation        string      `json:"explanation"`
	Options            []Option    `json:"options"`
	CorrectOptionID    *string     `json:"correctOptionId"`
	CorrectOptionIDs   []string    `json:"correctOptionIds"`
	CorrectAnswer      *bool       `json:"correctAnswer"`
	Code               *string     `json:"code"`
	CodeLanguage       *string     `json:"codeLanguage"`
	ExpectedOutput     *string     `json:"expectedOutput"`
	Design             *DesignSpec `json:"design,omitempty"`
	RelatedMaterialIDs []string    `json:"relatedMaterialIds"`
}

func (n NewQuestion) validate() error {
	if strings.TrimSpace(n.Prompt) == "" || strings.TrimSpace(n.Explanation) == "" {
		return ErrInvalid{"prompt and explanation are required"}
	}
	if len(n.Tags) == 0 {
		return ErrInvalid{"at least one tag is required"}
	}
	for _, o := range n.Options {
		if o.Feedback != nil && len(*o.Feedback) > maxFeedbackLen {
			return ErrInvalid{"option feedback is limited to 2000 characters"}
		}
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
	seen := map[string]bool{}
	if HasOptions(n.Type) {
		if len(n.Options) < 2 || len(n.Options) > 5 {
			return ErrInvalid{"questions with options need 2 to 5 of them"}
		}
		for _, o := range n.Options {
			if len(o.ID) != 1 || o.ID < "A" || o.ID > "E" || seen[o.ID] {
				return ErrInvalid{"option ids must be unique letters A–E"}
			}
			if strings.TrimSpace(o.Label) == "" {
				return ErrInvalid{"option labels cannot be empty"}
			}
			seen[o.ID] = true
		}
	}
	switch n.Type {
	case "multiple-choice":
		if n.CorrectOptionID == nil || !seen[*n.CorrectOptionID] {
			return ErrInvalid{"correctOptionId must match one of the options"}
		}
	case "multi-select":
		if len(n.CorrectOptionIDs) == 0 {
			return ErrInvalid{"multi-select questions need at least one correct option"}
		}
		picked := map[string]bool{}
		for _, id := range n.CorrectOptionIDs {
			if !seen[id] || picked[id] {
				return ErrInvalid{"correctOptionIds must be distinct options of the question"}
			}
			picked[id] = true
		}
	case "ordering":
		// the options' order is the answer; nothing else to check
	case "true-false":
		if n.CorrectAnswer == nil {
			return ErrInvalid{"true-false questions need correctAnswer"}
		}
	case "output":
		if n.Code == nil || strings.TrimSpace(*n.Code) == "" {
			return ErrInvalid{"output questions need the code to predict"}
		}
		if n.CodeLanguage == nil || strings.TrimSpace(*n.CodeLanguage) == "" || len(*n.CodeLanguage) > 20 {
			return ErrInvalid{"output questions need a codeLanguage such as js or go"}
		}
		if n.ExpectedOutput == nil {
			return ErrInvalid{"output questions need expectedOutput"}
		}
	case "design":
		return n.Design.validate()
	case "flashcard":
		// front and back are prompt and explanation, checked above
	default:
		return ErrInvalid{"type must be multiple-choice, true-false, multi-select, ordering, output, flashcard or design"}
	}
	return nil
}

// outputFields returns code, language and expected output for output
// questions and nils otherwise, matching the table's check constraint.
func (n NewQuestion) outputFields() (*string, *string, *string) {
	if n.Type != "output" {
		return nil, nil, nil
	}
	return n.Code, n.CodeLanguage, n.ExpectedOutput
}

// CreateQuestion inserts a question with its options and tags, and links it
// to any existing materials in RelatedMaterialIDs.
func (s *Store) CreateQuestion(ctx context.Context, createdBy string, n NewQuestion) (Question, error) {
	if err := n.validate(); err != nil {
		return Question{}, err
	}
	var id string
	err := s.withTx(ctx, func(tx pgx.Tx) error {
		code, lang, expected := n.outputFields()
		if err := tx.QueryRow(ctx, `
			INSERT INTO questions (type, prompt, difficulty, explanation, correct_answer, created_by,
			                       code, code_language, expected_output, design)
			VALUES ($1::question_type, $2, $3::question_difficulty, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id`,
			n.Type, n.Prompt, n.Difficulty, n.Explanation, n.trueFalseAnswer(), nullIfEmpty(createdBy),
			code, lang, expected, n.designSpec(),
		).Scan(&id); err != nil {
			return err
		}
		if err := writeQuestionParts(ctx, tx, id, n); err != nil {
			return err
		}
		return recordRevision(ctx, tx, id, createdBy, "created", revisionSnapshot{NewQuestion: n})
	})
	if err != nil {
		return Question{}, err
	}
	return s.GetQuestion(ctx, id, "en")
}

// UpdateQuestion replaces a question's content, options, tags and material
// links. Answers, stats, notes and comments are kept. Option translations are
// dropped with the old options, since the options themselves may have changed.
func (s *Store) UpdateQuestion(ctx context.Context, editorID, id string, n NewQuestion) (Question, error) {
	return s.saveQuestion(ctx, editorID, id, n, "edited", nil)
}

// saveQuestion applies new content and records it as a revision.
func (s *Store) saveQuestion(ctx context.Context, editorID, id string, n NewQuestion, kind string, restoredFrom *int64) (Question, error) {
	if err := n.validate(); err != nil {
		return Question{}, err
	}
	// The state before the first recorded edit, so it can still be restored.
	before, err := s.currentInput(ctx, id)
	if err != nil {
		return Question{}, err
	}
	err = s.withTx(ctx, func(tx pgx.Tx) error {
		had, err := hasRevisions(ctx, tx, id)
		if err != nil {
			return err
		}
		if !had {
			if err := recordRevision(ctx, tx, id, "", "original", revisionSnapshot{NewQuestion: before}); err != nil {
				return err
			}
		}
		code, lang, expected := n.outputFields()
		tag, err := tx.Exec(ctx, `
			UPDATE questions
			SET type = $2::question_type, prompt = $3, difficulty = $4::question_difficulty,
			    explanation = $5, correct_answer = $6,
			    code = $7, code_language = $8, expected_output = $9, design = $10
			WHERE id = $1`,
			id, n.Type, n.Prompt, n.Difficulty, n.Explanation, n.trueFalseAnswer(), code, lang, expected,
			n.designSpec())
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return ErrNotFound
		}
		for _, table := range []string{"question_options", "question_tags", "material_questions"} {
			if _, err := tx.Exec(ctx, `DELETE FROM `+table+` WHERE question_id = $1`, id); err != nil {
				return err
			}
		}
		if err := writeQuestionParts(ctx, tx, id, n); err != nil {
			return err
		}
		return recordRevision(ctx, tx, id, editorID, kind, revisionSnapshot{NewQuestion: n, RestoredFrom: restoredFrom})
	})
	if err != nil {
		return Question{}, err
	}
	return s.GetQuestion(ctx, id, "en")
}

// DeleteQuestion removes a question and everything attached to it (answers,
// bookmarks, notes, comments, bug reports, test membership) by cascade.
func (s *Store) DeleteQuestion(ctx context.Context, id string) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM questions WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// designSpec is the design for design questions and nil otherwise.
func (n NewQuestion) designSpec() *DesignSpec {
	if n.Type != "design" {
		return nil
	}
	return n.Design
}

func (n NewQuestion) trueFalseAnswer() *bool {
	if n.Type == "true-false" {
		return n.CorrectAnswer
	}
	return nil
}

// writeQuestionParts inserts a question's options, tags and material links.
func writeQuestionParts(ctx context.Context, tx pgx.Tx, id string, n NewQuestion) error {
	if HasOptions(n.Type) {
		for i, o := range n.Options {
			correct := (n.Type == "multiple-choice" && o.ID == *n.CorrectOptionID) ||
				(n.Type == "multi-select" && slices.Contains(n.CorrectOptionIDs, o.ID))
			var position *int
			if n.Type == "ordering" {
				position = &i
			}
			// feedback is for wrong options only
			feedback, material := cleanFeedback(o.Feedback), o.MaterialID
			if correct || n.Type == "ordering" {
				feedback, material = nil, nil
			}
			if material != nil && *material == "" {
				material = nil
			}
			if _, err := tx.Exec(ctx, `
				INSERT INTO question_options (question_id, option_key, label, is_correct, correct_position,
				                              feedback, material_id)
				VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM materials WHERE id::text = $7))`,
				id, o.ID, o.Label, correct, position, feedback, material); err != nil {
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
}
