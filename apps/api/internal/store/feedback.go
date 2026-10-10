package store

import (
	"context"
	"slices"
	"strings"
)

// OptionFeedback is shown after someone picks a wrong option.
type OptionFeedback struct {
	OptionID string    `json:"optionId"`
	Text     *string   `json:"text,omitempty"`
	Material *Material `json:"material,omitempty"`
}

// maxFeedbackLen keeps a feedback note to a short explanation.
const maxFeedbackLen = 2000

func cleanFeedback(f *string) *string {
	if f == nil {
		return nil
	}
	v := strings.TrimSpace(*f)
	if v == "" {
		return nil
	}
	return &v
}

// wrongPicks returns the option keys in an answer that are wrong.
func wrongPicks(q Question, answer any) []string {
	switch q.Type {
	case "multiple-choice":
		if key, ok := answer.(string); ok && (q.CorrectOptionID == nil || key != *q.CorrectOptionID) {
			return []string{key}
		}
	case "multi-select":
		picked, _ := stringList(answer)
		var wrong []string
		for _, key := range picked {
			if !slices.Contains(q.CorrectOptionIDs, key) {
				wrong = append(wrong, key)
			}
		}
		return wrong
	}
	return nil
}

// feedbackFor loads the feedback for the wrong options someone picked.
func (s *Store) feedbackFor(ctx context.Context, q Question, answer any) ([]OptionFeedback, error) {
	keys := wrongPicks(q, answer)
	if len(keys) == 0 {
		return nil, nil
	}
	rows, err := s.pool.Query(ctx, `
		SELECT o.option_key, o.feedback, m.id, m.type::text, m.title, m.url, m.author, m.description
		FROM question_options o LEFT JOIN materials m ON m.id = o.material_id
		WHERE o.question_id = $1 AND o.option_key = ANY($2)
		  AND (o.feedback IS NOT NULL OR o.material_id IS NOT NULL)
		ORDER BY o.option_key`, q.ID, keys)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []OptionFeedback
	for rows.Next() {
		var f OptionFeedback
		var mID, mType, mTitle, mURL *string
		var mAuthor, mDesc *string
		if err := rows.Scan(&f.OptionID, &f.Text, &mID, &mType, &mTitle, &mURL, &mAuthor, &mDesc); err != nil {
			return nil, err
		}
		if mID != nil {
			f.Material = &Material{ID: *mID, Type: *mType, Title: *mTitle, URL: *mURL, Author: mAuthor,
				Description: mDesc, Tags: []string{}}
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

// withOptionFeedback adds the stored feedback to an authoring snapshot's options.
func (s *Store) withOptionFeedback(ctx context.Context, questionID string, n *NewQuestion) error {
	rows, err := s.pool.Query(ctx, `
		SELECT option_key, feedback, material_id::text FROM question_options WHERE question_id = $1`, questionID)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var key string
		var feedback, material *string
		if err := rows.Scan(&key, &feedback, &material); err != nil {
			return err
		}
		for i := range n.Options {
			if n.Options[i].ID == key {
				n.Options[i].Feedback, n.Options[i].MaterialID = feedback, material
			}
		}
	}
	return rows.Err()
}

// QuestionInput returns a question in the admin form's shape, including the
// option feedback that the public question leaves out.
func (s *Store) QuestionInput(ctx context.Context, id string) (NewQuestion, error) {
	return s.currentInput(ctx, id)
}
