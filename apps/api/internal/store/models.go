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

type User struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	AvatarURL *string `json:"avatarUrl,omitempty"`
	Locale    string  `json:"locale"`
	Role      string  `json:"role"`
}

func (u User) IsAdmin() bool { return u.Role == "admin" }

type Option struct {
	ID    string `json:"id"` // 'A'..'E'
	Label string `json:"label"`
}

// Question is the union of MultipleChoiceQuestion and TrueFalseQuestion:
// Options/CorrectOptionID are set for 'multiple-choice', CorrectAnswer for
// 'true-false'.
type Question struct {
	ID              string   `json:"id"`
	Type            string   `json:"type"`
	Prompt          string   `json:"prompt"`
	Tags            []string `json:"tags"`
	Difficulty      *string  `json:"difficulty,omitempty"`
	Explanation     string   `json:"explanation"`
	Options         []Option `json:"options,omitempty"`
	CorrectOptionID *string  `json:"correctOptionId,omitempty"`
	CorrectAnswer   *bool    `json:"correctAnswer,omitempty"`
}

// Correct returns the answer value a submission must equal: the
// option key for multiple choice, or the boolean for true/false.
func (q Question) Correct() any {
	if q.Type == "multiple-choice" && q.CorrectOptionID != nil {
		return *q.CorrectOptionID
	}
	if q.CorrectAnswer != nil {
		return *q.CorrectAnswer
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
}

type Comment struct {
	ID         string    `json:"id"`
	QuestionID string    `json:"questionId"`
	UserID     string    `json:"userId"`
	UserName   string    `json:"userName"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"createdAt"`
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
	QuestionID    string `json:"questionId"`
	Correct       bool   `json:"correct"`
	GivenAnswer   any    `json:"givenAnswer,omitempty"`
	CorrectAnswer any    `json:"correctAnswer"`
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
