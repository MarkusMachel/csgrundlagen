package store

import (
	"slices"
	"strings"
)

// maxAnswerKeyLen bounds how much of a typed (output) answer is stored.
const maxAnswerKeyLen = 2000

// AnswerKey encodes a submitted answer the way question_answers stores it:
// an option key ("B"), "true"/"false", option keys joined by commas for
// multi-select and ordering ("A,C"), or the typed text for output questions.
func AnswerKey(v any) string {
	switch a := v.(type) {
	case bool:
		if a {
			return "true"
		}
		return "false"
	case string:
		if len(a) > maxAnswerKeyLen {
			return a[:maxAnswerKeyLen]
		}
		return a
	default:
		if ids, ok := stringList(v); ok {
			return strings.Join(ids, ",")
		}
		return "unanswered"
	}
}

// stringList accepts a JSON array of strings (decoded as []any) or []string.
func stringList(v any) ([]string, bool) {
	switch a := v.(type) {
	case []string:
		return a, true
	case []any:
		out := make([]string, 0, len(a))
		for _, x := range a {
			s, ok := x.(string)
			if !ok {
				return nil, false
			}
			out = append(out, s)
		}
		return out, true
	}
	return nil, false
}

// NormalizeOutput makes predicted and expected program output comparable:
// Windows line endings, trailing spaces and surrounding blank lines don't
// count, everything else (case, inner spacing, order) does.
func NormalizeOutput(s string) string {
	lines := strings.Split(strings.ReplaceAll(s, "\r\n", "\n"), "\n")
	for i, l := range lines {
		lines[i] = strings.TrimRight(l, " \t")
	}
	return strings.Trim(strings.Join(lines, "\n"), "\n")
}

func isCorrect(q Question, given any) bool {
	if given == nil {
		return false
	}
	switch q.Type {
	case "multiple-choice":
		s, ok := given.(string)
		return ok && q.CorrectOptionID != nil && s == *q.CorrectOptionID
	case "true-false":
		b, ok := given.(bool)
		return ok && q.CorrectAnswer != nil && b == *q.CorrectAnswer
	case "multi-select":
		ids, ok := stringList(given)
		if !ok || len(ids) != len(q.CorrectOptionIDs) {
			return false
		}
		a, b := slices.Clone(ids), slices.Clone(q.CorrectOptionIDs)
		slices.Sort(a)
		slices.Sort(b)
		return slices.Equal(slices.Compact(a), b)
	case "ordering":
		ids, ok := stringList(given)
		return ok && slices.Equal(ids, q.CorrectOrder)
	case "output":
		s, ok := given.(string)
		return ok && q.ExpectedOutput != nil && NormalizeOutput(s) == NormalizeOutput(*q.ExpectedOutput)
	}
	return false
}

// ValidAnswerShape reports whether a submitted answer has a type any
// question could accept, before the question itself is looked up.
func ValidAnswerShape(v any) bool {
	switch a := v.(type) {
	case bool:
		return true
	case string:
		return len(a) <= 10_000
	default:
		ids, ok := stringList(v)
		return ok && len(ids) <= 5
	}
}
