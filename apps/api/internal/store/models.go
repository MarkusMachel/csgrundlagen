// Package store holds the domain models and every SQL query the API runs.
// JSON field names match the frontend types in apps/web/src/features/*/types.ts
// exactly, so the web app can switch from MSW to this API without changes.
package store

import (
	"errors"
	"time"
)

// ErrNotFound is returned when a looked-up row does not exist (or is not
// visible to the caller).
var ErrNotFound = errors.New("not found")

// ErrInvalid wraps input that fails domain validation.
type ErrInvalid struct{ Msg string }

func (e ErrInvalid) Error() string { return e.Msg }

// ErrConflict is returned when a write collides with existing data, e.g. an
// email that already has an account.
type ErrConflict struct{ Msg string }

func (e ErrConflict) Error() string { return e.Msg }

type User struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	AvatarURL *string `json:"avatarUrl,omitempty"`
	Locale    string  `json:"locale"`
	Role      string  `json:"role"`
	// PrivacyVersion is the privacy policy version the user accepted, if any.
	PrivacyVersion *string `json:"privacyVersion,omitempty"`
}

func (u User) IsAdmin() bool { return u.Role == "admin" }

type Option struct {
	ID    string `json:"id"` // 'A'..'E'
	Label string `json:"label"`
	// Feedback and MaterialID explain a wrong option. They are written by
	// admins and only loaded for authoring; public questions never carry them.
	Feedback   *string `json:"feedback,omitempty"`
	MaterialID *string `json:"materialId,omitempty"`
}

// Question is the union of the question types (apps/web/src/features/questions/types.ts):
//
//	multiple-choice  Options + CorrectOptionID
//	true-false       CorrectAnswer
//	multi-select     Options + CorrectOptionIDs (pick all that apply)
//	ordering         Options + CorrectOrder (option ids in the right order)
//	output           Code + CodeLanguage + ExpectedOutput (predict what it prints)
//	flashcard        Prompt is the front, Explanation the back; self-graded (true = knew it)
type Question struct {
	ID               string   `json:"id"`
	Type             string   `json:"type"`
	Prompt           string   `json:"prompt"`
	Tags             []string `json:"tags"`
	Difficulty       *string  `json:"difficulty,omitempty"`
	Explanation      string   `json:"explanation"`
	Options          []Option `json:"options,omitempty"`
	CorrectOptionID  *string  `json:"correctOptionId,omitempty"`
	CorrectAnswer    *bool    `json:"correctAnswer,omitempty"`
	CorrectOptionIDs []string `json:"correctOptionIds,omitempty"`
	CorrectOrder     []string `json:"correctOrder,omitempty"`
	Code             *string  `json:"code,omitempty"`
	CodeLanguage     *string  `json:"codeLanguage,omitempty"`
	ExpectedOutput   *string  `json:"expectedOutput,omitempty"`
}

// HasOptions reports whether the type stores answer options.
func HasOptions(questionType string) bool {
	switch questionType {
	case "multiple-choice", "multi-select", "ordering":
		return true
	}
	return false
}

// Correct returns the answer a submission is graded against: an option key,
// a boolean, a list of option keys, or the expected output text.
func (q Question) Correct() any {
	switch q.Type {
	case "multiple-choice":
		if q.CorrectOptionID != nil {
			return *q.CorrectOptionID
		}
	case "true-false":
		if q.CorrectAnswer != nil {
			return *q.CorrectAnswer
		}
	case "multi-select":
		return q.CorrectOptionIDs
	case "ordering":
		return q.CorrectOrder
	case "output":
		if q.ExpectedOutput != nil {
			return *q.ExpectedOutput
		}
	case "flashcard":
		return true
	}
	return nil
}

type QuestionsPage struct {
	Items      []Question `json:"items"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
	Total      int        `json:"total"`
	TotalPages int        `json:"totalPages"`
}

type SubmitAnswerResult struct {
	QuestionID    string `json:"questionId"`
	Correct       bool   `json:"correct"`
	CorrectAnswer any    `json:"correctAnswer"`
	// NextReviewAt is when spaced repetition will bring the question back.
	NextReviewAt *time.Time `json:"nextReviewAt,omitempty"`
	// Feedback explains the wrong options picked, when the author wrote some.
	Feedback []OptionFeedback `json:"feedback,omitempty"`
}

type Comment struct {
	ID         string    `json:"id"`
	QuestionID string    `json:"questionId"`
	UserID     string    `json:"userId"`
	UserName   string    `json:"userName"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"createdAt"`
	// Hidden is only ever true in an admin's view; others don't get hidden comments.
	Hidden bool `json:"hidden"`
	// ReportedByMe tells the viewer they already reported it.
	ReportedByMe bool `json:"reportedByMe"`
}

type Note struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	QuestionID string    `json:"questionId"`
	Body       string    `json:"body"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type AnswerStat struct {
	OptionID   string  `json:"optionId"`
	Label      string  `json:"label"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

type QuestionStats struct {
	QuestionID     string       `json:"questionId"`
	TotalResponses int          `json:"totalResponses"`
	Distribution   []AnswerStat `json:"distribution"`
}

type BugReport struct {
	ID         string    `json:"id"`
	QuestionID string    `json:"questionId"`
	UserID     string    `json:"userId"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"createdAt"`
	Status     string    `json:"status"`
}

type Material struct {
	ID                 string   `json:"id"`
	Type               string   `json:"type"`
	Title              string   `json:"title"`
	URL                string   `json:"url"`
	Author             *string  `json:"author,omitempty"`
	Description        *string  `json:"description,omitempty"`
	Tags               []string `json:"tags"`
	RelatedQuestionIDs []string `json:"relatedQuestionIds,omitempty"`
}

type CustomTest struct {
	ID               string    `json:"id"`
	OwnerID          string    `json:"ownerId"`
	Name             string    `json:"name"`
	QuestionIDs      []string  `json:"questionIds"`
	Timed            bool      `json:"timed"`
	DurationMinutes  *int      `json:"durationMinutes,omitempty"`
	ShuffleQuestions bool      `json:"shuffleQuestions"`
	ShuffleOptions   bool      `json:"shuffleOptions"`
	CreatedAt        time.Time `json:"createdAt"`
	// Draft summarises an unfinished attempt, if there is one.
	Draft *DraftSummary `json:"draft,omitempty"`
}

type TestAttempt struct {
	ID          string         `json:"id"`
	TestID      string         `json:"testId"`
	UserID      string         `json:"userId"`
	Mode        string         `json:"mode"`
	Answers     map[string]any `json:"answers"`
	Score       int            `json:"score"`
	StartedAt   time.Time      `json:"startedAt"`
	SubmittedAt *time.Time     `json:"submittedAt,omitempty"`
}

type TestSubmitResultItem struct {
	QuestionID    string           `json:"questionId"`
	Correct       bool             `json:"correct"`
	GivenAnswer   any              `json:"givenAnswer,omitempty"`
	CorrectAnswer any              `json:"correctAnswer"`
	Feedback      []OptionFeedback `json:"feedback,omitempty"`
}

type TestSubmitResult struct {
	Attempt   TestAttempt            `json:"attempt"`
	Total     int                    `json:"total"`
	Score     int                    `json:"score"`
	Breakdown []TestSubmitResultItem `json:"breakdown"`
}

type SearchResultItem struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle,omitempty"`
}

type SearchResults struct {
	Questions []SearchResultItem `json:"questions"`
	Materials []SearchResultItem `json:"materials"`
	Tests     []SearchResultItem `json:"tests"`
}

type AdminStats struct {
	Totals struct {
		Questions        int `json:"questions"`
		Materials        int `json:"materials"`
		Users            int `json:"users"`
		Tests            int `json:"tests"`
		TestAttempts     int `json:"testAttempts"`
		AnswersSubmitted int `json:"answersSubmitted"`
		Bookmarks        int `json:"bookmarks"`
		Comments         int `json:"comments"`
		BugReports       int `json:"bugReports"`
	} `json:"totals"`
	QuestionsByType       []TypeCount       `json:"questionsByType"`
	QuestionsByDifficulty []DifficultyCount `json:"questionsByDifficulty"`
	MaterialsByType       []TypeCount       `json:"materialsByType"`
	AnswersByTag          []TagCount        `json:"answersByTag"`
	Correctness           struct {
		Correct   int `json:"correct"`
		Incorrect int `json:"incorrect"`
	} `json:"correctness"`
}

type TypeCount struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
}

type DifficultyCount struct {
	Difficulty string `json:"difficulty"`
	Count      int    `json:"count"`
}

type TagCount struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}
