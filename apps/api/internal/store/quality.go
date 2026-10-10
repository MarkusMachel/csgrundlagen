package store

import (
	"context"
	"sort"
	"strings"
)

// Thresholds for the question quality report. A question needs MinAnswers
// answers before any flag is raised, so a couple of lucky guesses don't
// condemn it.
const (
	QualityMinAnswers  = 10
	tooEasyRate        = 0.95
	tooHardRate        = 0.30
	deadDistractorRate = 0.03
	// distractors need more data than the overall rate before we judge them
	distractorMinAnswers = 20
)

// OptionPicks is how often one option was chosen.
type OptionPicks struct {
	ID      string  `json:"id"`
	Label   string  `json:"label"`
	Correct bool    `json:"correct"`
	Picks   int     `json:"picks"`
	Share   float64 `json:"share"` // of all answers to the question
}

// QualityItem is one question in the quality report.
type QualityItem struct {
	QuestionID  string        `json:"questionId"`
	Prompt      string        `json:"prompt"`
	Type        string        `json:"type"`
	Tags        []string      `json:"tags"`
	Answers     int           `json:"answers"`
	CorrectRate float64       `json:"correctRate"`
	Flags       []string      `json:"flags"`
	Options     []OptionPicks `json:"options,omitempty"`
	OpenBugs    int           `json:"openBugs"`
}

// QualityReport is the admin's view of how well questions work.
type QualityReport struct {
	MinAnswers int            `json:"minAnswers"`
	Analysed   int            `json:"analysed"` // questions with enough answers
	TooFew     int            `json:"tooFew"`   // questions still below MinAnswers
	Items      []QualityItem  `json:"items"`    // flagged first, then by answers
	FlagCounts map[string]int `json:"flagCounts"`
}

// Flags:
//
//	too_easy          ≥95% right: teaches little, maybe the answer is obvious
//	too_hard          ≤30% right: unclear wording or a wrong answer key
//	wrong_key         a wrong option is picked more often than the right one
//	dead_distractor   a wrong option almost nobody picks (<3%): replace it
//	open_bug_reports  users reported a problem that's still open
func (s *Store) QualityReport(ctx context.Context) (QualityReport, error) {
	rep := QualityReport{MinAnswers: QualityMinAnswers, FlagCounts: map[string]int{}, Items: []QualityItem{}}

	rows, err := s.pool.Query(ctx, `
		SELECT q.id, q.prompt, q.type::text,
		       COALESCE((SELECT array_agg(t.name ORDER BY t.name) FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
		                 WHERE qt.question_id = q.id), '{}'),
		       count(a.*), count(a.*) FILTER (WHERE a.is_correct),
		       (SELECT count(*) FROM bug_reports b WHERE b.question_id = q.id AND b.status = 'open')
		FROM questions q LEFT JOIN question_answers a ON a.question_id = q.id
		GROUP BY q.id`)
	if err != nil {
		return rep, err
	}
	items := map[string]*QualityItem{}
	for rows.Next() {
		var it QualityItem
		var correct int
		if err := rows.Scan(&it.QuestionID, &it.Prompt, &it.Type, &it.Tags, &it.Answers, &correct, &it.OpenBugs); err != nil {
			rows.Close()
			return rep, err
		}
		if it.Answers > 0 {
			it.CorrectRate = float64(correct) / float64(it.Answers)
		}
		it.Flags = []string{}
		items[it.QuestionID] = &it
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return rep, err
	}

	// Option picks for the option-based types.
	opts, err := s.pool.Query(ctx, `
		SELECT o.question_id, o.option_key, o.label, o.is_correct FROM question_options o
		JOIN questions q ON q.id = o.question_id
		WHERE q.type IN ('multiple-choice', 'multi-select')
		ORDER BY o.question_id, o.option_key`)
	if err != nil {
		return rep, err
	}
	for opts.Next() {
		var qid string
		var o OptionPicks
		if err := opts.Scan(&qid, &o.ID, &o.Label, &o.Correct); err != nil {
			opts.Close()
			return rep, err
		}
		if it := items[qid]; it != nil {
			it.Options = append(it.Options, o)
		}
	}
	opts.Close()
	if err := opts.Err(); err != nil {
		return rep, err
	}
	picks, err := s.pool.Query(ctx, `
		SELECT a.question_id, a.answer_value, count(*) FROM question_answers a
		JOIN questions q ON q.id = a.question_id
		WHERE q.type IN ('multiple-choice', 'multi-select')
		GROUP BY a.question_id, a.answer_value`)
	if err != nil {
		return rep, err
	}
	for picks.Next() {
		var qid, value string
		var n int
		if err := picks.Scan(&qid, &value, &n); err != nil {
			picks.Close()
			return rep, err
		}
		it := items[qid]
		if it == nil {
			continue
		}
		for _, key := range strings.Split(value, ",") { // multi-select stores "A,C"
			for i := range it.Options {
				if it.Options[i].ID == key {
					it.Options[i].Picks += n
				}
			}
		}
	}
	picks.Close()
	if err := picks.Err(); err != nil {
		return rep, err
	}

	for _, it := range items {
		for i := range it.Options {
			if it.Answers > 0 {
				it.Options[i].Share = float64(it.Options[i].Picks) / float64(it.Answers)
			}
		}
		if it.OpenBugs > 0 {
			it.Flags = append(it.Flags, "open_bug_reports")
		}
		if it.Answers < QualityMinAnswers {
			rep.TooFew++
		} else {
			rep.Analysed++
			if it.CorrectRate >= tooEasyRate {
				it.Flags = append(it.Flags, "too_easy")
			}
			if it.CorrectRate <= tooHardRate {
				it.Flags = append(it.Flags, "too_hard")
			}
			if it.Type == "multiple-choice" {
				best := 0
				for _, o := range it.Options {
					if o.Correct {
						best = o.Picks
					}
				}
				for _, o := range it.Options {
					if !o.Correct && o.Picks > best {
						it.Flags = append(it.Flags, "wrong_key")
						break
					}
				}
			}
			if it.Answers >= distractorMinAnswers {
				for _, o := range it.Options {
					if !o.Correct && o.Share < deadDistractorRate {
						it.Flags = append(it.Flags, "dead_distractor")
						break
					}
				}
			}
		}
		for _, f := range it.Flags {
			rep.FlagCounts[f]++
		}
		rep.Items = append(rep.Items, *it)
	}

	// Most serious first: wrong keys and bug reports, then by flag count, then by answers.
	weight := func(it QualityItem) int {
		w := 0
		for _, f := range it.Flags {
			switch f {
			case "wrong_key", "open_bug_reports":
				w += 10
			default:
				w++
			}
		}
		return w
	}
	sort.SliceStable(rep.Items, func(i, j int) bool {
		wi, wj := weight(rep.Items[i]), weight(rep.Items[j])
		if wi != wj {
			return wi > wj
		}
		if rep.Items[i].Answers != rep.Items[j].Answers {
			return rep.Items[i].Answers > rep.Items[j].Answers
		}
		return rep.Items[i].QuestionID < rep.Items[j].QuestionID
	})
	return rep, nil
}
